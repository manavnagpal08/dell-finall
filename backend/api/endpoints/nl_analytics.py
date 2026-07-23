from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Integer
from backend.api.deps import get_db
from backend.models.hub import Hub
from backend.models.part import Part
from backend.models.transaction import Transaction

router = APIRouter()


@router.get("/query")
def natural_language_query(q: str, db: Session = Depends(get_db)):
    query = q.lower()

    if "sla" in query and "hub" in query:
        rows = (
            db.query(
                Transaction.origin_hub_id.label("hub_id"),
                Hub.hub_name.label("hub_name"),
                func.count(Transaction.transaction_id).label("shipments"),
                func.sum(cast(Transaction.sla_breach, Integer)).label("breaches"),
            )
            .join(Hub, Hub.hub_id == Transaction.origin_hub_id)
            .group_by(Transaction.origin_hub_id, Hub.hub_name)
            .order_by(func.sum(cast(Transaction.sla_breach, Integer)).desc())
            .limit(10)
            .all()
        )
        data = [
            {
                "label": row.hub_name,
                "hub_id": row.hub_id,
                "shipments": int(row.shipments or 0),
                "sla_breaches": int(row.breaches or 0),
                "breach_rate": (int(row.breaches or 0) / max(1, int(row.shipments or 0))) * 100.0,
            }
            for row in rows
        ]
        return {
            "intent": "sla_breaches_by_hub",
            "answer": f"{data[0]['label']} has the highest SLA breach count in the loaded dataset." if data else "No SLA breach data found.",
            "chart_type": "bar",
            "data": data,
        }

    if "storage" in query or "part" in query or "category" in query:
        rows = (
            db.query(
                Part.category.label("category"),
                func.count(Transaction.transaction_id).label("shipments"),
                func.sum(Transaction.logistics_cost_total_usd).label("cost"),
                func.sum(cast(Transaction.sla_breach, Integer)).label("breaches"),
            )
            .join(Transaction, Transaction.part_no == Part.part_no)
            .group_by(Part.category)
            .order_by(func.sum(Transaction.logistics_cost_total_usd).desc())
            .limit(10)
            .all()
        )
        data = [
            {
                "label": row.category,
                "shipments": int(row.shipments or 0),
                "cost": float(row.cost or 0.0),
                "sla_breaches": int(row.breaches or 0),
            }
            for row in rows
        ]
        return {
            "intent": "part_category_cost_and_risk",
            "answer": f"{data[0]['label']} is the highest-cost part category." if data else "No part category data found.",
            "chart_type": "bar",
            "data": data,
        }

    if "carrier" in query or "partner" in query:
        rows = (
            db.query(
                Transaction.logistics_partner.label("partner"),
                func.count(Transaction.transaction_id).label("shipments"),
                func.avg(Transaction.transit_days_actual).label("transit"),
                func.sum(Transaction.logistics_cost_total_usd).label("cost"),
                func.sum(cast(Transaction.sla_breach, Integer)).label("breaches"),
            )
            .group_by(Transaction.logistics_partner)
            .order_by(func.sum(cast(Transaction.sla_breach, Integer)).desc())
            .limit(10)
            .all()
        )
        data = [
            {
                "label": row.partner,
                "shipments": int(row.shipments or 0),
                "avg_transit_days": float(row.transit or 0.0),
                "cost": float(row.cost or 0.0),
                "sla_breaches": int(row.breaches or 0),
            }
            for row in rows
        ]
        return {
            "intent": "carrier_performance",
            "answer": f"{data[0]['label']} has the highest SLA breach exposure among logistics partners." if data else "No carrier data found.",
            "chart_type": "table",
            "data": data,
        }

    rows = (
        db.query(
            Transaction.origin_hub_id.label("source"),
            Transaction.intermediate_hub_id.label("target"),
            func.sum(Transaction.logistics_cost_total_usd).label("cost"),
            func.count(Transaction.transaction_id).label("shipments"),
        )
        .filter(Transaction.intermediate_hub_id.isnot(None))
        .group_by(Transaction.origin_hub_id, Transaction.intermediate_hub_id)
        .order_by(func.sum(Transaction.logistics_cost_total_usd).desc())
        .limit(10)
        .all()
    )
    data = [
        {
            "label": f"{row.source} -> {row.target}",
            "shipments": int(row.shipments or 0),
            "cost": float(row.cost or 0.0),
        }
        for row in rows
    ]
    return {
        "intent": "expensive_corridors",
        "answer": f"{data[0]['label']} is the highest-cost corridor." if data else "No corridor data found.",
        "chart_type": "bar",
        "data": data,
    }
