from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, cast, Integer, or_
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.models.transaction import Transaction
from backend.schemas.network import (
    NetworkNode, 
    NetworkLink, 
    NetworkKPIs, 
    NetworkOverviewSchema,
    NetworkInsightCard
)

class NetworkService:
    def get_network_overview(
        self,
        db: Session,
        flow_type: str = None,
        country: str = None,
        region: str = None,
        hub_type: str = None,
        tpr_id: str = None,
        part_category: str = None,
        priority: str = None,
        sla_status: str = None,
        min_cost: float = None,
        max_cost: float = None,
        min_transit: float = None,
        max_transit: float = None,
        timeline_month: int = None,
        search: str = None
    ) -> dict:
        """
        Retrieves complete network topology (nodes, links) and aggregates 
        advanced control-tower KPIs and operational insights based on filters.
        """
        # Aliases for joins
        OriginHub = aliased(Hub)
        IntermediateHub = aliased(Hub)

        # 1. Base Query with full relational joins
        query = db.query(Transaction)\
            .join(Part, Transaction.part_no == Part.part_no)\
            .outerjoin(OriginHub, Transaction.origin_hub_id == OriginHub.hub_id)\
            .outerjoin(IntermediateHub, Transaction.intermediate_hub_id == IntermediateHub.hub_id)\
            .outerjoin(TPR, Transaction.tpr_id == TPR.tpr_id)

        # 2. Apply Advanced Filters
        if flow_type:
            query = query.filter(Transaction.flow_type == flow_type)
        
        if country:
            query = query.filter(
                or_(
                    OriginHub.country == country,
                    IntermediateHub.country == country,
                    TPR.country == country
                )
            )

        if region:
            query = query.filter(
                or_(
                    OriginHub.primary_region == region,
                    IntermediateHub.primary_region == region
                )
            )

        if hub_type:
            query = query.filter(
                or_(
                    OriginHub.hub_type == hub_type,
                    IntermediateHub.hub_type == hub_type
                )
            )

        if tpr_id:
            query = query.filter(Transaction.tpr_id == tpr_id)

        if part_category:
            query = query.filter(Part.category == part_category)

        if priority:
            query = query.filter(Transaction.priority == priority)

        if sla_status:
            if sla_status.lower() == "breached":
                query = query.filter(Transaction.sla_breach == True)
            elif sla_status.lower() == "met":
                query = query.filter(Transaction.sla_breach == False)

        if min_cost is not None:
            query = query.filter(Transaction.logistics_cost_total_usd >= min_cost)
        if max_cost is not None:
            query = query.filter(Transaction.logistics_cost_total_usd <= max_cost)

        if min_transit is not None:
            query = query.filter(Transaction.transit_days_actual >= min_transit)
        if max_transit is not None:
            query = query.filter(Transaction.transit_days_actual <= max_transit)

        if timeline_month:
            # SQLite safe month extractor using strftime
            query = query.filter(func.strftime("%m", Transaction.dispatch_date) == f"{timeline_month:02d}")

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.transaction_id.like(search_term),
                    Transaction.source_location.like(search_term),
                    Transaction.destination_location.like(search_term),
                    Part.part_no.like(search_term),
                    Part.part_description.like(search_term),
                    OriginHub.hub_name.like(search_term),
                    IntermediateHub.hub_name.like(search_term),
                    TPR.tpr_name.like(search_term),
                    OriginHub.country.like(search_term),
                    TPR.country.like(search_term),
                    OriginHub.primary_region.like(search_term)
                )
            )

        # 3. Create CTE or Subquery of Filtered Dataset for edge aggregation
        subquery = query.subquery()

        # 4. Fetch Master Nodes
        db_hubs = db.query(Hub).all()
        db_tprs = db.query(TPR).all()
        
        hub_coords = {h.hub_id: [h.latitude, h.longitude] for h in db_hubs}
        tpr_coords = {t.tpr_id: [t.latitude, t.longitude] for t in db_tprs}

        # Query filtered traffic volume per node
        inbound_traffic = dict(
            db.query(
                subquery.c.intermediate_hub_id, 
                func.count(subquery.c.transaction_id)
            ).filter(subquery.c.intermediate_hub_id.isnot(None))\
             .group_by(subquery.c.intermediate_hub_id).all()
        )
        
        outbound_traffic = dict(
            db.query(
                subquery.c.origin_hub_id, 
                func.count(subquery.c.transaction_id)
            ).filter(subquery.c.origin_hub_id.isnot(None))\
             .group_by(subquery.c.origin_hub_id).all()
        )

        tpr_inbound = dict(
            db.query(
                subquery.c.tpr_id, 
                func.count(subquery.c.transaction_id)
            ).filter(subquery.c.tpr_id.isnot(None))\
             .group_by(subquery.c.tpr_id).all()
        )

        nodes = []
        congested_nodes_count = 0
        total_hub_util = 0.0

        for h in db_hubs:
            inbound = inbound_traffic.get(h.hub_id, 0)
            outbound = outbound_traffic.get(h.hub_id, 0)
            total_hub_util += h.utilisation_pct

            status = "Normal"
            if h.utilisation_pct >= 0.85:
                status = "Overloaded"
                congested_nodes_count += 1
            elif h.utilisation_pct < 0.20:
                status = "Underutilised"

            nodes.append(
                NetworkNode(
                    id=h.hub_id,
                    name=h.hub_name,
                    type=h.hub_type,
                    city=h.city,
                    country=h.country,
                    latitude=h.latitude,
                    longitude=h.longitude,
                    current_stock=h.current_stock_level,
                    capacity=h.inventory_capacity,
                    utilisation=h.utilisation_pct,
                    status=status,
                    inbound_shipments_count=inbound,
                    outbound_shipments_count=outbound
                )
            )

        total_tpr_capacity = 0
        for t in db_tprs:
            inbound = tpr_inbound.get(t.tpr_id, 0)
            total_tpr_capacity += t.repair_capacity_per_day

            ratio = t.current_workload / t.repair_capacity_per_day if t.repair_capacity_per_day > 0 else 0.0
            status = "Normal"
            if ratio >= 1.25:
                status = "Overloaded"
                congested_nodes_count += 1
            elif ratio < 0.30:
                status = "Underutilised"

            nodes.append(
                NetworkNode(
                    id=t.tpr_id,
                    name=t.tpr_name,
                    type="Repair Center",
                    city=t.city,
                    country=t.country,
                    latitude=t.latitude,
                    longitude=t.longitude,
                    current_stock=t.current_workload,
                    capacity=t.repair_capacity_per_day,
                    utilisation=ratio,
                    status=status,
                    inbound_shipments_count=inbound,
                    outbound_shipments_count=0
                )
            )

        # 5. Extract Filtered Links
        links = []
        
        # 5.1 Hub-to-Hub Segment Aggregation
        h2h_results = db.query(
            subquery.c.origin_hub_id,
            subquery.c.intermediate_hub_id,
            subquery.c.flow_type,
            func.count(subquery.c.transaction_id).label("volume"),
            func.sum(subquery.c.logistics_cost_total_usd).label("cost"),
            func.avg(subquery.c.transit_days_actual).label("transit_days"),
            func.sum(cast(subquery.c.sla_breach, Integer)).label("breaches")
        ).filter(
            subquery.c.intermediate_hub_id.isnot(None)
        ).group_by(
            subquery.c.origin_hub_id,
            subquery.c.intermediate_hub_id,
            subquery.c.flow_type
        ).all()

        for res in h2h_results:
            source = res.origin_hub_id
            target = res.intermediate_hub_id
            
            if source in hub_coords and target in hub_coords:
                avg_cost = res.cost / res.volume if res.volume > 0 else 0.0
                breach_rate = (res.breaches / res.volume) * 100.0 if res.volume > 0 else 0.0
                
                links.append(
                    NetworkLink(
                        source_id=source,
                        target_id=target,
                        flow_type=res.flow_type,
                        volume=res.volume,
                        total_cost=float(res.cost or 0.0),
                        avg_cost_per_unit=float(avg_cost),
                        sla_breach_rate=float(breach_rate),
                        avg_transit_days=float(res.transit_days or 0.0),
                        source_coordinates=hub_coords[source],
                        target_coordinates=hub_coords[target]
                    )
                )

        # 5.2 Hub-to-TPR Segment Aggregation
        h2t_results = db.query(
            subquery.c.intermediate_hub_id,
            subquery.c.tpr_id,
            subquery.c.flow_type,
            func.count(subquery.c.transaction_id).label("volume"),
            func.sum(subquery.c.logistics_cost_total_usd).label("cost"),
            func.avg(subquery.c.transit_days_actual).label("transit_days"),
            func.sum(cast(subquery.c.sla_breach, Integer)).label("breaches")
        ).filter(
            subquery.c.intermediate_hub_id.isnot(None),
            subquery.c.tpr_id.isnot(None)
        ).group_by(
            subquery.c.intermediate_hub_id,
            subquery.c.tpr_id,
            subquery.c.flow_type
        ).all()

        for res in h2t_results:
            source = res.intermediate_hub_id
            target = res.tpr_id
            
            if source in hub_coords and target in tpr_coords:
                avg_cost = res.cost / res.volume if res.volume > 0 else 0.0
                breach_rate = (res.breaches / res.volume) * 100.0 if res.volume > 0 else 0.0
                
                links.append(
                    NetworkLink(
                        source_id=source,
                        target_id=target,
                        flow_type=res.flow_type,
                        volume=res.volume,
                        total_cost=float(res.cost or 0.0),
                        avg_cost_per_unit=float(avg_cost),
                        sla_breach_rate=float(breach_rate),
                        avg_transit_days=float(res.transit_days or 0.0),
                        source_coordinates=hub_coords[source],
                        target_coordinates=tpr_coords[target]
                    )
                )

        # 6. Global stats calculations on filtered transactions
        global_stats = db.query(
            func.count(subquery.c.transaction_id).label("total"),
            func.sum(subquery.c.logistics_cost_total_usd).label("cost"),
            func.avg(subquery.c.transit_days_actual).label("transit_days"),
            func.sum(cast(subquery.c.sla_breach, Integer)).label("breaches"),
            func.sum(cast(subquery.c.flow_type == "Forward", Integer)).label("forward"),
            func.sum(cast(subquery.c.flow_type == "Reverse", Integer)).label("reverse")
        ).first()

        total_txs = global_stats.total or 0
        total_cost = float(global_stats.cost or 0.0)
        avg_transit = float(global_stats.transit_days or 0.0)
        sla_breach = (global_stats.breaches / total_txs * 100.0) if total_txs > 0 else 0.0

        # Calculations for KPIs
        health_score = max(0.0, 100.0 - sla_breach)
        avg_lane_cost = total_cost / total_txs if total_txs > 0 else 0.0
        active_lanes = len(links)
        
        fwd_ratio = (global_stats.forward / total_txs) if total_txs > 0 else 0.0
        rev_ratio = (global_stats.reverse / total_txs) if total_txs > 0 else 0.0
        avg_hub_util = (total_hub_util / len(db_hubs)) if db_hubs else 0.0
        oper_avail = (1 - (congested_nodes_count / len(nodes))) * 100.0 if nodes else 100.0

        # Determine most connected hub
        node_connections = {}
        for l in links:
            node_connections[l.source_id] = node_connections.get(l.source_id, 0) + l.volume
            node_connections[l.target_id] = node_connections.get(l.target_id, 0) + l.volume
        
        most_connected_hub = max(node_connections, key=node_connections.get) if node_connections else "N/A"
        
        # Determine highest risk corridor (with threshold > 3 shipments to avoid outliers)
        risky_links = [l for l in links if l.volume >= 3]
        highest_risk_corridor = "N/A"
        if risky_links:
            worst_link = max(risky_links, key=lambda x: x.sla_breach_rate)
            highest_risk_corridor = f"{worst_link.source_id} ➔ {worst_link.target_id} ({worst_link.sla_breach_rate:.1f}%)"

        kpis = NetworkKPIs(
            total_nodes=len(nodes),
            total_lanes=active_lanes,
            average_lane_cost_usd=avg_lane_cost,
            sla_breach_rate=sla_breach,
            congested_nodes_count=congested_nodes_count,
            network_health_score=health_score,
            average_corridor_cost=avg_lane_cost,
            average_transit_time=avg_transit,
            active_corridors=active_lanes,
            most_connected_hub=most_connected_hub,
            highest_risk_corridor=highest_risk_corridor,
            average_hub_utilization=avg_hub_util,
            reverse_logistics_ratio=rev_ratio,
            forward_logistics_ratio=fwd_ratio,
            repair_center_capacity=total_tpr_capacity,
            operational_availability=oper_avail
        )

        # 7. Generate Insight Cards
        insights = []

        # 7.1 Most Expensive Corridor
        if links:
            max_cost_link = max(links, key=lambda x: x.total_cost)
            insights.append(
                NetworkInsightCard(
                    id="ins_expensive",
                    title="Most Expensive Corridor",
                    value=f"{max_cost_link.source_id} ➔ {max_cost_link.target_id}",
                    description=f"Accumulated total cost of {max_cost_link.total_cost:,.0f} USD. Average per unit: {max_cost_link.avg_cost_per_unit:,.2f} USD.",
                    metric_type="negative" if max_cost_link.avg_cost_per_unit > 2000 else "neutral"
                )
            )

            # 7.2 Highest Volume Corridor
            max_vol_link = max(links, key=lambda x: x.volume)
            insights.append(
                NetworkInsightCard(
                    id="ins_volume",
                    title="Highest Volume Corridor",
                    value=f"{max_vol_link.source_id} ➔ {max_vol_link.target_id}",
                    description=f"Transited a total volume of {max_vol_link.volume:,} parts. Average transit duration is {max_vol_link.avg_transit_days:.1f} days.",
                    metric_type="positive" if max_vol_link.sla_breach_rate < 30.0 else "neutral"
                )
            )

            # 7.3 Speed corridors
            fastest_link = min(links, key=lambda x: x.avg_transit_days)
            insights.append(
                NetworkInsightCard(
                    id="ins_fastest",
                    title="Fastest Courier Corridor",
                    value=f"{fastest_link.source_id} ➔ {fastest_link.target_id}",
                    description=f"Quickest average segment transit time of {fastest_link.avg_transit_days:.1f} days.",
                    metric_type="positive"
                )
            )

            slowest_link = max(links, key=lambda x: x.avg_transit_days)
            insights.append(
                NetworkInsightCard(
                    id="ins_slowest",
                    title="Slowest Segment Corridor",
                    value=f"{slowest_link.source_id} ➔ {slowest_link.target_id}",
                    description=f"Longest average segment transit time of {slowest_link.avg_transit_days:.1f} days.",
                    metric_type="negative"
                )
            )

        # 7.4 Most Congested Hub
        hubs_list = [n for n in nodes if n.type != "Repair Center"]
        if hubs_list:
            most_congested_hub = max(hubs_list, key=lambda x: x.utilisation)
            insights.append(
                NetworkInsightCard(
                    id="ins_congestion",
                    title="Most Congested Hub",
                    value=f"{most_congested_hub.name} ({most_congested_hub.id})",
                    description=f"Reached utilization rate of {most_congested_hub.utilisation * 100:.1f}%. Current stock load: {most_congested_hub.current_stock:,} items.",
                    metric_type="negative" if most_congested_hub.utilisation >= 0.85 else "neutral"
                )
            )

            most_efficient_hub = min(hubs_list, key=lambda x: x.utilisation)
            insights.append(
                NetworkInsightCard(
                    id="ins_efficient",
                    title="Most Available Hub Capacity",
                    value=f"{most_efficient_hub.name} ({most_efficient_hub.id})",
                    description=f"Lowest capacity load at {most_efficient_hub.utilisation * 100:.1f}% utilization.",
                    metric_type="positive"
                )
            )

        # 7.5 Most Active Repair Center
        tprs_list = [n for n in nodes if n.type == "Repair Center"]
        if tprs_list:
            most_active_tpr = max(tprs_list, key=lambda x: x.current_stock)
            insights.append(
                NetworkInsightCard(
                    id="ins_active_tpr",
                    title="Most Active Repair Center",
                    value=most_active_tpr.name,
                    description=f"Current workload: {most_active_tpr.current_stock} parts. Capacity limit: {most_active_tpr.capacity}/day.",
                    metric_type="neutral"
                )
            )

        # 7.6 SLA Regional Breaches (Grouped by region)
        sla_by_region = db.query(
            OriginHub.primary_region.label("region"),
            func.count(subquery.c.transaction_id).label("total"),
            func.sum(cast(subquery.c.sla_breach, Integer)).label("breaches")
        ).filter(
            subquery.c.origin_hub_id == OriginHub.hub_id
        ).group_by(OriginHub.primary_region).all()

        regional_breach_rates = {}
        for r in sla_by_region:
            if r.region and r.total > 5:
                regional_breach_rates[r.region] = (r.breaches / r.total) * 100.0

        if regional_breach_rates:
            worst_region = max(regional_breach_rates, key=regional_breach_rates.get)
            best_region = min(regional_breach_rates, key=regional_breach_rates.get)
            insights.append(
                NetworkInsightCard(
                    id="ins_worst_region",
                    title="Highest SLA Delay Region",
                    value=worst_region,
                    description=f"Average SLA breach frequency of {regional_breach_rates[worst_region]:.1f}% across all region origin corridors.",
                    metric_type="negative"
                )
            )
            insights.append(
                NetworkInsightCard(
                    id="ins_best_region",
                    title="Highest Performing SLA Region",
                    value=best_region,
                    description=f"Top performing region with breach rate of only {regional_breach_rates[best_region]:.1f}%.",
                    metric_type="positive"
                )
            )

        return {
            "kpis": kpis.model_dump(),
            "nodes": [n.model_dump() for n in nodes],
            "links": [l.model_dump() for l in links],
            "insights": [i.model_dump() for i in insights]
        }

network_service = NetworkService()
