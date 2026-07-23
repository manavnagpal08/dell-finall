from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from backend.api.deps import get_db
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.models.transaction import Transaction
from typing import Dict, Any, List

router = APIRouter()

# ==================================================
# 1. GET /routes
# ==================================================
@router.get("/routes", response_model=dict)
def get_routes(
    origin: str = Query(None, description="Filter by origin hub ID"),
    destination: str = Query(None, description="Filter by destination hub or city"),
    status_filter: str = Query(None, description="Filter by status (Active, Congested)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve unique routes aggregated from logistics transaction pathways.
    """
    query = db.query(
        Transaction.origin_hub_id,
        Transaction.destination_location,
        func.count(Transaction.transaction_id).label("total_shipments"),
        func.avg(Transaction.logistics_cost_total_usd).label("avg_cost"),
        func.avg(Transaction.transit_days_actual).label("avg_days"),
        func.sum(case((Transaction.sla_breach == True, 1), else_=0)).label("sla_breaches")
    ).group_by(Transaction.origin_hub_id, Transaction.destination_location)

    if origin:
        query = query.filter(Transaction.origin_hub_id == origin)
    if destination:
        query = query.filter(Transaction.destination_location.ilike(f"%{destination}%"))

    results = query.all()
    
    items = []
    for r in results:
        # Determine status
        sla_pct = (r.sla_breaches / r.total_shipments) if r.total_shipments > 0 else 0
        route_status = "Healthy"
        if sla_pct > 0.25:
            route_status = "Critical"
        elif sla_pct > 0.10:
            route_status = "Warning"

        items.append({
            "origin_hub_id": r.origin_hub_id,
            "destination": r.destination_location,
            "total_shipments": r.total_shipments,
            "avg_cost_usd": round(r.avg_cost or 0.0, 2),
            "avg_transit_days": round(r.avg_days or 0.0, 1),
            "status": route_status,
            "sla_breach_rate_pct": round(sla_pct * 100, 1)
        })

    if status_filter:
        items = [item for item in items if item["status"].lower() == status_filter.lower()]

    return {
        "items": items,
        "total": len(items)
    }

# ==================================================
# 2. GET /inventory
# ==================================================
@router.get("/inventory", response_model=dict)
def get_inventory(
    hub_id: str = Query(None, description="Filter by Hub ID"),
    part_no: str = Query(None, description="Filter by Part Number"),
    db: Session = Depends(get_db)
):
    """
    Retrieve inventory stock allocation mappings across hubs.
    """
    query = db.query(Transaction).filter(Transaction.status == "In Transit")
    
    if hub_id:
        query = query.filter(Transaction.origin_hub_id == hub_id)
    if part_no:
        query = query.filter(Transaction.part_no == part_no)
        
    shipments = query.all()
    
    # Calculate unique stock listings
    inv_map = {}
    for s in shipments:
        key = (s.origin_hub_id, s.part_no)
        if key not in inv_map:
            inv_map[key] = {
                "hub_id": s.origin_hub_id,
                "part_no": s.part_no,
                "quantity": 0,
                "min_stock": s.stock_at_origin_hub, # approximation from transaction field
                "status": "Optimal"
            }
        inv_map[key]["quantity"] += s.quantity

    items = list(inv_map.values())
    for item in items:
        # Status threshold check
        if item["quantity"] <= 5:
            item["status"] = "Low Stock"
        elif item["quantity"] > 200:
            item["status"] = "Overstocked"

    return {
        "items": items,
        "total": len(items)
    }

# ==================================================
# 3. GET /alerts
# ==================================================
@router.get("/alerts", response_model=dict)
def get_alerts(
    severity: str = Query(None, description="Filter by severity (info, warning, critical)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve active alerts based on SLA breaches and tamper flags from transactions.
    """
    alerts = []
    
    # Query SLA Breaches
    breaches = db.query(Transaction).filter(Transaction.sla_breach == True).limit(20).all()
    for b in breaches:
        alerts.append({
            "id": f"SLA-{b.transaction_id}",
            "title": f"SLA Delivery Breach: {b.transaction_id}",
            "description": f"Shipment of Part {b.part_no} to {b.destination_location} exceeded expected transit time.",
            "severity": "critical",
            "entity_type": "shipment",
            "entity_id": b.transaction_id,
            "status": "active"
        })

    # Query Tamper Flags
    tampers = db.query(Transaction).filter(Transaction.tamper_flag == "TAMPER_ALERT").limit(10).all()
    for t in tampers:
        alerts.append({
            "id": f"TMP-{t.transaction_id}",
            "title": f"Security Alarm: Tamper Flag on {t.transaction_id}",
            "description": f"Anti-tamper packaging sensor triggered for item {t.part_no} in route.",
            "severity": "critical",
            "entity_type": "shipment",
            "entity_id": t.transaction_id,
            "status": "active"
        })

    if severity:
        alerts = [a for a in alerts if a["severity"].lower() == severity.lower()]

    return {
        "items": alerts,
        "total": len(alerts)
    }

# ==================================================
# 4. GET /network-health
# ==================================================
@router.get("/network-health", response_model=dict)
def get_network_health(db: Session = Depends(get_db)):
    """
    Dynamically computes overall logistics network health score (percentage).
    Formula includes: SLA breach rate, tamper alert flags, and average transit efficiencies.
    """
    total_tx = db.query(Transaction).count()
    if total_tx == 0:
        return {"health_score_pct": 100.0, "status": "Excellent", "metrics": {}}

    sla_breaches = db.query(Transaction).filter(Transaction.sla_breach == True).count()
    tampers = db.query(Transaction).filter(Transaction.tamper_flag == "TAMPER_ALERT").count()
    
    # Calculate health score: start at 100% and deduct penalties for issues
    sla_rate = sla_breaches / total_tx
    tamper_rate = tampers / total_tx

    health_score = 100.0 - (sla_rate * 50.0) - (tamper_rate * 100.0)
    health_score = max(0.0, min(100.0, health_score))

    status_label = "Excellent"
    if health_score < 70.0:
        status_label = "Critical"
    elif health_score < 85.0:
        status_label = "Warning"
    elif health_score < 95.0:
        status_label = "Good"

    return {
        "health_score_pct": round(health_score, 1),
        "status": status_label,
        "metrics": {
            "total_monitored_shipments": total_tx,
            "sla_breach_count": sla_breaches,
            "tamper_alerts": tampers
        }
    }


# ==================================================
# 5. GET /carriers
# ==================================================
@router.get("/carriers", response_model=dict)
def get_carriers(db: Session = Depends(get_db)):
    """
    Compute dynamic carrier scorecard metrics from transaction history.
    """
    transactions = db.query(Transaction).all()
    if not transactions:
        return {"items": [], "total": 0}

    avg_network_cost = sum(float(t.logistics_cost_per_unit_usd or 0.0) for t in transactions) / len(transactions)
    grouped = {}
    for tx in transactions:
        partner = tx.logistics_partner or "Unknown"
        bucket = grouped.setdefault(partner, {
            "shipments": 0,
            "lanes": set(),
            "sla_breaches": 0,
            "tamper_events": 0,
            "cost_per_unit": 0.0,
            "total_cost": 0.0,
            "delay_days": 0.0,
            "units": 0,
        })
        bucket["shipments"] += 1
        bucket["lanes"].add(f"{tx.origin_hub_id}->{tx.intermediate_hub_id or tx.tpr_id or tx.destination_location}")
        bucket["sla_breaches"] += 1 if tx.sla_breach else 0
        bucket["tamper_events"] += 1 if tx.tamper_flag == "TAMPER_ALERT" else 0
        bucket["cost_per_unit"] += float(tx.logistics_cost_per_unit_usd or 0.0)
        bucket["total_cost"] += float(tx.logistics_cost_total_usd or 0.0)
        bucket["delay_days"] += max(0, int(tx.transit_days_actual or 0) - int(tx.transit_days_expected or 0))
        bucket["units"] += int(tx.quantity or 0)
    
    carriers = []
    for partner, metrics in grouped.items():
        shipments = max(metrics["shipments"], 1)
        sla_pct = 100.0 - ((metrics["sla_breaches"] / shipments) * 100.0)
        avg_cost = metrics["cost_per_unit"] / shipments
        tamper_rate = (metrics["tamper_events"] / shipments) * 100.0
        avg_delay = metrics["delay_days"] / shipments
        excess_cost = max(0.0, (avg_cost - avg_network_cost) * metrics["units"])
        carbon_index = max(0.0, min(100.0, 100.0 - (avg_delay * 8.0) - (avg_cost / max(avg_network_cost, 1.0) - 1.0) * 18.0))

        status = "Preferred"
        if sla_pct < 90:
            status = "Conditional"
        elif sla_pct < 95:
            status = "Review"
            
        carriers.append({
            "name": partner,
            "shipments": metrics["shipments"],
            "lanes": len(metrics["lanes"]),
            "sla": round(sla_pct, 1),
            "cost": round(avg_cost, 2),
            "damage": round(tamper_rate, 1),
            "carbon": round(carbon_index, 1),
            "status": status,
            "savings": round(excess_cost, 2),
            "sla_breaches": metrics["sla_breaches"],
            "tamper_events": metrics["tamper_events"],
            "avg_delay_days": round(avg_delay, 2),
            "total_cost": round(metrics["total_cost"], 2)
        })

    return {
        "items": sorted(carriers, key=lambda item: (item["status"] != "Preferred", -item["sla"], item["cost"])),
        "total": len(carriers)
    }

