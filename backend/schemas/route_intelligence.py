from pydantic import BaseModel
from typing import List, Optional

class ScoredCorridor(BaseModel):
    source_id: str
    target_id: str
    distance_km: float
    shipment_count: int
    total_cost: float
    avg_cost_per_unit: float
    avg_transit_days: float
    sla_success_rate: float
    sla_breach_rate: float
    forward_volume: int
    reverse_volume: int
    efficiency_score: float
    risk_score: float
    reliability_score: float
    cost_score: float
    transit_score: float
    utilization_score: float
    overall_score: float
    status: str  # e.g. "Optimal", "High Risk", "Inefficient", "Bottleneck"

class HubIntelligence(BaseModel):
    hub_id: str
    hub_name: str
    inventory_capacity: int
    current_inventory: int
    inbound_shipments: int
    outbound_shipments: int
    throughput: int
    avg_dispatch_cost: float
    avg_transit_time: float
    connected_corridors_count: int
    avg_sla_performance: float
    operational_risk: float
    efficiency_score: float
    top_parts: List[str]
    top_destinations: List[str]

class RouteOption(BaseModel):
    path: List[str]
    total_cost: float
    total_transit_days: float
    total_distance_km: float = 0.0
    sla_success_rate: float
    sla_breach_rate: float
    risk_level: str  # "Low", "Medium", "High"
    confidence_score: float
    congestion_index: float
    explanation: str

class RecommendationRequest(BaseModel):
    origin: str
    destination: str
    part_no: str
    quantity: int
    priority: str  # P1, P2, P3, P4
    required_delivery_window_days: int

class RecommendationResponse(BaseModel):
    recommended: Optional[RouteOption] = None
    alternatives: List[RouteOption] = []
    explanation: str
    verification_status: str = "Deterministic engine verified"
    verification_summary: Optional[str] = None

class SimulationRequest(BaseModel):
    disabled_hubs: List[str] = []
    disabled_tprs: List[str] = []

class SimulationImpact(BaseModel):
    affected_shipments_count: int
    rerouted_shipments_count: int
    original_total_cost: float
    new_total_cost: float
    cost_delta: float
    original_avg_transit_days: float
    new_avg_transit_days: float
    transit_days_delta: float
    original_sla_breach_rate: float
    new_sla_breach_rate: float
    sla_breach_delta: float
    operational_impact_summary: str
