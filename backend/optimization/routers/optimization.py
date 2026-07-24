from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.api.deps import get_db
from backend.optimization.schemas.optimization import (
    OptimizationDashboardData,
    CostOptimizationData,
    ReverseOptimizationData,
    InventoryOptimizationData,
    HubOptimizationData,
    ConsolidationData,
    DemandPositioningData
)
from backend.optimization.services.opportunity import opportunity_service
from backend.optimization.services.cost_optimization import cost_optimization_engine
from backend.optimization.services.reverse_optimization import reverse_optimization_engine
from backend.optimization.services.inventory_optimization import inventory_optimization_engine
from backend.optimization.services.hub_optimization import hub_optimization_engine
from backend.optimization.services.consolidation import consolidation_engine
from backend.optimization.services.demand_positioning import demand_positioning_engine
from typing import Optional

router = APIRouter()

@router.get("/dashboard", response_model=OptimizationDashboardData)
def get_optimization_dashboard(
    region: Optional[str] = None,
    part_category: Optional[str] = None,
    priority: Optional[str] = None,
    hub_id: Optional[str] = None,
    tpr_id: Optional[str] = None,
    flow_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns executive summary metrics, balance indicators, and critical opportunity cards.
    """
    try:
        return opportunity_service.get_dashboard_summary(
            db=db,
            region=region,
            part_category=part_category,
            priority=priority,
            hub_id=hub_id,
            tpr_id=tpr_id,
            flow_type=flow_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile executive optimization summary: {str(e)}"
        )

@router.get("/cost", response_model=CostOptimizationData)
def get_cost_optimization(
    region: Optional[str] = None,
    part_category: Optional[str] = None,
    priority: Optional[str] = None,
    hub_id: Optional[str] = None,
    tpr_id: Optional[str] = None,
    flow_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns cost-centric route bypass listings and transport savings projections.
    """
    try:
        return cost_optimization_engine.optimize_costs(
            db=db,
            region=region,
            part_category=part_category,
            priority=priority,
            hub_id=hub_id,
            tpr_id=tpr_id,
            flow_type=flow_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate network transport cost optimization: {str(e)}"
        )

@router.get("/reverse", response_model=ReverseOptimizationData)
def get_reverse_optimization(
    region: Optional[str] = None,
    part_category: Optional[str] = None,
    priority: Optional[str] = None,
    hub_id: Optional[str] = None,
    tpr_id: Optional[str] = None,
    flow_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns reverse logistics loop repair center allocation opportunities.
    """
    try:
        return reverse_optimization_engine.optimize_reverse_logistics(
            db=db,
            region=region,
            part_category=part_category,
            priority=priority,
            hub_id=hub_id,
            tpr_id=tpr_id,
            flow_type=flow_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate reverse logistics loops: {str(e)}"
        )

@router.get("/inventory", response_model=InventoryOptimizationData)
def get_inventory_optimization(
    region: Optional[str] = None,
    part_category: Optional[str] = None,
    priority: Optional[str] = None,
    hub_id: Optional[str] = None,
    tpr_id: Optional[str] = None,
    flow_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns inventory carrying fee assessments and stock imbalance rebalancing cards.
    """
    try:
        return inventory_optimization_engine.optimize_inventory(
            db=db,
            region=region,
            part_category=part_category,
            priority=priority,
            hub_id=hub_id,
            tpr_id=tpr_id,
            flow_type=flow_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate stock holding cost optimizations: {str(e)}"
        )

@router.get("/hubs", response_model=HubOptimizationData)
def get_hub_optimization(
    region: Optional[str] = None,
    part_category: Optional[str] = None,
    priority: Optional[str] = None,
    hub_id: Optional[str] = None,
    tpr_id: Optional[str] = None,
    flow_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns hub load deviation standard deviations and re-routing flow targets.
    """
    try:
        return hub_optimization_engine.optimize_hub_loads(
            db=db,
            region=region,
            part_category=part_category,
            priority=priority,
            hub_id=hub_id,
            tpr_id=tpr_id,
            flow_type=flow_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate hub capacity balance metrics: {str(e)}"
        )

@router.get("/consolidation", response_model=ConsolidationData)
def get_consolidation_opportunities(
    region: Optional[str] = None,
    part_category: Optional[str] = None,
    priority: Optional[str] = None,
    hub_id: Optional[str] = None,
    tpr_id: Optional[str] = None,
    flow_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns consolidation candidate groupings for parallel shipment merges.
    """
    try:
        return consolidation_engine.optimize_consolidation(
            db=db,
            region=region,
            part_category=part_category,
            priority=priority,
            hub_id=hub_id,
            tpr_id=tpr_id,
            flow_type=flow_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate duplicate shipment consolidation opportunities: {str(e)}"
        )

@router.get("/demand-positioning", response_model=DemandPositioningData)
def get_demand_positioning(
    region: Optional[str] = None,
    part_category: Optional[str] = None,
    priority: Optional[str] = None,
    hub_id: Optional[str] = None,
    tpr_id: Optional[str] = None,
    flow_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns predictive demand positioning insights to solve cross-city stockouts.
    """
    try:
        return demand_positioning_engine.optimize(
            db=db,
            region=region,
            part_category=part_category,
            priority=priority,
            hub_id=hub_id,
            tpr_id=tpr_id,
            flow_type=flow_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate demand positioning opportunities: {str(e)}"
        )
