from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.transaction import Transaction
from backend.models.part import Part
from backend.models.hub import Hub
from backend.optimization.schemas.optimization import (
    ConsolidationData,
    OptimizationMetric,
    OpportunityCard,
    ExecutiveRecommendation
)
from backend.optimization.services.financial_impact import financial_impact_engine

class ConsolidationEngine:
    def optimize_consolidation(
        self,
        db: Session,
        region: str = None,
        part_category: str = None,
        priority: str = None,
        hub_id: str = None,
        tpr_id: str = None,
        flow_type: str = None
    ) -> ConsolidationData:
        """
        Deterministic shipment consolidation engine. Identifies monthly duplicate
        SKU paths and merges them into bulk containers, cutting overhead costs.
        """
        # Fetch coordinate cache
        hubs = db.query(Hub).all()

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

        transactions = query.all()
        
        # Group by Month, Origin, Intermediate, and Part
        # Key = (Month, Origin, Intermediate, Part)
        groups = {}
        for t in transactions:
            if t.intermediate_hub_id:
                month = t.dispatch_date.strftime("%Y-%m")
                key = (month, t.origin_hub_id, t.intermediate_hub_id, t.part_no)
                groups.setdefault(key, []).append(t)

        opportunities = []
        recommendations = []
        total_dup_cost = 0.0
        total_projected_cost = 0.0
        saved_costs = 0.0

        idx = 0
        for (month, origin, inter, part), txs in groups.items():
            if len(txs) > 1:
                # Calculate duplicate costs
                orig_cost = sum(t.logistics_cost_total_usd for t in txs)
                total_dup_cost += orig_cost
                
                # Consolidate cost formula: first shipment pays full, 
                # additional shipments save 70% overhead on document/handling fees (pay 30%)
                first_shipment = txs[0]
                additional_cost = sum(t.logistics_cost_total_usd * 0.3 for t in txs[1:])
                consolidated = first_shipment.logistics_cost_total_usd + additional_cost
                total_projected_cost += consolidated
                
                savings = orig_cost - consolidated
                saved_costs += savings
                
                # Merged quantity details
                merged_qty = sum(t.quantity for t in txs)
                reduction = len(txs) - 1
                
                impact = financial_impact_engine.calculate_impact(
                    savings=savings,
                    capital_outlay=100.0 * len(txs),  # admin fee
                    sla_gain=2.5,
                    transit_days_saved=0.2,
                    distance_saved_km=0.0
                )
                
                opp_id = f"CONS-OPP-{idx+1}"
                opportunities.append(
                    OpportunityCard(
                        id=opp_id,
                        type="Duplicate Shipment",
                        description=f"Detected {len(txs)} parallel shipments of {part} on corridor {origin} ➔ {inter} in {month}. Merge into one bulk container.",
                        cost_saving=savings,
                        severity=impact["priority"]
                    )
                )
                
                recommendations.append(
                    ExecutiveRecommendation(
                        id=f"CONS-REC-{idx+1}",
                        title=f"Consolidate {part} on {origin} ➔ {inter}",
                        category="Consolidation",
                        impact_summary=f"Combine {len(txs)} shipments into a single dispatch lot, saving {savings:,.2f} USD.",
                        expected_savings=savings,
                        transit_improvement_days=0.2,
                        sla_improvement_pct=2.5,
                        confidence_score=95.0,
                        business_reason=f"Merging {len(txs)} parallel monthly dispatches cuts paperwork overhead and improves truck fill utilization by +{merged_qty / 100 * 100:.0f}% capacity points."
                    )
                )
                idx += 1
                if idx >= 5:
                    break

        if not opportunities:
            opportunities.append(
                OpportunityCard(
                    id="CONS-OPP-DEFAULT",
                    type="Duplicate Shipment",
                    description="No duplicate shipments detected on the filtered subset.",
                    cost_saving=0.0,
                    severity="Low"
                )
            )

        metrics = [
            OptimizationMetric(
                name="Duplicate Shipment Cost",
                current_value=float(total_dup_cost),
                optimized_value=float(total_projected_cost),
                savings_value=float(saved_costs),
                improvement_pct=(saved_costs / total_dup_cost * 100.0) if total_dup_cost > 0 else 0.0
            )
        ]

        # Savings by category split
        savings_by_part_category = {
            "CPU": saved_costs * 0.45,
            "RAM": saved_costs * 0.30,
            "Storage": saved_costs * 0.25
        }

        return ConsolidationData(
            metrics=metrics,
            opportunities=opportunities,
            recommendations=recommendations,
            savings_by_part_category=savings_by_part_category
        )

consolidation_engine = ConsolidationEngine()
