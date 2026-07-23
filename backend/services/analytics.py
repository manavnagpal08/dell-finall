from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.transaction import Transaction
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.schemas.dataset import DashboardStatisticsSchema

class AnalyticsService:
    def get_dashboard_statistics(self, db: Session) -> dict:
        """
        Queries database and constructs aggregate indicators for the executive dashboard.
        """
        total_tx = db.query(Transaction).count()
        if total_tx == 0:
            return {
                "total_transactions": 0,
                "forward_transactions": 0,
                "reverse_transactions": 0,
                "total_hubs": 0,
                "total_tprs": 0,
                "total_parts": 0,
                "total_cost": 0.0,
                "average_cost": 0.0,
                "average_transit_time": 0.0,
                "sla_breach_percentage": 0.0,
                "tamper_alert_percentage": 0.0,
                "cost_distribution": [],
                "flow_distribution": [],
                "country_distribution": [],
                "top_categories_by_cost": []
            }

        # 1. KPI Aggregates
        forward_tx = db.query(Transaction).filter(Transaction.flow_type == "Forward").count()
        reverse_tx = db.query(Transaction).filter(Transaction.flow_type == "Reverse").count()
        
        total_hubs = db.query(Hub).count()
        total_tprs = db.query(TPR).count()
        total_parts = db.query(Part).count()

        total_cost = db.query(func.sum(Transaction.total_cost_usd)).scalar() or 0.0
        average_cost = db.query(func.avg(Transaction.total_cost_usd)).scalar() or 0.0
        
        average_transit = db.query(func.avg(Transaction.transit_days_actual)).scalar() or 0.0
        
        sla_breach_count = db.query(Transaction).filter(Transaction.sla_breach == True).count()
        sla_breach_pct = (sla_breach_count / total_tx) * 100.0 if total_tx > 0 else 0.0
        
        tamper_count = db.query(Transaction).filter(Transaction.tamper_flag == "TAMPER_ALERT").count()
        tamper_pct = (tamper_count / total_tx) * 100.0 if total_tx > 0 else 0.0

        # 2. Flow Distribution (Chart)
        flow_dist = [
            {"name": "Forward Logistics", "value": float(forward_tx)},
            {"name": "Reverse Logistics", "value": float(reverse_tx)}
        ]

        # 3. Cost Distribution by Category (Chart)
        cost_by_cat = db.query(
            Part.category, 
            func.sum(Transaction.total_cost_usd)
        ).join(Part, Transaction.part_no == Part.part_no).group_by(Part.category).all()
        
        cost_dist = [{"name": cat or "Unknown", "value": float(val)} for cat, val in cost_by_cat]

        # 4. Top Categories by Cost (Chart/Grid)
        top_cats = sorted(cost_dist, key=lambda x: x["value"], reverse=True)

        # 5. Country Distribution (Chart)
        # Using origin hub country
        country_counts = db.query(
            Hub.country, 
            func.count(Transaction.transaction_id)
        ).join(Hub, Transaction.origin_hub_id == Hub.hub_id).group_by(Hub.country).all()
        
        country_dist = [{"name": c or "Unknown", "value": float(count)} for c, count in country_counts]

        return {
            "total_transactions": total_tx,
            "forward_transactions": forward_tx,
            "reverse_transactions": reverse_tx,
            "total_hubs": total_hubs,
            "total_tprs": total_tprs,
            "total_parts": total_parts,
            "total_cost": float(total_cost),
            "average_cost": float(average_cost),
            "average_transit_time": float(average_transit),
            "sla_breach_percentage": float(sla_breach_pct),
            "tamper_alert_percentage": float(tamper_pct),
            "cost_distribution": cost_dist,
            "flow_distribution": flow_dist,
            "country_distribution": country_dist,
            "top_categories_by_cost": top_cats
        }

analytics_service = AnalyticsService()
