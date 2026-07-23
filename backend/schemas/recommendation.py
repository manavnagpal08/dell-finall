from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class RecommendationRequestCreate(BaseModel):
    origin_hub_id: str = Field(..., example="HUB-DEL")
    destination: str = Field(..., example="TPR-DEL-01")
    part_no: str = Field(..., example="PART-1002")
    part_category: str = Field(..., example="Transceivers")
    quantity: int = Field(..., example=5)
    priority: str = Field(..., example="P1")
    shipment_type: str = Field(..., example="Forward")
    required_delivery_date: Optional[datetime] = None
    preferred_partner: Optional[str] = None

class RecommendationResultResponse(BaseModel):
    id: Optional[int] = None
    rank: int
    recommendation_score: float
    origin: str
    intermediate_hubs: Optional[str] = None
    destination: str
    distance_km: float
    est_transit_days: float
    est_cost_usd: float
    inventory_status: str
    hub_utilization_pct: float
    historical_sla_pct: float
    reasoning_json: Optional[Any] = None

    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    request_id: int
    ml_risk_analysis: dict
    recommendations: List[RecommendationResultResponse]

class RouteApprovalRequest(BaseModel):
    request_id: int
    result_id: Optional[int] = None
    status: str  # Approved, Rejected, Escalated, AlternativeRequested
    reason: Optional[str] = None

class RouteApprovalResponse(BaseModel):
    success: bool
    status: str
    message: str

class RecommendationActionAuditRequest(BaseModel):
    recommendation_id: str
    decision: str
    title: str
    flow_type: str
    source: str
    destination: str
    category: str
    estimated_savings_usd: float
    confidence_score: float
    reason: Optional[str] = None

class RecommendationHistoryItem(BaseModel):
    id: int
    timestamp: datetime
    user: str
    request_id: int
    decision: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    user: str
    timestamp: datetime
    inputs_json: Any
    recommendation_json: Any
    approval_status: str

    class Config:
        from_attributes = True
