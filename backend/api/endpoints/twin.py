from collections import defaultdict
from typing import Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.api.deps import get_db
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.transaction import Transaction

router = APIRouter(prefix="/twin", tags=["Digital Twin"])


@router.get("/network-health", response_model=dict)
def get_network_health(db: Session = Depends(get_db)):
    txs = db.query(Transaction).all()
    hubs = db.query(Hub).all()
    tprs = db.query(TPR).all()

    total_cost = sum(float(t.logistics_cost_total_usd or 0) for t in txs)
    breaches = sum(1 for t in txs if t.sla_breach)
    sla_success_pct = ((len(txs) - breaches) / max(len(txs), 1)) * 100.0
    forward_count = sum(1 for t in txs if str(t.flow_type or "").lower().startswith("forward"))
    reverse_count = sum(1 for t in txs if str(t.flow_type or "").lower().startswith("reverse"))

    active_recommendations = sum(
        1
        for t in txs
        if (t.sla_breach or int(t.transit_days_actual or 0) > int(t.transit_days_expected or 0))
        and str(t.priority or "").startswith(("P1", "P2"))
    )
    approved_recommendations = sum(
        1
        for t in txs
        if not t.sla_breach
        and int(t.transit_days_actual or 0) <= int(t.transit_days_expected or 0)
        and str(t.priority or "").startswith(("P1", "P2"))
    )
    recoverable_value = sum(
        float(t.logistics_cost_total_usd or 0)
        * min(0.35, max(0.05, (int(t.transit_days_actual or 0) - int(t.transit_days_expected or 0)) / 30))
        for t in txs
        if int(t.transit_days_actual or 0) > int(t.transit_days_expected or 0)
    )

    avg_util = sum(float(h.utilisation_pct or 0) for h in hubs) / max(len(hubs), 1) * 100.0
    tpr_util = sum(float(t.current_workload or 0) / max(float(t.repair_capacity_per_day or 0), 1) for t in tprs) / max(len(tprs), 1) * 100.0
    system_status = "Critical" if sla_success_pct < 50 or avg_util > 85 else "Watch" if sla_success_pct < 75 or avg_util > 70 else "Optimal"

    return {
        "network_health_score": round(sla_success_pct, 1),
        "total_logistics_cost": round(total_cost, 2),
        "total_shipments": len(txs),
        "forward_shipments": forward_count,
        "reverse_shipments": reverse_count,
        "active_recommendations": active_recommendations,
        "approved_recommendations": approved_recommendations,
        "money_saved": round(recoverable_value, 2),
        "hub_utilization": round(avg_util, 1),
        "tpr_utilization": round(tpr_util, 1),
        "system_status": system_status,
    }


@router.get("/shipments", response_model=List[dict])
def get_live_shipment_tracking(db: Session = Depends(get_db)):
    high_risk_txs = (
        db.query(Transaction)
        .order_by(Transaction.sla_breach.desc(), Transaction.dispatch_date.desc())
        .limit(10)
        .all()
    )
    stable_txs = (
        db.query(Transaction)
        .filter(Transaction.sla_breach == False)  # noqa: E712
        .order_by(Transaction.dispatch_date.desc())
        .limit(10)
        .all()
    )
    txs = high_risk_txs + [tx for tx in stable_txs if tx.transaction_id not in {item.transaction_id for item in high_risk_txs}]
    results = []

    for idx, tx in enumerate(txs):
        origin_hub = db.query(Hub).filter(Hub.hub_id == tx.origin_hub_id).first()
        target_id = tx.intermediate_hub_id or tx.tpr_id
        target_node = None
        if target_id:
            target_node = (
                db.query(Hub).filter(Hub.hub_id == target_id).first()
                or db.query(TPR).filter(TPR.tpr_id == target_id).first()
            )

        origin_lat, origin_lon = (origin_hub.latitude, origin_hub.longitude) if origin_hub else (12.9716, 77.5946)
        target_lat, target_lon = (target_node.latitude, target_node.longitude) if target_node else (19.0760, 72.8777)

        delay_days = max(0, int(tx.transit_days_actual or 0) - int(tx.transit_days_expected or 0))
        progress = min(96, max(8, int((idx * 11 + int(tx.quantity or 0) + delay_days * 5) % 100)))
        is_delayed = bool(tx.sla_breach) or delay_days > 0
        route_color = "#dc2626" if is_delayed else "#f59e0b" if str(tx.priority or "").startswith("P1") else "#10b981"

        results.append(
            {
                "shipment_id": tx.transaction_id,
                "origin": tx.origin_hub_id,
                "destination": target_id or tx.destination_location,
                "origin_coords": [origin_lon, origin_lat],
                "dest_coords": [target_lon, target_lat],
                "progress": progress,
                "eta_hours": max(int((100 - progress) * max(float(tx.transit_days_expected or 1), 1) / 6), 2),
                "status": "Delayed" if is_delayed else "In Transit" if progress < 90 else "Nearing Destination",
                "priority": tx.priority,
                "route_color": route_color,
            }
        )

    return results


@router.post("/simulate", response_model=dict)
def run_digital_twin_simulation(payload: dict, db: Session = Depends(get_db)):
    scenario = payload.get("scenario", "Hub Offline")
    target = payload.get("target_node", "HUB-DEL")
    txs = db.query(Transaction).filter(Transaction.origin_hub_id == target).all()
    affected_count = len(txs)
    avg_cost = sum(float(t.logistics_cost_total_usd or 0) for t in txs) / max(affected_count, 1)
    avg_delay = sum(max(0, int(t.transit_days_actual or 0) - int(t.transit_days_expected or 0)) for t in txs) / max(affected_count, 1)

    backup_hub = (
        db.query(Hub)
        .filter(Hub.hub_id != target, Hub.utilisation_pct < 0.8)
        .order_by(Hub.utilisation_pct.asc())
        .first()
    )
    backup_id = backup_hub.hub_id if backup_hub else "nearest available hub"

    if scenario == "Hub Offline":
        alt_route = f"{backup_id} -> active destination corridor"
        cost_diff = avg_cost * 0.18
        transit_diff = max(0.5, avg_delay * 0.35)
        explanation = f"Bypass {target} through {backup_id}, selected from live hub utilization and affected shipment history."
    else:
        alt_route = "priority direct transfer"
        cost_diff = avg_cost * 0.09
        transit_diff = -max(0.25, avg_delay * 0.2)
        explanation = "Priority spike response uses direct transfer for high-risk shipments using current corridor averages."

    return {
        "scenario": scenario,
        "affected_node": target,
        "alternative_route": alt_route,
        "extra_cost_usd": round(cost_diff, 2),
        "extra_transit_days": round(transit_diff, 2),
        "affected_shipments_count": affected_count,
        "business_impact": f"Expected cost delta ${cost_diff:,.2f} across {affected_count} matching shipments.",
        "ai_explanation": explanation,
    }


@router.get("/carbon", response_model=dict)
def get_carbon_footprint_analysis(db: Session = Depends(get_db)):
    txs = db.query(Transaction).all()
    corridor_stats: Dict[str, Dict[str, float]] = defaultdict(lambda: {"cost": 0.0, "shipments": 0.0, "transit": 0.0, "units": 0.0})

    for tx in txs:
        target = tx.intermediate_hub_id or tx.tpr_id or tx.destination_location
        corridor = f"{tx.origin_hub_id} -> {target}"
        corridor_stats[corridor]["cost"] += float(tx.logistics_cost_total_usd or 0)
        corridor_stats[corridor]["shipments"] += 1
        corridor_stats[corridor]["transit"] += float(tx.transit_days_actual or 0)
        corridor_stats[corridor]["units"] += float(tx.quantity or 0)

    ranked = []
    for corridor, values in corridor_stats.items():
        shipments = max(values["shipments"], 1)
        avg_cost = values["cost"] / shipments
        avg_transit = values["transit"] / shipments
        co2 = values["units"] * max(avg_transit, 1) * 3.2 + avg_cost * 0.18
        ranked.append((corridor, co2, avg_cost, avg_transit, shipments))

    total_co2 = sum(item[1] for item in ranked)
    avg_co2 = total_co2 / max(len(txs), 1)
    greenest = min(ranked, key=lambda item: item[1] / max(item[4], 1))[0] if ranked else "N/A"
    highest = max(ranked, key=lambda item: item[1])[0] if ranked else "N/A"
    savings = sum(item[1] * 0.12 for item in ranked if item[2] > 1600 or item[3] > 10)
    sustainability_score = max(0.0, min(100.0, 100.0 - (avg_co2 / 28.0)))

    return {
        "total_co2_kg": round(total_co2, 1),
        "co2_per_shipment": round(avg_co2, 1),
        "greenest_route": greenest,
        "highest_emission_corridor": highest,
        "carbon_savings_ytd_kg": round(savings, 1),
        "sustainability_score": round(sustainability_score, 1),
    }
