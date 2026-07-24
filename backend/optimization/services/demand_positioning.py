import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from backend.models.transaction import Transaction
from backend.models.hub import Hub
from backend.optimization.schemas.optimization import (
    DemandPositioningData,
    OptimizationMetric,
    OpportunityCard,
    ExecutiveRecommendation
)
from backend.ai.llm import generate_json_response

class DemandPositioningService:
    def optimize(
        self,
        db: Session,
        region: Optional[str] = None,
        part_category: Optional[str] = None,
        priority: Optional[str] = None,
        hub_id: Optional[str] = None,
        tpr_id: Optional[str] = None,
        flow_type: Optional[str] = None
    ) -> DemandPositioningData:
        # Base query joining transactions with their origin hubs
        from sqlalchemy import cast, Integer
        query = db.query(
            Transaction.destination_location,
            Transaction.part_no,
            func.count(Transaction.transaction_id).label("frequency"),
            func.sum(Transaction.logistics_cost_total_usd).label("actual_cost"),
            func.sum(cast(Transaction.sla_breach, Integer)).label("sla_breaches")
        ).join(Hub, Transaction.origin_hub_id == Hub.hub_id)

        # Ensure we only look at "cross-city stockouts"
        # Where the destination is different from the origin hub's city
        query = query.filter(Transaction.destination_location != Hub.city)

        # Apply basic filters if provided (similar to other engines)
        if priority:
            query = query.filter(Transaction.priority == priority)
        if flow_type:
            query = query.filter(Transaction.flow_type == flow_type)

        # Group by destination and part number
        query = query.group_by(Transaction.destination_location, Transaction.part_no)
        
        # Order by highest frequency and cost
        results = query.order_by(func.count(Transaction.transaction_id).desc()).limit(10).all()

        opportunities = []
        recommendations = []
        waste_cost_by_city = {}
        
        total_waste_cost = 0.0
        total_sla_breaches = 0
        total_cross_city_orders = 0

        for dest, part_no, frequency, actual_cost, sla_breaches in results:
            if actual_cost is None:
                actual_cost = 0.0
            
            # Heuristic for Estimated Local Fulfillment Cost:
            # Assuming a local short-haul shipment is roughly 30% of long-haul
            # This is a safe baseline since out-of-region is typically much more expensive.
            estimated_local_cost = actual_cost * 0.3
            waste_cost = actual_cost - estimated_local_cost
            
            # Record total metrics
            total_waste_cost += waste_cost
            total_sla_breaches += sla_breaches
            total_cross_city_orders += frequency
            
            if dest not in waste_cost_by_city:
                waste_cost_by_city[dest] = 0.0
            waste_cost_by_city[dest] += waste_cost

            # Only generate cards for significant impact patterns (e.g. > 5 orders or > $1000 waste)
            if frequency >= 3 or waste_cost >= 1000:
                opp_id = f"DP-OPP-{uuid.uuid4().hex[:6].upper()}"
                rec_id = f"DP-REC-{uuid.uuid4().hex[:6].upper()}"
                
                # Use Gemini LLM to generate professional titles and summaries from raw SQL data
                llm_prompt = f"""
You are a supply chain optimization AI. Based on the following raw data representing cross-city stockouts, generate a title, description, and business reason.
Destination City: {dest}
Part Number: {part_no}
Frequency: {frequency} times
Waste Cost: ${waste_cost:.2f}
SLA Breaches: {sla_breaches}

Output JSON format strictly:
{{
    "title": "Short action-oriented title (e.g., Inject Stock: Part X to City Y)",
    "description": "Short explanation of what is happening and the impact (1-2 sentences).",
    "business_reason": "Detailed business justification for the change (2-3 sentences)."
}}
"""
                try:
                    llm_resp = generate_json_response(llm_prompt)
                    title = llm_resp.get("title", f"Inject Stock: {part_no} to {dest}")
                    description = llm_resp.get("description", f"Part {part_no} shipped to {dest} out-of-region {frequency} times, wasting ${waste_cost:,.2f}.")
                    business_reason = llm_resp.get("business_reason", "Proactive demand positioning cuts premium freight costs and drastically improves local SLA metrics.")
                except Exception:
                    title = f"Inject Stock: {part_no} to {dest}"
                    description = f"Part {part_no} shipped to {dest} out-of-region {frequency} times, wasting ${waste_cost:,.2f}."
                    business_reason = "Proactive demand positioning cuts premium freight costs and drastically improves local SLA metrics."

                opportunities.append(
                    OpportunityCard(
                        id=opp_id,
                        type="Demand Positioning",
                        description=description,
                        cost_saving=round(waste_cost, 2),
                        severity="Critical" if waste_cost > 5000 or sla_breaches > 10 else "High"
                    )
                )

                recommendations.append(
                    ExecutiveRecommendation(
                        id=rec_id,
                        title=title,
                        category="Demand Positioning",
                        impact_summary=description,
                        expected_savings=round(waste_cost, 2),
                        transit_improvement_days=round(frequency * 1.5, 1), # Approx 1.5 days saved per order
                        sla_improvement_pct=min(99.0, round((sla_breaches / frequency) * 100, 1)) if frequency > 0 else 0,
                        confidence_score=92.5,
                        business_reason=business_reason
                    )
                )

        metrics = [
            OptimizationMetric(
                name="Cross-City Waste Cost",
                current_value=round(total_waste_cost, 2),
                optimized_value=0.0,
                savings_value=round(total_waste_cost, 2),
                improvement_pct=100.0
            ),
            OptimizationMetric(
                name="SLA Breaches (Cross-City)",
                current_value=float(total_sla_breaches),
                optimized_value=0.0,
                savings_value=float(total_sla_breaches),
                improvement_pct=100.0 if total_sla_breaches > 0 else 0.0
            )
        ]

        return DemandPositioningData(
            metrics=metrics,
            opportunities=opportunities,
            recommendations=recommendations,
            waste_cost_by_city=waste_cost_by_city
        )

demand_positioning_engine = DemandPositioningService()
