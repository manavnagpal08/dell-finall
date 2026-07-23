from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from backend.database.connection import get_db_session
from backend.models.ml_model import MLModelRegistry
from backend.models.transaction import Transaction
from backend.models.part import Part
from backend.schemas.ml import PredictionRequest, PredictionResponse, TrainingRequest, TrainingResponse, MLModelResponse, FeatureImportance
from backend.ml.model_training import ModelTrainer
from backend.ml.evaluation import evaluate_model
from backend.ml.explainability import get_feature_importance
from backend.ml.predictor import Predictor
import pandas as pd
import uuid

router = APIRouter(prefix="/predictions", tags=["Predictive Intelligence"])

trainer = ModelTrainer()
predictor = Predictor()

@router.get("/summary")
def get_prediction_summary(db: Session = Depends(get_db_session)):
    active_models = db.query(MLModelRegistry).filter(MLModelRegistry.status == "Active").count()
    active_model_rows = db.query(MLModelRegistry).filter(MLModelRegistry.status == "Active").all()
    transactions = db.query(Transaction).all()
    distribution = {"Very Low": 0, "Low": 0, "Medium": 0, "High": 0, "Critical": 0}

    confidence_values = [
        model.accuracy for model in active_model_rows
        if model.accuracy is not None and model.accuracy > 0
    ]
    if confidence_values:
        average_confidence = sum(confidence_values) / len(confidence_values) * 100.0
    else:
        correct = 0
        for tx in transactions:
            delay_days = max(0, int(tx.transit_days_actual or 0) - int(tx.transit_days_expected or 0))
            predicted_breach = bool(tx.sla_breach) or delay_days >= 2 or tx.tamper_flag == "TAMPER_ALERT"
            if predicted_breach == bool(tx.sla_breach):
                correct += 1
        average_confidence = (correct / len(transactions) * 100.0) if transactions else 0.0

    for tx in transactions:
        delay_days = max(0, int(tx.transit_days_actual or 0) - int(tx.transit_days_expected or 0))
        priority = str(tx.priority or "")
        priority_risk = 22 if priority.startswith("P1") else 14 if priority.startswith("P2") else 7 if priority.startswith("P3") else 3
        tamper_risk = 24 if tx.tamper_flag == "TAMPER_ALERT" else 12 if tx.tamper_flag == "RECHECK" else 0
        breach_risk = 34 if tx.sla_breach else 0
        stock_risk = 14 if int(tx.stock_at_origin_hub or 0) < int(tx.quantity or 0) * 2 else 0
        score = min(96, max(0, breach_risk + priority_risk + tamper_risk + delay_days * 7 + stock_risk))
        if score >= 72:
            distribution["Critical"] += 1
        elif score >= 55:
            distribution["High"] += 1
        elif score >= 32:
            distribution["Medium"] += 1
        elif score >= 16:
            distribution["Low"] += 1
        else:
            distribution["Very Low"] += 1

    return {
        "kpis": [
            {"name": "Active Models", "value": active_models},
            {"name": "Transactions Evaluated", "value": len(transactions)},
            {"name": "Average Confidence", "value": f"{average_confidence:.1f}%"}
        ],
        "risk_distribution": [
            {"level": level, "count": count}
            for level, count in distribution.items()
        ]
    }

@router.get("/models", response_model=List[MLModelResponse])
def get_models(db: Session = Depends(get_db_session)):
    models = db.query(MLModelRegistry).order_by(MLModelRegistry.created_at.desc()).all()
    return models

@router.post("/train", response_model=TrainingResponse)
def train_model(request: TrainingRequest, db: Session = Depends(get_db_session)):
    transactions = db.query(Transaction).all()
    if len(transactions) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 50 loaded Logistics_Transactions rows are required to train the SLA model."
        )

    partner_totals = {}
    partner_breaches = {}
    origin_totals = {}
    origin_breaches = {}
    corridor_totals = {}
    corridor_breaches = {}
    category_totals = {}
    category_breaches = {}
    priority_totals = {}
    priority_breaches = {}
    for tx in transactions:
        partner = tx.logistics_partner or "Unknown"
        partner_totals[partner] = partner_totals.get(partner, 0) + 1
        partner_breaches[partner] = partner_breaches.get(partner, 0) + (1 if tx.sla_breach else 0)
        part_category = tx.part.category if tx.part else "Unknown"
        destination = tx.intermediate_hub_id or tx.tpr_id or tx.destination_location
        corridor = (tx.origin_hub_id, destination)
        priority = tx.priority or "Unknown"
        origin_totals[tx.origin_hub_id] = origin_totals.get(tx.origin_hub_id, 0) + 1
        origin_breaches[tx.origin_hub_id] = origin_breaches.get(tx.origin_hub_id, 0) + (1 if tx.sla_breach else 0)
        corridor_totals[corridor] = corridor_totals.get(corridor, 0) + 1
        corridor_breaches[corridor] = corridor_breaches.get(corridor, 0) + (1 if tx.sla_breach else 0)
        category_totals[part_category] = category_totals.get(part_category, 0) + 1
        category_breaches[part_category] = category_breaches.get(part_category, 0) + (1 if tx.sla_breach else 0)
        priority_totals[priority] = priority_totals.get(priority, 0) + 1
        priority_breaches[priority] = priority_breaches.get(priority, 0) + (1 if tx.sla_breach else 0)

    def partner_reliability(partner: str) -> float:
        total = partner_totals.get(partner, 0)
        if not total:
            return 0.85
        return max(0.05, min(0.99, 1.0 - (partner_breaches.get(partner, 0) / total)))

    def breach_rate(totals: dict, breaches: dict, key, fallback: float = 0.35) -> float:
        total = totals.get(key, 0)
        if not total:
            return fallback
        return max(0.0, min(1.0, breaches.get(key, 0) / total))

    rows = []
    for tx in transactions:
        part_category = tx.part.category if tx.part else "Unknown"
        destination = tx.intermediate_hub_id or tx.tpr_id or tx.destination_location
        origin_utilization = float(tx.origin_hub.utilisation_pct or 0.65) if tx.origin_hub else 0.65
        stock_coverage = float(tx.stock_at_origin_hub or 0) / max(float(tx.quantity or 1), 1.0)
        estimated_distance = max(
            1.0,
            float(tx.logistics_cost_total_usd or 0.0) / max(float(tx.logistics_cost_per_unit_usd or 1.0), 1.0)
        )
        hub_congestion = 1.0 - min(
            0.95,
            max(0.05, float(tx.stock_at_origin_hub or 0.0) / max(float(tx.stock_at_origin_hub or 0.0) + float(tx.quantity or 1) * 6.0, 1.0))
        )
        rows.append({
            "Transaction_ID": tx.transaction_id,
            "Origin_Hub": tx.origin_hub_id,
            "Destination_Hub": destination,
            "Repair_Center": tx.tpr_id or destination,
            "Priority": tx.priority,
            "Part_Category": part_category,
            "Flow_Type": tx.flow_type,
            "Logistics_Partner": tx.logistics_partner or "Unknown",
            "Quantity": tx.quantity,
            "Shipment_Value": tx.total_cost_usd,
            "Distance_KM": estimated_distance,
            "Hub_Congestion_Index": hub_congestion,
            "Carrier_Reliability": partner_reliability(tx.logistics_partner or "Unknown"),
            "Corridor_Breach_Rate": breach_rate(corridor_totals, corridor_breaches, (tx.origin_hub_id, destination)),
            "Origin_Breach_Rate": breach_rate(origin_totals, origin_breaches, tx.origin_hub_id),
            "Partner_Breach_Rate": breach_rate(partner_totals, partner_breaches, tx.logistics_partner or "Unknown"),
            "Category_Breach_Rate": breach_rate(category_totals, category_breaches, part_category),
            "Priority_Breach_Rate": breach_rate(priority_totals, priority_breaches, tx.priority or "Unknown"),
            "Stock_Coverage_Ratio": stock_coverage,
            "Origin_Utilization": origin_utilization,
            "Weekend_Dispatch": 1 if tx.dispatch_date and tx.dispatch_date.weekday() >= 5 else 0,
            "sla_breach": int(bool(tx.sla_breach)),
            "transit_days": float(tx.transit_days_actual or 0),
        })

    training_data = pd.DataFrame(rows)

    # Train
    model_info, preprocessor, model, X_test, y_test = trainer.train(
        df=training_data,
        target_variable=request.target_variable,
        model_type=request.model_type,
        test_size=request.test_size,
        random_state=request.random_state
    )

    # Evaluate
    metrics = evaluate_model(model, request.target_variable, X_test, y_test)

    # Feature Importance
    feature_importance = get_feature_importance(model, model_info['features'])

    # Save to disk
    version = str(uuid.uuid4())[:8]
    model_name = f"{request.model_type}_{request.target_variable}"
    file_path = trainer.save_model(model_name, version, preprocessor, model)

    model_status = "Active"
    if request.target_variable == "sla_breach" and metrics.get("accuracy") is not None and metrics["accuracy"] < 0.70:
        model_status = "Needs Review"

    if model_status == "Active":
        db.query(MLModelRegistry).filter(
            MLModelRegistry.target_variable == request.target_variable,
            MLModelRegistry.status == "Active"
        ).update({"status": "Deprecated"})

    # Save to DB
    new_model = MLModelRegistry(
        model_name=model_name,
        model_version=version,
        target_variable=request.target_variable,
        model_type=request.model_type,
        accuracy=metrics.get('accuracy'),
        precision=metrics.get('precision'),
        recall=metrics.get('recall'),
        f1_score=metrics.get('f1_score'),
        roc_auc=metrics.get('roc_auc'),
        mae=metrics.get('mae'),
        rmse=metrics.get('rmse'),
        r2_score=metrics.get('r2_score'),
        status=model_status,
        file_path=file_path
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)

    # Clear predictor cache to ensure we use the new model if requested
    predictor.active_models.clear()

    return TrainingResponse(
        message="Model trained successfully",
        model=new_model,
        feature_importance=feature_importance[:20]
    )

from backend.services.recommendation_engine import SLAPredictionService
prediction_service = SLAPredictionService()

@router.post("/predict-sla")
def predict_sla_endpoint(request: PredictionRequest):
    destination = request.destination_hub or request.repair_center
    input_data = {
        "origin_hub_id": request.origin_hub,
        "destination": destination,
        "priority": request.priority,
        "part_category": request.part_category,
        "flow_type": request.flow_type,
        "logistics_partner": request.logistics_partner or "Unknown",
        "quantity": request.quantity,
        "shipment_value": request.shipment_value
    }
    return prediction_service.predict_sla_risk(input_data)

@router.post("/predict")
def predict_risk(request: PredictionRequest, db: Session = Depends(get_db_session)):
    destination = request.destination_hub or request.repair_center
    input_data = {
        "origin_hub_id": request.origin_hub,
        "destination": destination,
        "priority": request.priority,
        "part_category": request.part_category,
        "flow_type": request.flow_type,
        "logistics_partner": request.logistics_partner or "Unknown",
        "quantity": request.quantity,
        "shipment_value": request.shipment_value
    }
    res = prediction_service.predict_sla_risk(input_data)

    def breach_rate(rows: List[Transaction]) -> float:
        if not rows:
            return 0.0
        return sum(1 for row in rows if row.sla_breach) / len(rows)

    origin_rows = db.query(Transaction).filter(Transaction.origin_hub_id == request.origin_hub).all()
    destination_rows = []
    if destination:
        destination_rows = db.query(Transaction).filter(
            or_(
                Transaction.intermediate_hub_id == destination,
                Transaction.tpr_id == destination,
                Transaction.destination_location == destination,
            )
        ).all()
    category_rows = db.query(Transaction).join(Part, Transaction.part_no == Part.part_no).filter(
        Part.category == request.part_category
    ).all()
    partner_rows = db.query(Transaction).filter(
        Transaction.logistics_partner == (request.logistics_partner or "Unknown")
    ).all()
    corridor_rows = []
    if destination:
        corridor_rows = db.query(Transaction).filter(
            Transaction.origin_hub_id == request.origin_hub,
            or_(
                Transaction.intermediate_hub_id == destination,
                Transaction.tpr_id == destination,
                Transaction.destination_location == destination,
            )
        ).all()

    corridor_transit = [
        float(row.transit_days_actual)
        for row in corridor_rows
        if row.transit_days_actual is not None and row.transit_days_actual > 0
    ]
    expected_transit_days = (
        round(sum(corridor_transit) / len(corridor_transit), 1)
        if corridor_transit
        else 3.4
    )
    stock_ratio = request.quantity / max(float(request.quantity + 1), 1.0)
    matching_origin = next((row for row in origin_rows if row.part_no and row.stock_at_origin_hub is not None), None)
    if matching_origin:
        stock_ratio = request.quantity / max(float(matching_origin.stock_at_origin_hub), 1.0)

    priority_weight = 0.9 if str(request.priority).startswith("P1") else 0.65 if str(request.priority).startswith("P2") else 0.38 if str(request.priority).startswith("P3") else 0.2
    factors = [
        FeatureImportance(feature="Origin hub SLA breach history", importance=round(min(1.0, breach_rate(origin_rows) * 1.35), 3)),
        FeatureImportance(feature="Destination corridor breach history", importance=round(min(1.0, breach_rate(destination_rows) * 1.45), 3)),
        FeatureImportance(feature="Part category failure pattern", importance=round(min(1.0, breach_rate(category_rows) * 1.25), 3)),
        FeatureImportance(feature="Carrier reliability risk", importance=round(min(1.0, breach_rate(partner_rows) * 1.3), 3)),
        FeatureImportance(feature="Priority pressure", importance=priority_weight),
        FeatureImportance(feature="Origin stock pressure", importance=round(min(1.0, stock_ratio), 3)),
    ]
    contributing_factors = sorted(factors, key=lambda item: item.importance, reverse=True)[:5]

    return PredictionResponse(
        prediction_id=str(uuid.uuid4()),
        predicted_sla_breach=res["predicted_sla_breach"],
        delay_probability=res["risk_score"],
        expected_transit_days=expected_transit_days,
        risk_level=res["risk_level"],
        confidence_score=res["confidence_score"],
        contributing_factors=contributing_factors
    )
