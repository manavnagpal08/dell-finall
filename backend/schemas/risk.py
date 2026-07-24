from pydantic import BaseModel
from typing import List, Optional

class RiskEvent(BaseModel):
    id: str
    title: str
    description: str
    risk_type: str # "Weather" | "Geopolitical" | "Disaster"
    severity: str # "Critical" | "High" | "Medium" | "Low"
    latitude: float
    longitude: float
    radius_km: float
    affected_hubs: List[str]
    affected_shipments_count: int
    expected_impact_days: int
    recommended_action: str
