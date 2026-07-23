from pydantic import BaseModel
from typing import List, Dict, Optional

class OptimizationMetric(BaseModel):
    name: str
    current_value: float
    optimized_value: float
    savings_value: float
    improvement_pct: float

class ExecutiveRecommendation(BaseModel):
    id: str
    title: str
    category: str  # "Cost", "Reverse", "Inventory", "Hub Load", "Consolidation"
    impact_summary: str
    expected_savings: float
    transit_improvement_days: float
    sla_improvement_pct: float
    confidence_score: float
    business_reason: str

class OpportunityCard(BaseModel):
    id: str
    type: str  # "High Cost Corridor", "Overloaded Hub", "Idle Repair Center", "Inventory Imbalance", "Duplicate Shipment"
    description: str
    cost_saving: float
    severity: str  # "Critical", "High", "Medium", "Low"

class OptimizationDashboardData(BaseModel):
    kpis: List[OptimizationMetric]
    recommendations: List[ExecutiveRecommendation]
    opportunities: List[OpportunityCard]
    regional_savings: Dict[str, float]
    category_savings: Dict[str, float]
    optimization_score_current: float
    optimization_score_projected: float

class CostOptimizationData(BaseModel):
    metrics: List[OptimizationMetric]
    opportunities: List[OpportunityCard]
    recommendations: List[ExecutiveRecommendation]
    savings_by_region: Dict[str, float]

class ReverseOptimizationData(BaseModel):
    metrics: List[OptimizationMetric]
    opportunities: List[OpportunityCard]
    recommendations: List[ExecutiveRecommendation]
    savings_by_repair_center: Dict[str, float]

class InventoryOptimizationData(BaseModel):
    metrics: List[OptimizationMetric]
    opportunities: List[OpportunityCard]
    recommendations: List[ExecutiveRecommendation]
    savings_by_hub: Dict[str, float]

class HubOptimizationData(BaseModel):
    metrics: List[OptimizationMetric]
    opportunities: List[OpportunityCard]
    recommendations: List[ExecutiveRecommendation]
    hub_util_current: Dict[str, float]
    hub_util_projected: Dict[str, float]

class ConsolidationData(BaseModel):
    metrics: List[OptimizationMetric]
    opportunities: List[OpportunityCard]
    recommendations: List[ExecutiveRecommendation]
    savings_by_part_category: Dict[str, float]
