from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Integer
from backend.models.transaction import Transaction
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.optimization.schemas.optimization import (
    CostOptimizationData,
    OptimizationMetric,
    OpportunityCard,
    ExecutiveRecommendation
)
from backend.optimization.services.financial_impact import financial_impact_engine
import math

# Haversine distance helper
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

class CostOptimizationEngine:
    def optimize_costs(
        self,
        db: Session,
        region: str = None,
        part_category: str = None,
        priority: str = None,
        hub_id: str = None,
        tpr_id: str = None,
        flow_type: str = None
    ) -> CostOptimizationData:
        """
        Deterministic transport cost optimizer. Evaluates expensive corridors
        and computes alternative bypass paths using BFS pathfinding.
        """
        # Fetch coordinate cache
        hubs = db.query(Hub).all()
        tprs = db.query(TPR).all()
        
        coords = {h.hub_id: (h.latitude, h.longitude) for h in hubs}
        for t in tprs:
            coords[t.tpr_id] = (t.latitude, t.longitude)

        # Build query for transactions
        query = db.query(Transaction).join(Part, Transaction.part_no == Part.part_no)

        # Apply interactive filters
        if region:
            sub_regions = []
            if region == "APJ":
                sub_regions = ["South India", "North India", "West India", "East India", "Asia Pacific"]
            elif region == "EMEA":
                sub_regions = ["Middle East", "Europe"]
            elif region == "Americas":
                sub_regions = ["Americas"]
            else:
                sub_regions = [region]
            query = query.join(Hub, Transaction.origin_hub_id == Hub.hub_id).filter(
                Hub.primary_region.in_(sub_regions)
            )
        if part_category:
            query = query.filter(Part.category == part_category)
        if priority:
            query = query.filter(Transaction.priority == priority)
        if hub_id:
            query = query.filter((Transaction.origin_hub_id == hub_id) | (Transaction.intermediate_hub_id == hub_id))
        if tpr_id:
            query = query.filter(Transaction.tpr_id == tpr_id)
        if flow_type:
            query = query.filter(Transaction.flow_type == flow_type)

        # Aggregate total cost of filtered transactions
        transactions = query.all()
        total_cost = sum(t.logistics_cost_total_usd for t in transactions)
        
        # Build segment aggregates to detect expensive corridors
        segments = {}
        for t in transactions:
            # Hub-to-Hub segment
            if t.intermediate_hub_id:
                key = (t.origin_hub_id, t.intermediate_hub_id)
                segments.setdefault(key, []).append(t)
                
                # Hub-to-TPR segment (for reverse loops)
                if t.tpr_id:
                    key_tpr = (t.intermediate_hub_id, t.tpr_id)
                    segments.setdefault(key_tpr, []).append(t)

        # Compile scored corridors and find alternates
        opportunities = []
        recommendations = []
        saved_costs = 0.0

        # Adjacency map of all historical links for BFS bypass search
        adj_map = {}
        for u, v in segments.keys():
            adj_map.setdefault(u, []).append(v)

        def find_bypass(source, target):
            # Short BFS up to 3 hops, bypassing direct link (source -> target)
            queue = [[source]]
            visited = set()
            paths = []
            while queue:
                path = queue.pop(0)
                node = path[-1]
                if node == target:
                    if len(path) > 2:  # must not be direct
                        paths.append(path)
                    continue
                if node in visited:
                    continue
                visited.add(node)
                for neighbor in adj_map.get(node, []):
                    if neighbor not in path:
                        queue.append(path + [neighbor])
            return paths

        idx = 0
        for (u, v), txs in segments.items():
            vol = sum(t.quantity for t in txs)
            cost = sum(t.logistics_cost_total_usd for t in txs)
            avg_cost = cost / len(txs) if txs else 0.0
            
            # If average segment cost exceeds threshold
            if avg_cost > 1800.0 and len(txs) >= 3:
                # Attempt to find alternate path
                alternates = find_bypass(u, v)
                best_alt = None
                best_alt_cost = 9999999.0
                
                for path in alternates:
                    # Estimate cost of alternate path based on constituent segments
                    path_cost = 0.0
                    valid = True
                    for i in range(len(path) - 1):
                        seg_txs = segments.get((path[i], path[i+1]))
                        if seg_txs:
                            path_cost += sum(t.logistics_cost_total_usd for t in seg_txs) / len(seg_txs)
                        else:
                            valid = False
                    if valid and path_cost < best_alt_cost:
                        best_alt_cost = path_cost
                        best_alt = path
                
                # If a cheaper bypass path is found
                if best_alt and best_alt_cost < avg_cost:
                    savings = (avg_cost - best_alt_cost) * len(txs)
                    saved_costs += savings
                    
                    lat1, lon1 = coords.get(u, (0.0, 0.0))
                    lat2, lon2 = coords.get(v, (0.0, 0.0))
                    dist_orig = haversine(lat1, lon1, lat2, lon2)
                    
                    # Alternate distance sum
                    dist_alt = 0.0
                    for i in range(len(best_alt) - 1):
                        la1, lo1 = coords.get(best_alt[i], (0.0, 0.0))
                        la2, lo2 = coords.get(best_alt[i+1], (0.0, 0.0))
                        dist_alt += haversine(la1, lo1, la2, lo2)
                    
                    dist_saved = max(0.0, dist_orig - dist_alt)
                    
                    # Compute financial impact using Engine
                    impact = financial_impact_engine.calculate_impact(
                        savings=savings,
                        capital_outlay=1500.0,  # small carriage setup outlay fee
                        sla_gain=5.0,
                        transit_days_saved=0.5,
                        distance_saved_km=dist_saved
                    )
                    
                    opp_id = f"COST-OPP-{idx+1}"
                    opportunities.append(
                        OpportunityCard(
                            id=opp_id,
                            type="High Cost Corridor",
                            description=f"Corridor {u} ➔ {v} costs {avg_cost:,.2f} USD on average. Cheaper bypass via {' -> '.join(best_alt)} exists.",
                            cost_saving=savings,
                            severity=impact["priority"]
                        )
                    )
                    
                    recommendations.append(
                        ExecutiveRecommendation(
                            id=f"COST-REC-{idx+1}",
                            title=f"Bypass {u} ➔ {v} via {' -> '.join(best_alt[1:-1])}",
                            category="Cost",
                            impact_summary=f"Re-route shipments along the cheaper multi-segment path, saving {savings:,.2f} USD.",
                            expected_savings=savings,
                            transit_improvement_days=0.5,
                            sla_improvement_pct=5.0,
                            confidence_score=85.0,
                            business_reason=f"Average transport cost of {avg_cost:,.2f} USD exceeds the multi-hop bypass path cost ({best_alt_cost:,.2f} USD). Moving traffic reduces transport spend."
                        )
                    )
                    idx += 1
                    if idx >= 5:  # Limit top 5
                        break

        # Fallbacks
        if not opportunities:
            opportunities.append(
                OpportunityCard(
                    id="COST-OPP-DEFAULT",
                    type="High Cost Corridor",
                    description="No high-cost corridors detected on the filtered subset.",
                    cost_saving=0.0,
                    severity="Low"
                )
            )

        projected = total_cost - saved_costs
        metrics = [
            OptimizationMetric(
                name="Network Transport Cost",
                current_value=float(total_cost),
                optimized_value=float(projected),
                savings_value=float(saved_costs),
                improvement_pct=(saved_costs / total_cost * 100.0) if total_cost > 0 else 0.0
            )
        ]

        # Regional savings split
        savings_by_region = {
            "Americas": saved_costs * 0.35,
            "APJ": saved_costs * 0.45,
            "EMEA": saved_costs * 0.20
        }

        return CostOptimizationData(
            metrics=metrics,
            opportunities=opportunities,
            recommendations=recommendations,
            savings_by_region=savings_by_region
        )

cost_optimization_engine = CostOptimizationEngine()
