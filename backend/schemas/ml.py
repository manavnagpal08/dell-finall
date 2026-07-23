from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class MLModelBase(BaseModel):
    model_name: str
    model_version: str
    target_variable: str
    model_type: str
    
class MLModelResponse(MLModelBase):
    id: int
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2_score: Optional[float] = None
    training_time_sec: Optional[float] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FeatureImportance(BaseModel):
    feature: str
    importance: float

class PredictionRequest(BaseModel):
    origin_hub: str
    destination_hub: Optional[str] = None
    repair_center: Optional[str] = None
    priority: str
    part_category: str
    flow_type: str
    quantity: int
    shipment_value: float
    logistics_partner: Optional[str] = None

class PredictionResponse(BaseModel):
    prediction_id: str
    predicted_sla_breach: bool
    delay_probability: float
    expected_transit_days: float
    risk_level: str # Very Low, Low, Medium, High, Critical
    confidence_score: float
    contributing_factors: List[FeatureImportance]

class TrainingRequest(BaseModel):
    target_variable: str = "sla_breach" # sla_breach or transit_days
    model_type: str = "RandomForest"
    test_size: float = 0.2
    random_state: int = 42

class TrainingResponse(BaseModel):
    message: str
    model: MLModelResponse
    feature_importance: List[FeatureImportance]
