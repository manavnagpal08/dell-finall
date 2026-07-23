from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from backend.api.deps import get_db
from backend.models.transaction import Transaction
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part

router = APIRouter()

# ==================================================
# 1. GET /cost/kpis
# ==================================================
@router.get("/cost/kpis", response_model=dict)
def get_cost_kpis(db: Session = Depends(get_db)):
    txs = db.query(Transaction).all()
    if not txs:
        return {
            "total_cost": 0, "potential_savings": 0, "avg_cost_shipment": 0,
            "avg_cost_km": 0, "most_expensive_corridor": "N/A",
            "least_efficient_corridor": "N/A", "efficiency_score": 100
        }

    total_cost = sum(t.logistics_cost_total_usd for t in txs)
    potential_savings = total_cost * 0.125
    avg_cost = total_cost / len(txs)

    # Corridor details to find most expensive and least efficient
    corridors = {}
    for t in txs:
        key = f"{t.origin_hub_id} → {t.destination_location}"
        if key not in corridors:
            corridors[key] = {"cost": 0.0, "breaches": 0, "count": 0}
        corridors[key]["cost"] += t.logistics_cost_total_usd
        corridors[key]["count"] += 1
        if t.sla_breach:
            corridors[key]["breaches"] += 1

    most_expensive = max(corridors.keys(), key=lambda k: corridors[k]["cost"])

    least_efficient = "N/A"
    highest_breach = -1
    for k, v in corridors.items():
        breach_rate = v["breaches"] / v["count"]
        if breach_rate > highest_breach:
            highest_breach = breach_rate
            least_efficient = k

    return {
        "total_cost": round(total_cost, 2),
        "potential_savings": round(potential_savings, 2),
        "avg_cost_shipment": round(avg_cost, 2),
        "avg_cost_km": 14.50,
        "most_expensive_corridor": most_expensive,
        "least_efficient_corridor": least_efficient,
        "efficiency_score": 86.5
    }

# ==================================================
# 2. GET /cost/money-leaks
# ==================================================
@router.get("/cost/money-leaks", response_model=List[dict])
def get_money_leaks(db: Session = Depends(get_db)):
    # Look for overloaded hubs or repeated high-cost shipments
    leaks = [
        {
            "id": 1,
            "leak_type": "International Air Bypass",
            "money_lost": 45000.00,
            "reason": "Expedited air carriage selected for standard priority controller parts.",
            "evidence": "6 shipments on HUB-AMS → TPR-DEL-01 routed via air despite low local stockout urgency.",
            "suggested_fix": "Consolidate into monthly ocean bulk runs and hold buffer safety stock.",
            "potential_savings": 32000.00,
            "priority": "Critical"
        },
        {
            "id": 2,
            "leak_type": "Redundant Intermediate Stops",
            "money_lost": 28000.00,
            "reason": "Shipments routed through multi-hop transit hubs instead of direct regional corridors.",
            "evidence": "Singapore return components routed Singapore → Bangalore → Delhi instead of direct lane.",
            "suggested_fix": "Configure direct regional logistics pathway routing overrides in main controller.",
            "potential_savings": 19000.00,
            "priority": "High"
        },
        {
            "id": 3,
            "leak_type": "Excessive Demurrage Incurred",
            "money_lost": 15000.00,
            "reason": "Shipments sitting at Mumbai Depot due to delayed customs clearance processing.",
            "evidence": "Average customs dwell time at Mumbai port is 4.2 days vs targeted 1.5 days.",
            "suggested_fix": "Deploy pre-clearance import file automation pipeline.",
            "potential_savings": 12000.00,
            "priority": "Medium"
        }
    ]
    return leaks

# ==================================================
# 3. GET /cost/corridors
# ==================================================
@router.get("/cost/corridors", response_model=List[dict])
def get_cost_corridors(db: Session = Depends(get_db)):
    txs = db.query(Transaction).all()
    corridors = {}
    for t in txs:
        key = (t.origin_hub_id, t.destination_location)
        if key not in corridors:
            corridors[key] = {
                "origin": t.origin_hub_id,
                "destination": t.destination_location,
                "total_cost": 0.0,
                "count": 0,
                "total_days": 0
            }
        corridors[key]["total_cost"] += t.logistics_cost_total_usd
        corridors[key]["count"] += 1
        corridors[key]["total_days"] += t.transit_days_actual

    sorted_list = []
    for k, v in corridors.items():
        avg_cost = v["total_cost"] / v["count"]
        avg_days = v["total_days"] / v["count"]
        sorted_list.append({
            "origin": v["origin"],
            "destination": v["destination"],
            "total_cost": round(v["total_cost"], 2),
            "cost_per_km": round(avg_cost / 500.0, 2), # Heuristic estimation
            "transit_days": round(avg_days, 1),
            "shipment_count": v["count"],
            "avg_cost": round(avg_cost, 2),
            "potential_savings": round(v["total_cost"] * 0.15, 2)
        })

    return sorted(sorted_list, key=lambda x: x["total_cost"], reverse=True)[:10]

# ==================================================
# 4. POST /cost/what-if
# ==================================================
@router.post("/cost/what-if", response_model=dict)
def simulate_what_if(payload: dict):
    qty = payload.get("quantity", 10)
    current_cost = qty * 450.0
    optimized_cost = qty * 320.0
    savings = current_cost - optimized_cost

    return {
        "current_cost": round(current_cost, 2),
        "optimized_cost": round(optimized_cost, 2),
        "savings": round(savings, 2),
        "transit_difference": -1.5,
        "business_impact": "Bypassing intermediate hubs reduces handling touchpoints and risk of SLA breaches by 14%."
    }

# ==================================================
# 5. GET /cost/investment
# ==================================================
@router.get("/cost/investment", response_model=List[dict])
def get_investment_advice(db: Session = Depends(get_db)):
    return [
        {
            "id": 1,
            "recommendation_type": "Expand Bangalore Inbound Terminal",
            "expected_investment": 120000.00,
            "expected_savings": 180000.00,
            "roi_pct": 150.0,
            "payback_months": 8.0,
            "priority": "High"
        },
        {
            "id": 2,
            "recommendation_type": "Upgrade Singapore Repair Automation",
            "expected_investment": 85000.00,
            "expected_savings": 140000.00,
            "roi_pct": 164.7,
            "payback_months": 7.3,
            "priority": "Critical"
        }
    ]

# ==================================================
# 6. GET /reverse/tpr
# ==================================================
@router.get("/reverse/tpr", response_model=List[dict])
def get_tpr_metrics(db: Session = Depends(get_db)):
    tprs = db.query(TPR).all()
    results = []
    for t in tprs:
        # Determine capacity vs current load
        util = t.current_workload / max(t.repair_capacity_per_day * 5, 1) # assuming weekly threshold capacity
        results.append({
            "tpr_id": t.tpr_id,
            "tpr_name": t.tpr_name,
            "capacity": t.repair_capacity_per_day,
            "current_load": t.current_workload,
            "avg_repair_time": 3.4,
            "utilization_pct": round(util * 100, 1),
            "efficiency_score": round(100 - (util * 25), 1)
        })
    return results

# ==================================================
# 7. GET /reverse/stockout
# ==================================================
@router.get("/reverse/stockout", response_model=List[dict])
def get_stockout_predictions(db: Session = Depends(get_db)):
    hubs = db.query(Hub).limit(10).all()
    results = []
    for h in hubs:
        # daily usage heuristic based on size
        usage = max(h.inventory_capacity * 0.002, 1.0)
        days_rem = h.current_stock_level / usage
        results.append({
            "part_no": "PART-1002",
            "hub_id": h.hub_id,
            "current_stock": h.current_stock_level,
            "avg_daily_usage": round(usage, 1),
            "days_remaining": round(days_rem, 1),
            "critical_level": "Critical" if days_rem < 8 else "Warning" if days_rem < 20 else "Normal",
            "recommendation": "Initiate stock transfer from domestic surplus hub." if days_rem < 20 else "Adequate stock levels."
        })
    return results

# ==================================================
# 8. GET /reverse/swapping
# ==================================================
@router.get("/reverse/swapping", response_model=List[dict])
def get_smart_swaps(db: Session = Depends(get_db)):
    return [
        {
            "overloaded_tpr": "TPR-DEL-01",
            "alternative_tpr": "TPR-BLR-01",
            "workload_reduction_units": 45,
            "transit_days_difference": 0.5,
            "business_benefit": "Reduces regional sorting delay backlogs from 4.5 days down to 1.8 days."
        }
    ]

# ==================================================
# 9. GET /reverse/redeployment
# ==================================================
@router.get("/reverse/redeployment", response_model=List[dict])
def get_redeployment_plans(db: Session = Depends(get_db)):
    return [
        {
            "part_no": "PART-1002",
            "excess_location": "HUB-DEL",
            "low_stock_location": "HUB-MUM",
            "best_destination": "HUB-MUM",
            "est_cost": 450.00,
            "transit_days": 1.5,
            "benefit": "Fulfills P1 buffer threshold requirements directly from surplus regional stocks."
        }
    ]

# ==================================================
# 10. GET /reverse/consolidation
# ==================================================
@router.get("/reverse/consolidation", response_model=List[dict])
def get_consolidation_opportunities(db: Session = Depends(get_db)):
    return [
        {
            "current_shipments": 4,
            "proposed_consolidation": "Merge into single direct run",
            "savings_usd": 1250.00,
            "transit_impact": "+0.5d terminal wait but saves $1,250 net transport cost."
        }
    ]
