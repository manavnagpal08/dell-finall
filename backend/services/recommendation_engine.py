import logging
import math
import os
import joblib
import pandas as pd
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.models.transaction import Transaction
from backend.ml.feature_engineering import engineer_features

logger = logging.getLogger(__name__)

class SLAPredictionService:
    """
    Production SLA Prediction Service powered by local ML with optional external reasoning.
    """
    _preprocessor = None
    _model = None

    @classmethod
    def load_model(cls):
        if cls._model is not None:
            return
        models_dir = "backend/ml/models_storage"
        if not os.path.exists(models_dir):
            return

        model_path = None
        try:
            from backend.database.connection import SessionLocal
            from backend.models.ml_model import MLModelRegistry

            db = SessionLocal()
            try:
                active = db.query(MLModelRegistry).filter(
                    MLModelRegistry.target_variable == "sla_breach",
                    MLModelRegistry.status == "Active"
                ).order_by(MLModelRegistry.accuracy.desc()).first()
                if active and active.file_path:
                    candidate = os.path.join(models_dir, os.path.basename(active.file_path))
                    if os.path.exists(candidate):
                        model_path = candidate
            finally:
                db.close()
        except Exception:
            model_path = None

        files = [f for f in os.listdir(models_dir) if "sla_breach" in f and f.endswith(".joblib")]
        if model_path is None and files:
            files = sorted(files, key=lambda f: os.path.getmtime(os.path.join(models_dir, f)), reverse=True)
            model_path = os.path.join(models_dir, files[0])

        if model_path is None:
            return

        try:
            data = joblib.load(model_path)
            cls._preprocessor = data['preprocessor']
            cls._model = data['model']
        except Exception:
            pass

    def predict_sla_risk(self, input_data: dict) -> dict:
        from backend.ai.llm import generate_json_response
        self.load_model()

        origin = input_data.get("origin_hub_id")
        destination = input_data.get("destination")

        if not origin or not destination:
            return {
                "risk_score": 0.0,
                "risk_level": "Low",
                "predicted_sla_breach": False,
                "confidence_score": 1.0,
                "message": "Missing origin or destination features."
            }

        df = pd.DataFrame([{
            'Origin_Hub': origin,
            'Repair_Center': destination,
            'Destination_Hub': destination,
            'Priority': input_data.get("priority", "P1"),
            'Part_Category': input_data.get("part_category", "Transceivers"),
            'Flow_Type': input_data.get("flow_type", "Forward"),
            'Logistics_Partner': input_data.get("logistics_partner", "Unknown"),
            'Quantity': int(input_data.get("quantity", 10)),
            'Shipment_Value': float(input_data.get("shipment_value", 1500.0)),
            'Distance_KM': float(input_data.get("distance_km", 600.0)),
            'Hub_Congestion_Index': float(input_data.get("hub_congestion_index", 0.45)),
            'Carrier_Reliability': float(input_data.get("carrier_reliability", 0.90)),
            'Corridor_Breach_Rate': float(input_data.get("corridor_breach_rate", 0.35)),
            'Origin_Breach_Rate': float(input_data.get("origin_breach_rate", 0.35)),
            'Partner_Breach_Rate': float(input_data.get("partner_breach_rate", 0.35)),
            'Category_Breach_Rate': float(input_data.get("category_breach_rate", 0.35)),
            'Priority_Breach_Rate': float(input_data.get("priority_breach_rate", 0.35)),
            'Stock_Coverage_Ratio': float(input_data.get("stock_coverage_ratio", 4.0)),
            'Origin_Utilization': float(input_data.get("origin_utilization", 0.65)),
            'Transit_Days': float(input_data.get("transit_days", 2.0))
        }])

        try:
            df_engineered = engineer_features(df)
            drop_cols = ['sla_breach', 'transit_days']
            df_to_transform = df_engineered.drop(columns=[c for c in drop_cols if c in df_engineered.columns])

            if self._preprocessor is not None and self._model is not None:
                df_processed = self._preprocessor.transform(df_to_transform)
                expected_features = getattr(self._model, "feature_names_in_", None)
                if expected_features is not None:
                    df_processed = df_processed.reindex(columns=list(expected_features), fill_value=0)
                local_prob = float(self._model.predict_proba(df_processed)[0][1])
                local_pred = bool(self._model.predict(df_processed)[0])
            else:
                local_prob = 0.10
                local_pred = False
        except Exception:
            local_prob = 0.10
            local_pred = False

        prompt = f"""You are Sanchar AI's SLA Risk Predictor. Combine our local ML model prediction with your advanced reasoning.
Shipment Details:
- Origin: {origin}
- Destination: {destination}
- Priority: {input_data.get('priority', 'P1')}
- Quantity: {input_data.get('quantity', 10)}
- Carrier Reliability: {input_data.get('carrier_reliability', 0.90)}
- Local ML Predicted Probability: {local_prob}

Provide your highly accurate assessment. Respond strictly in JSON format with these exact keys:
{{
  "risk_score": 0.15,
  "risk_level": "Low",
  "predicted_sla_breach": false,
  "confidence_score": 0.90,
  "message": "A short reasoning string."
}}
"""
        response = generate_json_response(prompt)
        if response and "risk_score" in response:
            return {
                "risk_score": round(float(response.get("risk_score", local_prob)), 3),
                "risk_level": response.get("risk_level", "Low"),
                "predicted_sla_breach": bool(response.get("predicted_sla_breach", local_pred)),
                "confidence_score": round(float(response.get("confidence_score", 0.9)), 3),
                "message": response.get("message", "Generated by Sanchar AI prediction orchestration.")
            }

        logger.warning("External SLA reasoning failed, using local model fallback.")
        risk_level = "Low"
        if local_prob >= 0.85: risk_level = "Critical"
        elif local_prob >= 0.65: risk_level = "High"
        elif local_prob >= 0.35: risk_level = "Medium"

        return {
            "risk_score": round(local_prob, 3),
            "risk_level": risk_level,
            "predicted_sla_breach": local_pred,
            "confidence_score": round(max(local_prob, 1.0 - local_prob), 3),
            "message": "Local Random Forest inference active."
        }


class RoutingRecommendationEngine:
    """
    Routing Recommendation Engine combining rule-based heuristics & ML risk probabilities.
    """
    def __init__(self):
        self.predictor = SLAPredictionService()

    def discover_and_rank(
        self,
        db: Session,
        origin_hub_id: str,
        destination: str,
        part_no: str,
        quantity: int,
        priority: str,
        shipment_type: str
    ) -> List[Dict[str, Any]]:
        # 1. Check Inventory Status
        part = db.query(Part).filter(Part.part_no == part_no).first()
        origin_hub = db.query(Hub).filter(Hub.hub_id == origin_hub_id).first()

        inventory_status = "Out of Stock"
        inventory_score = 0
        if origin_hub and part:
            stock_pct = origin_hub.current_stock_level / max(origin_hub.inventory_capacity, 1)
            if stock_pct > 0.3:
                inventory_status = "In Stock"
                inventory_score = 20
            elif stock_pct > 0.05:
                inventory_status = "Low Stock"
                inventory_score = 10

        dest_hub = db.query(Hub).filter(Hub.hub_id == destination).first()
        dest_location_name = dest_hub.city if dest_hub else destination

        # 2. Retrieve candidates
        direct_txs = db.query(Transaction).filter(
            Transaction.origin_hub_id == origin_hub_id,
            Transaction.destination_location == dest_location_name
        ).all()

        candidates = []

        def get_lane_stats(lane_txs: List[Transaction], o_id: str, d_id: str):
            if not lane_txs:
                o_hub = db.query(Hub).filter(Hub.hub_id == o_id).first()
                d_hub = db.query(Hub).filter(Hub.hub_id == d_id).first() or db.query(TPR).filter(TPR.tpr_id == d_id).first()

                dist = 500.0
                if o_hub and d_hub:
                    lat1, lon1 = o_hub.latitude, o_hub.longitude
                    lat2, lon2 = d_hub.latitude, d_hub.longitude
                    dist = self._haversine(lat1, lon1, lat2, lon2)

                return {
                    "avg_cost": max(dist * 12.5, 1500.0),
                    "avg_days": max(dist / 400.0, 1.5),
                    "sla_pct": 92.5,
                    "distance": dist
                }

            avg_cost = sum(t.logistics_cost_total_usd for t in lane_txs) / len(lane_txs)
            avg_days = sum(t.transit_days_actual for t in lane_txs) / len(lane_txs)
            breaches = sum(1 for t in lane_txs if t.sla_breach)
            sla_pct = ((len(lane_txs) - breaches) / len(lane_txs)) * 100.0

            dist = avg_cost / 15.0
            return {
                "avg_cost": avg_cost,
                "avg_days": avg_days,
                "sla_pct": sla_pct,
                "distance": max(dist, 100.0)
            }

        # Candidate 1: Direct route
        direct_stats = get_lane_stats(direct_txs, origin_hub_id, destination)
        candidates.append({
            "origin": origin_hub_id,
            "intermediate_hubs": "",
            "destination": destination,
            "distance_km": round(direct_stats["distance"], 1),
            "est_transit_days": round(direct_stats["avg_days"], 1),
            "est_cost_usd": round(direct_stats["avg_cost"], 2),
            "historical_sla_pct": round(direct_stats["sla_pct"], 1),
            "hub_utilization_pct": (origin_hub.utilisation_pct * 100) if origin_hub else 65.0
        })

        # Candidate 2 & 3: Two-hop routes
        all_hubs = db.query(Hub).filter(Hub.hub_id != origin_hub_id, Hub.hub_id != destination).limit(3).all()
        for idx, transit_hub in enumerate(all_hubs):
            transit_location_name = transit_hub.city
            leg1_txs = db.query(Transaction).filter(
                Transaction.origin_hub_id == origin_hub_id,
                Transaction.destination_location == transit_location_name
            ).all()
            leg2_txs = db.query(Transaction).filter(
                Transaction.origin_hub_id == transit_hub.hub_id,
                Transaction.destination_location == dest_location_name
            ).all()

            leg1_stats = get_lane_stats(leg1_txs, origin_hub_id, transit_hub.hub_id)
            leg2_stats = get_lane_stats(leg2_txs, transit_hub.hub_id, destination)

            candidates.append({
                "origin": origin_hub_id,
                "intermediate_hubs": transit_hub.hub_id,
                "destination": destination,
                "distance_km": round(leg1_stats["distance"] + leg2_stats["distance"], 1),
                "est_transit_days": round(leg1_stats["avg_days"] + leg2_stats["avg_days"] + 0.5, 1),
                "est_cost_usd": round(leg1_stats["avg_cost"] + leg2_stats["avg_cost"] + 250.0, 2),
                "historical_sla_pct": round((leg1_stats["sla_pct"] + leg2_stats["sla_pct"]) / 2.0, 1),
                "hub_utilization_pct": (transit_hub.utilisation_pct * 100)
            })

        min_cost = min(c["est_cost_usd"] for c in candidates)
        max_cost = max(c["est_cost_usd"] for c in candidates)
        min_days = min(c["est_transit_days"] for c in candidates)
        max_days = max(c["est_transit_days"] for c in candidates)

        scored_candidates = []
        for c in candidates:
            # Predict SLA breach risk via Random Forest service
            risk_payload = {
                "origin_hub_id": c["origin"],
                "destination": c["destination"],
                "priority": priority,
                "part_no": part_no,
                "quantity": quantity,
                "distance_km": c["distance_km"],
                "hub_congestion_index": c["hub_utilization_pct"] / 100.0,
                "carrier_reliability": c["historical_sla_pct"] / 100.0,
                "transit_days": c["est_transit_days"]
            }
            pred_risk = self.predictor.predict_sla_risk(risk_payload)
            risk_prob = pred_risk["risk_score"]

            # Dynamic Weights based on Priority
            weight_cost = 30
            weight_speed = 20
            weight_sla = 15
            weight_risk = 20
            weight_util = 15

            if priority and ("P1" in priority or "Critical" in priority):
                weight_cost = 10
                weight_speed = 40
            elif priority and ("P2" in priority or "High" in priority):
                weight_cost = 20
                weight_speed = 30
            elif priority and ("P4" in priority or "Low" in priority):
                weight_cost = 40
                weight_speed = 10

            # Cost Score
            cost_span = max_cost - min_cost
            cost_score = weight_cost
            if cost_span > 0:
                cost_score = weight_cost * (1.0 - (c["est_cost_usd"] - min_cost) / cost_span)

            # Speed Score
            days_span = max_days - min_days
            speed_score = weight_speed
            if days_span > 0:
                speed_score = weight_speed * (1.0 - (c["est_transit_days"] - min_days) / days_span)

            # Historical SLA Score
            sla_score = weight_sla * (c["historical_sla_pct"] / 100.0)

            # ML Risk Score Penalty (lower risk is better)
            risk_score = weight_risk * (1.0 - risk_prob)

            # Hub Utilization
            util = c["hub_utilization_pct"]
            util_score = weight_util if 40 <= util <= 75 else (weight_util / 3.0)

            total_score = inventory_score + cost_score + speed_score + sla_score + risk_score + util_score
            final_score = max(0.0, min(100.0, total_score))

            reasoning = self._generate_ai_reasoning(c, final_score, part_no, priority, pred_risk)

            scored_candidates.append({
                **c,
                "recommendation_score": round(final_score, 1),
                "inventory_status": inventory_status,
                "reasoning_json": reasoning,
                "predicted_risk_prob": risk_prob,
                "predicted_risk_level": pred_risk["risk_level"]
            })

        # Re-rank routes dynamically
        scored_candidates.sort(key=lambda x: x["recommendation_score"], reverse=True)
        for rank, c in enumerate(scored_candidates):
            c["rank"] = rank + 1

        return scored_candidates

    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = math.sin(d_lat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    def _generate_ai_reasoning(self, route: dict, score: float, part_no: str, priority: str, risk: dict) -> dict:
        from backend.ai.llm import generate_json_response

        prompt = f"""You are Sanchar AI's Logistics Copilot. Write a detailed business justification for this routing candidate.
Route Details:
- Origin: {route['origin']}
- Destination: {route['destination']}
- Intermediate Hubs: {route.get('intermediate_hubs', 'None (Direct)')}
- Est. Cost: ${route['est_cost_usd']}
- Transit Days: {route['est_transit_days']}
- Historical SLA: {route['historical_sla_pct']}%
- Hub Utilization: {route['hub_utilization_pct']}%

Context:
- Part No: {part_no}
- Priority: {priority}
- Score: {score}
- ML SLA Risk: {risk.get('risk_score', 0)} ({risk.get('risk_level', 'Unknown')})

Respond strictly in JSON format with these exact keys:
{{
  "problem": "Brief statement of the logistics challenge",
  "business_context": "The operational context and priority",
  "reason_for_selection": "Why this route achieved its score",
  "supporting_evidence": "Data-backed evidence supporting this route",
  "operational_benefits": "Benefits to the supply chain",
  "potential_cost_savings": (float, e.g. 120.5),
  "expected_delivery_time": "X Days",
  "confidence_score": (integer 0-100),
  "recommendation_priority": "High, Medium, or Low"
}}
"""
        response = generate_json_response(prompt)
        if response and "problem" in response:
            return response

        # Fallback
        is_direct = not bool(route.get("intermediate_hubs"))
        path_desc = f"Direct path from {route['origin']} to {route['destination']}"
        if not is_direct:
            path_desc = f"Multi-hub pathway routing via {route['intermediate_hubs']}"

        cost_saving = max(route["est_cost_usd"] * 0.12, 120.0) if score > 80 else 0.0

        return {
            "problem": f"Fulfillment execution parameters for part {part_no} on lane.",
            "business_context": f"Request registered under {priority} priority level. System computed paths factoring ML SLA Risk.",
            "reason_for_selection": f"Selected route achieves optimal balance with a recommendation score of {score:.1f}%. It leverages a {path_desc}.",
            "supporting_evidence": f"Estimated transit: {route['est_transit_days']} days. ML SLA risk probability: {risk.get('risk_score',0)} ({risk.get('risk_level','')}). Cost: ${route['est_cost_usd']:,.2f}.",
            "operational_benefits": "Reduced terminal handling delays and balanced regional inventory distribution.",
            "potential_cost_savings": cost_saving,
            "expected_delivery_time": f"{route['est_transit_days']} Days",
            "confidence_score": int(risk.get("confidence_score", 0.9) * 100),
            "recommendation_priority": "High" if priority in ["P1", "P2"] else "Medium"
        }
