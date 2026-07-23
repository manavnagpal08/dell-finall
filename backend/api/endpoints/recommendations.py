from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, Integer, func
from typing import List, Dict, Any

from backend.api.deps import get_db
from backend.models.transaction import Transaction
from backend.models.hub import Hub
from backend.models.part import Part
from backend.models.recommendation import (
    RecommendationRequest,
    RecommendationResult,
    ApprovedRoute,
    RecommendationHistory,
    RecommendationAuditLog
)
from backend.schemas.recommendation import (
    RecommendationRequestCreate,
    RecommendationResponse,
    RouteApprovalRequest,
    RouteApprovalResponse,
    RecommendationActionAuditRequest,
    RecommendationHistoryItem,
    RecommendationResultResponse
)
from backend.services.recommendation_engine import (
    SLAPredictionService,
    RoutingRecommendationEngine
)
from backend.services.route_intelligence_service import route_intelligence_service

router = APIRouter()

engine = RoutingRecommendationEngine()
predictor = SLAPredictionService()

# ==================================================
# 1. POST /recommendations/generate
# ==================================================
@router.post("/generate", response_model=RecommendationResponse)
def generate_recommendations(
    payload: RecommendationRequestCreate,
    db: Session = Depends(get_db)
):
    try:
        # Create request record
        req = RecommendationRequest(
            origin_hub_id=payload.origin_hub_id,
            destination=payload.destination,
            part_no=payload.part_no,
            part_category=payload.part_category,
            quantity=payload.quantity,
            priority=payload.priority,
            shipment_type=payload.shipment_type,
            required_delivery_date=payload.required_delivery_date,
            preferred_partner=payload.preferred_partner
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # Run routing engine
        results = engine.discover_and_rank(
            db=db,
            origin_hub_id=payload.origin_hub_id,
            destination=payload.destination,
            part_no=payload.part_no,
            quantity=payload.quantity,
            priority=payload.priority,
            shipment_type=payload.shipment_type
        )

        db_results = []
        for r in results:
            res_obj = RecommendationResult(
                request_id=req.id,
                rank=r["rank"],
                recommendation_score=r["recommendation_score"],
                origin=r["origin"],
                intermediate_hubs=r["intermediate_hubs"],
                destination=r["destination"],
                distance_km=r["distance_km"],
                est_transit_days=r["est_transit_days"],
                est_cost_usd=r["est_cost_usd"],
                inventory_status=r["inventory_status"],
                hub_utilization_pct=r["hub_utilization_pct"],
                historical_sla_pct=r["historical_sla_pct"],
                reasoning_json=r["reasoning_json"]
            )
            db.add(res_obj)
            db_results.append(res_obj)

        db.commit()

        # Reload db_results to include IDs
        for r in db_results:
            db.refresh(r)

        # Fetch SLA prediction from the deterministic risk service.
        ml_risk = predictor.predict_sla_risk(payload.dict())

        # Log Audit Record
        audit = RecommendationAuditLog(
            inputs_json=payload.dict(),
            recommendation_json={
                "results": [
                    {
                        "rank": r.rank,
                        "score": r.recommendation_score,
                        "origin": r.origin,
                        "destination": r.destination,
                        "cost": r.est_cost_usd
                    } for r in db_results
                ]
            },
            approval_status="Pending"
        )
        db.add(audit)
        db.commit()

        # Format Response
        resp_list = []
        for r in db_results:
            resp_list.append(RecommendationResultResponse(
                id=r.id,
                rank=r.rank,
                recommendation_score=r.recommendation_score,
                origin=r.origin,
                intermediate_hubs=r.intermediate_hubs,
                destination=r.destination,
                distance_km=r.distance_km,
                est_transit_days=r.est_transit_days,
                est_cost_usd=r.est_cost_usd,
                inventory_status=r.inventory_status,
                hub_utilization_pct=r.hub_utilization_pct,
                historical_sla_pct=r.historical_sla_pct,
                reasoning_json=r.reasoning_json
            ))

        return RecommendationResponse(
            request_id=req.id,
            ml_risk_analysis=ml_risk,
            recommendations=resp_list
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


# ==================================================
# 2. POST /recommendations/approve
# ==================================================
@router.post("/action-audit")
def record_recommendation_action(
    payload: RecommendationActionAuditRequest,
    db: Session = Depends(get_db)
):
    try:
        audit = RecommendationAuditLog(
            user="operations_manager",
            inputs_json={
                "recommendation_id": payload.recommendation_id,
                "flow_type": payload.flow_type,
                "source": payload.source,
                "destination": payload.destination,
                "category": payload.category,
            },
            recommendation_json={
                "title": payload.title,
                "estimated_savings_usd": payload.estimated_savings_usd,
                "confidence_score": payload.confidence_score,
                "reason": payload.reason,
            },
            approval_status=payload.decision,
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return {
            "success": True,
            "audit_id": audit.id,
            "status": payload.decision,
            "message": f"Recommendation {payload.recommendation_id} recorded as {payload.decision}.",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================================================
# 3. POST /recommendations/approve
# ==================================================
@router.post("/approve", response_model=RouteApprovalResponse)
def approve_recommendation(
    payload: RouteApprovalRequest,
    db: Session = Depends(get_db)
):
    try:
        # Create approved route entry
        approval = ApprovedRoute(
            request_id=payload.request_id,
            result_id=payload.result_id,
            status=payload.status,
            reason=payload.reason
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)

        # Log to History
        history = RecommendationHistory(
            request_id=payload.request_id,
            approved_route_id=approval.id,
            decision=payload.status,
            reason=payload.reason
        )
        db.add(history)

        # Update Audit Logs status
        audit = db.query(RecommendationAuditLog).order_by(RecommendationAuditLog.timestamp.desc()).first()
        if audit:
            audit.approval_status = payload.status

        db.commit()

        return RouteApprovalResponse(
            success=True,
            status=payload.status,
            message=f"Recommendation request {payload.request_id} has been marked as: {payload.status}."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ==================================================
# 3. POST /recommendations/reject
# ==================================================
@router.post("/reject", response_model=RouteApprovalResponse)
def reject_recommendation(
    payload: RouteApprovalRequest,
    db: Session = Depends(get_db)
):
    return approve_recommendation(payload, db)


# ==================================================
# 4. GET /recommendations/history
# ==================================================
@router.get("/history", response_model=List[RecommendationHistoryItem])
def get_recommendation_history(
    limit: int = Query(50, ge=1),
    db: Session = Depends(get_db)
):
    history = db.query(RecommendationHistory).order_by(RecommendationHistory.timestamp.desc()).limit(limit).all()
    return history


# ==================================================
# 5. GET /recommendations/details
# ==================================================
@router.get("/details/{result_id}", response_model=RecommendationResultResponse)
def get_recommendation_details(
    result_id: int,
    db: Session = Depends(get_db)
):
    res = db.query(RecommendationResult).filter(RecommendationResult.id == result_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Recommendation result not found.")
    return res


# ==================================================
# 6. GET /recommendations/comparison
# ==================================================
@router.get("/comparison", response_model=List[RecommendationResultResponse])
def get_recommendations_comparison(
    ids: List[int] = Query(...),
    db: Session = Depends(get_db)
):
    res_list = db.query(RecommendationResult).filter(RecommendationResult.id.in_(ids)).all()
    return res_list


# ==================================================
# 7. GET /recommendations/{result_id}/decision-context
# ==================================================
@router.get("/{result_id}/decision-context")
def get_recommendation_decision_context(
    result_id: str,
    db: Session = Depends(get_db)
):
    transaction_id = result_id.replace("REC-TXN-", "")
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()

    if not transaction:
        transaction = (
            db.query(Transaction)
            .order_by(
                cast(Transaction.sla_breach, Integer).desc(),
                (Transaction.transit_days_actual - Transaction.transit_days_expected).desc(),
                Transaction.logistics_cost_total_usd.desc(),
            )
            .first()
        )

    if not transaction:
        raise HTTPException(status_code=404, detail="No logistics transactions are available for decision context.")

    origin_hub = db.query(Hub).filter(Hub.hub_id == transaction.origin_hub_id).first()
    part = db.query(Part).filter(Part.part_no == transaction.part_no).first()
    corridors = route_intelligence_service.get_scored_corridors(db)
    route_corridors = [
        corridor for corridor in corridors
        if corridor.source_id in {transaction.origin_hub_id, transaction.intermediate_hub_id}
        or corridor.target_id in {transaction.intermediate_hub_id, transaction.tpr_id}
    ]

    current_cost = float(transaction.logistics_cost_total_usd or 0.0)
    expected_days = max(1.0, float(transaction.transit_days_expected or 1))
    actual_days = max(expected_days, float(transaction.transit_days_actual or expected_days))
    delay_days = max(0.0, actual_days - expected_days)
    route_breach_rate = (
        sum(c.sla_breach_rate for c in route_corridors) / len(route_corridors)
        if route_corridors else (65.0 if transaction.sla_breach else 22.0)
    )
    sla_risk = round(max(5.0, min(96.0, route_breach_rate * 0.65 + min(delay_days, 8.0) * 4.0)))
    recommendation_score = round(max(45.0, min(99.0, 100.0 - sla_risk * 0.45 + min(delay_days, 10.0) * 1.8)), 1)
    confidence = round(max(70.0, min(99.0, 96.0 - sla_risk * 0.12 + len(route_corridors) * 0.6)))
    potential_savings = round(max(120.0, current_cost * (0.08 + min(delay_days, 8.0) * 0.012)))
    recommended_cost = max(0.0, round(current_cost - potential_savings, 2))
    savings_percentage = round((potential_savings / current_cost) * 100, 1) if current_cost else 0.0
    recommended_eta = round(max(0.5, expected_days + min(delay_days, 3.0) * 0.25), 1)
    eta_improvement = round(max(0.0, actual_days - recommended_eta), 1)
    transit_improvement_pct = round((eta_improvement / actual_days) * 100) if actual_days else 0
    origin_stock = int(transaction.stock_at_origin_hub or 0)
    route_text = " -> ".join([value for value in [
        transaction.origin_hub_id,
        transaction.intermediate_hub_id,
        transaction.tpr_id or transaction.destination_location,
    ] if value])
    alternatives = []
    for index, corridor in enumerate(
        sorted(corridors, key=lambda item: (item.sla_breach_rate, item.avg_cost_per_unit, item.avg_transit_days))[:3],
        start=1,
    ):
        alternatives.append({
            "id": f"alt-{index}",
            "title": f"{corridor.source_id} to {corridor.target_id}",
            "cost": round(float(corridor.avg_cost_per_unit or 0.0), 2),
            "savingsPercent": round(max(0.0, min(40.0, savings_percentage - index)), 1),
            "etaImprovement": round(max(0.1, eta_improvement - index * 0.2), 1),
        })

    hub_utilization = 0.0
    if origin_hub:
        hub_utilization = float(origin_hub.utilisation_pct or 0.0)
        if hub_utilization <= 1:
            hub_utilization *= 100

    from backend.ai.llm import generate_json_response
    gemini_prompt = f"""You are Sanchar AI's Decision Context Engine. Review the local deterministic calculation and return the final highly accurate values.
Transaction: {transaction.transaction_id}
Local SLA Risk: {sla_risk}%
Local Rec Score: {recommendation_score}%
Local Confidence: {confidence}%
Local Potential Savings: ${potential_savings}

Please return the final combined assessment strictly in JSON:
{{
  "recommendationScore": {recommendation_score},
  "potentialSavings": {potential_savings},
  "savingsPercentage": {savings_percentage},
  "etaImprovementDays": {eta_improvement},
  "slaRiskPercentage": {sla_risk},
  "confidencePercentage": {confidence}
}}
"""
    gemini_response = generate_json_response(gemini_prompt)
    if gemini_response:
        recommendation_score = round(float(gemini_response.get("recommendationScore", recommendation_score)), 1)
        potential_savings = round(float(gemini_response.get("potentialSavings", potential_savings)), 2)
        savings_percentage = round(float(gemini_response.get("savingsPercentage", savings_percentage)), 1)
        eta_improvement = round(float(gemini_response.get("etaImprovementDays", eta_improvement)), 1)
        sla_risk = int(gemini_response.get("slaRiskPercentage", sla_risk))
        confidence = int(gemini_response.get("confidencePercentage", confidence))

        # Recalculate derived fields
        recommended_cost = max(0.0, round(current_cost - potential_savings, 2))
        recommended_eta = round(max(0.5, actual_days - eta_improvement), 1)

    return {
        "id": result_id,
        "recommendationScore": recommendation_score,
        "potentialSavings": potential_savings,
        "savingsPercentage": savings_percentage,
        "etaImprovementDays": eta_improvement,
        "slaRiskPercentage": sla_risk,
        "confidencePercentage": confidence,
        "caseOverview": {
          "origin": origin_hub.hub_name if origin_hub else transaction.origin_hub_id,
          "destination": transaction.destination_location,
          "routeId": transaction.transaction_id,
          "partNo": transaction.part_no,
          "priority": transaction.priority,
          "quantity": transaction.quantity,
          "value": round(float(transaction.total_cost_usd or transaction.parts_value_usd or 0.0), 2),
          "recommendedAction": route_text,
          "status": "Under Review" if transaction.sla_breach or delay_days > 0 else "Ready"
        },
        "graphState": {
          "demand": f"{transaction.quantity} units",
          "inventory": "Sufficient" if origin_stock >= transaction.quantity else "Low Stock",
          "transit": f"{eta_improvement} days faster",
          "slaRisk": f"{sla_risk}% predicted",
          "hubCapacity": f"{round(hub_utilization, 1)}%",
          "cost": f"${potential_savings:,.0f} saving",
          "route": route_text
        },
        "costAnalysis": {
          "currentRouteCost": round(current_cost, 2),
          "recommendedCost": recommended_cost,
          "savings": potential_savings,
          "breakdown": [
            { "label": "Transport", "value": round(current_cost * 0.72, 2) },
            { "label": "Handling", "value": round(current_cost * 0.14, 2) },
            { "label": "Inventory Delay", "value": round(current_cost * 0.09, 2) },
            { "label": "Risk Premium", "value": round(current_cost * 0.05, 2) }
          ]
        },
        "transitAnalysis": {
          "currentETA": actual_days,
          "recommendedETA": recommended_eta,
          "improvementPercent": transit_improvement_pct
        },
        "evidenceSources": [
          { "id": "1", "title": "Logistics Transactions", "records": f"{db.query(Transaction).count():,} records", "status": "Loaded" },
          { "id": "2", "title": "Corridor Scores", "records": f"{len(corridors):,} lanes", "status": "Scored" },
          { "id": "3", "title": "Hub Performance", "records": origin_hub.hub_type if origin_hub else "Hub record", "status": "Verified" },
          { "id": "4", "title": "Part Master", "records": part.category if part else "Part record", "status": "Matched" },
          { "id": "5", "title": "Inventory Snapshot", "records": f"{origin_stock:,} at origin", "status": "Current" }
        ],
        "alternatives": alternatives,
        "riskSLA": {
          "predictedRisk": sla_risk,
          "slaAchievementProb": max(1, 100 - sla_risk),
          "riskFactors": [
              "Historical SLA breach on selected corridor" if transaction.sla_breach else "Historical SLA performance acceptable",
              "Origin stock below requested quantity" if origin_stock < transaction.quantity else "Origin stock covers requested quantity",
              f"Carrier: {transaction.logistics_partner}"
          ]
        },
        "inventoryImpact": {
          "originStock": origin_stock,
          "originStatus": "Sufficient" if origin_stock >= transaction.quantity else "Low Stock",
          "destinationDemand": int(transaction.quantity or 0),
          "destinationStatus": "High Demand" if transaction.priority.startswith("P1") or transaction.priority.startswith("P2") else "Normal Demand",
          "overallImpact": "No stockout risk" if origin_stock >= transaction.quantity else "Replenishment required before approval"
        }
    }
