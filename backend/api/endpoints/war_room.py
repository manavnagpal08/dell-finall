from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from backend.api.deps import get_db
from backend.models.transaction import Transaction
from backend.models.hub import Hub
from backend.models.tpr import TPR

router = APIRouter(prefix="/war-room", tags=["Executive War Room"])

# Decision and Comment Models
class CommentPayload(BaseModel):
    user: str
    comment: str

# In-memory session list for the local approval workflow.
DECISIONS_DB = [
    {
        "id": "DEC-001",
        "type": "Route Approval",
        "priority": "Critical",
        "action": "Reroute HUB-DEL ➔ AMS-HUB via HUB-BLR to bypass customs backlog",
        "financial_impact": -4500.00,
        "business_impact": "Prevents 14 P1 parts shipment delays, saving key customer accounts.",
        "status": "Operations Manager Approved",
        "approvers": ["ops.manager@sanchar.ai"],
        "comments": [
            {"user": "logistics.analyst@sanchar.ai", "comment": "Alternate cost is minor compared to SLA penalties."}
        ]
    },
    {
        "id": "DEC-002",
        "type": "Cost Recommendation",
        "priority": "High",
        "action": "Consolidate APAC air freight into direct ocean charters",
        "financial_impact": 28000.00,
        "business_impact": "Reduces YTD air freight costs, improving margins.",
        "status": "Pending Review",
        "approvers": [],
        "comments": []
      },
      {
        "id": "DEC-003",
        "type": "Reverse Logistics",
        "priority": "Medium",
        "action": "Redeploy AMS spare boards to Bangalore TPR-DEL-01 depot",
        "financial_impact": 12000.00,
        "business_impact": "Fills local stock shortage, keeping repair SLA below 24 hrs.",
        "status": "Pending Review",
        "approvers": [],
        "comments": []
      }
]

# ==================================================
# 1. GET /war-room/dashboard
# ==================================================
@router.get("/dashboard", response_model=dict)
def get_war_room_kpis(db: Session = Depends(get_db)):
    txs = db.query(Transaction).all()
    hubs = db.query(Hub).all()
    tprs = db.query(TPR).all()

    total_cost = sum(t.logistics_cost_total_usd for t in txs)
    breaches = sum(1 for t in txs if t.sla_breach)
    sla_pct = ((len(txs) - breaches) / max(len(txs), 1)) * 100.0

    max_h = max(hubs, key=lambda h: h.utilisation_pct, default=None)
    max_t = max(tprs, key=lambda t: t.current_workload, default=None)

    return {
        "network_score": round(sla_pct, 1),
        "total_cost": round(total_cost, 2),
        "top_hub": max_h.hub_name if max_h else "N/A",
        "top_hub_util": round(max_h.utilisation_pct * 100.0, 1) if max_h else 0.0,
        "top_tpr": max_t.tpr_name if max_t else "N/A",
        "top_tpr_load": max_t.current_workload if max_t else 0,
        "pending_decisions_count": len([d for d in DECISIONS_DB if d["status"] != "Executed"]),
        "carbon_savings_co2": 1420.0
    }

# ==================================================
# 2. GET /war-room/decisions
# ==================================================
@router.get("/decisions", response_model=List[dict])
def get_pending_decisions():
    return DECISIONS_DB

# ==================================================
# 3. POST /war-room/decisions/{id}/approve
# ==================================================
@router.post("/decisions/{id}/approve", response_model=dict)
def approve_decision(id: str, approver: str = "regional.manager@sanchar.ai"):
    decision = next((d for d in DECISIONS_DB if d["id"] == id), None)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found.")

    if decision["status"] == "Pending Review":
        decision["status"] = "Operations Manager Approved"
        decision["approvers"].append("ops.manager@sanchar.ai")
    elif decision["status"] == "Operations Manager Approved":
        decision["status"] = "Regional Manager Approved"
        decision["approvers"].append("regional.manager@sanchar.ai")
    elif decision["status"] == "Regional Manager Approved":
        decision["status"] = "Executive Approved"
        decision["approvers"].append("executive@sanchar.ai")
    elif decision["status"] == "Executive Approved":
        decision["status"] = "Executed"
        decision["approvers"].append("system_automation")

    return decision

# ==================================================
# 4. POST /war-room/decisions/{id}/comment
# ==================================================
@router.post("/decisions/{id}/comment", response_model=dict)
def post_decision_comment(id: str, payload: CommentPayload):
    decision = next((d for d in DECISIONS_DB if d["id"] == id), None)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found.")

    new_comment = {"user": payload.user, "comment": payload.comment}
    decision["comments"].append(new_comment)
    return decision
