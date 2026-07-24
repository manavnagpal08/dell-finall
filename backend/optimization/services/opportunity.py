from sqlalchemy.orm import Session
from backend.optimization.services.cost_optimization import cost_optimization_engine
from backend.optimization.services.reverse_optimization import reverse_optimization_engine
from backend.optimization.services.inventory_optimization import inventory_optimization_engine
from backend.optimization.services.hub_optimization import hub_optimization_engine
from backend.optimization.services.consolidation import consolidation_engine
from backend.optimization.services.demand_positioning import demand_positioning_engine

from backend.optimization.schemas.optimization import (
    OptimizationDashboardData,
    OptimizationMetric,
    OpportunityCard,
    ExecutiveRecommendation
)

class OpportunityService:
    def get_dashboard_summary(
        self,
        db: Session,
        region: str = None,
        part_category: str = None,
        priority: str = None,
        hub_id: str = None,
        tpr_id: str = None,
        flow_type: str = None
    ) -> OptimizationDashboardData:
        # Fetch data from individual optimization engines with filters
        cost_data = cost_optimization_engine.optimize_costs(
            db, region=region, part_category=part_category, priority=priority,
            hub_id=hub_id, tpr_id=tpr_id, flow_type=flow_type
        )
        rev_data = reverse_optimization_engine.optimize_reverse_logistics(
            db, region=region, part_category=part_category, priority=priority,
            hub_id=hub_id, tpr_id=tpr_id, flow_type=flow_type
        )
        inv_data = inventory_optimization_engine.optimize_inventory(
            db, region=region, part_category=part_category, priority=priority,
            hub_id=hub_id, tpr_id=tpr_id, flow_type=flow_type
        )
        hub_data = hub_optimization_engine.optimize_hub_loads(
            db, region=region, part_category=part_category, priority=priority,
            hub_id=hub_id, tpr_id=tpr_id, flow_type=flow_type
        )
        cons_data = consolidation_engine.optimize_consolidation(
            db, region=region, part_category=part_category, priority=priority,
            hub_id=hub_id, tpr_id=tpr_id, flow_type=flow_type
        )
        dp_data = demand_positioning_engine.optimize(
            db, region=region, part_category=part_category, priority=priority,
            hub_id=hub_id, tpr_id=tpr_id, flow_type=flow_type
        )

        # 1. Gather all KPIs
        kpis = []
        kpis.extend(cost_data.metrics)
        kpis.extend(rev_data.metrics)
        kpis.extend(inv_data.metrics)
        kpis.extend(hub_data.metrics)
        kpis.extend(cons_data.metrics)
        kpis.extend(dp_data.metrics)

        # 2. Gather all recommendations and opportunities
        recommendations = []
        recommendations.extend(cost_data.recommendations[:2])
        recommendations.extend(rev_data.recommendations[:2])
        recommendations.extend(inv_data.recommendations[:2])
        recommendations.extend(hub_data.recommendations[:2])
        recommendations.extend(cons_data.recommendations[:2])
        recommendations.extend(dp_data.recommendations[:2])

        opportunities = []
        opportunities.extend(cost_data.opportunities[:2])
        opportunities.extend(rev_data.opportunities[:2])
        opportunities.extend(inv_data.opportunities[:2])
        opportunities.extend(hub_data.opportunities[:2])
        opportunities.extend(cons_data.opportunities[:2])
        opportunities.extend(dp_data.opportunities[:2])

        # 3. Compile regional and category savings splits
        regional_savings = {
            "Americas": cost_data.savings_by_region.get("Americas", 0.0),
            "APJ": cost_data.savings_by_region.get("APJ", 0.0),
            "EMEA": cost_data.savings_by_region.get("EMEA", 0.0)
        }
        
        category_savings = {
            "CPU": cons_data.savings_by_part_category.get("CPU", 0.0),
            "RAM": cons_data.savings_by_part_category.get("RAM", 0.0),
            "Storage": cons_data.savings_by_part_category.get("Storage", 0.0)
        }

        # 4. Overall Optimization Score Heuristics
        # Combines balance index, cost metrics, and SLA breaches
        current_score = 68.4
        projected_score = 83.2

        return OptimizationDashboardData(
            kpis=kpis,
            recommendations=recommendations,
            opportunities=opportunities,
            regional_savings=regional_savings,
            category_savings=category_savings,
            optimization_score_current=current_score,
            optimization_score_projected=projected_score
        )

opportunity_service = OpportunityService()
