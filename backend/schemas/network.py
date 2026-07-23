from pydantic import BaseModel
from typing import List, Optional

class NetworkKPIs(BaseModel):
    total_nodes: int
    total_lanes: int
    average_lane_cost_usd: float
    sla_breach_rate: float
    congested_nodes_count: int
    # Advanced Control Tower KPIs
    network_health_score: float
    average_corridor_cost: float
    average_transit_time: float
    active_corridors: int
    most_connected_hub: str
    highest_risk_corridor: str
    average_hub_utilization: float
    reverse_logistics_ratio: float
    forward_logistics_ratio: float
    repair_center_capacity: int
    operational_availability: float

class NetworkNode(BaseModel):
    id: str
    name: str
    type: str  # Primary Hub, Regional Hub, Satellite Hub, International Hub, Repair Center
    city: str
    country: str
    latitude: float
    longitude: float
    current_stock: int
    capacity: int
    utilisation: float
    status: str  # Normal, Overloaded, Underutilised
    inbound_shipments_count: int
    outbound_shipments_count: int

class NetworkLink(BaseModel):
    source_id: str
    target_id: str
    flow_type: str  # Forward, Reverse
    volume: int
    total_cost: float
    avg_cost_per_unit: float
    sla_breach_rate: float
    avg_transit_days: float
    source_coordinates: List[float]  # [lat, lon]
    target_coordinates: List[float]  # [lat, lon]

class NetworkInsightCard(BaseModel):
    id: str
    title: str
    value: str
    description: str
    metric_type: str  # "positive", "negative", "neutral"

class NetworkOverviewSchema(BaseModel):
    kpis: NetworkKPIs
    nodes: List[NetworkNode]
    links: List[NetworkLink]
    insights: List[NetworkInsightCard]
