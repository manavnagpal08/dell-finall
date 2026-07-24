from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from backend.api.deps import get_db
from backend.schemas.network import NetworkOverviewSchema
from backend.services.network_service import network_service
from typing import Optional

router = APIRouter()

@router.get("/overview", response_model=NetworkOverviewSchema)
def get_network_overview(
    flow_type: Optional[str] = Query(None, description="Filter by Forward/Reverse logistics"),
    country: Optional[str] = Query(None, description="Filter by Hub/TPR country"),
    region: Optional[str] = Query(None, description="Filter by Hub/TPR region"),
    hub_type: Optional[str] = Query(None, description="Filter by hub type classification"),
    tpr_id: Optional[str] = Query(None, description="Filter by specific repair center ID"),
    part_category: Optional[str] = Query(None, description="Filter by part component category"),
    priority: Optional[str] = Query(None, description="Filter by shipment priority (P1-P4)"),
    sla_status: Optional[str] = Query(None, description="Filter by SLA Breach / SLA Met"),
    min_cost: Optional[float] = Query(None, description="Filter by minimum total segment cost"),
    max_cost: Optional[float] = Query(None, description="Filter by maximum total segment cost"),
    min_transit: Optional[float] = Query(None, description="Filter by minimum segment transit days"),
    max_transit: Optional[float] = Query(None, description="Filter by maximum segment transit days"),
    timeline_month: Optional[int] = Query(None, description="Timeline playback month (1-12)"),
    search: Optional[str] = Query(None, description="Global search term"),
    db: Session = Depends(get_db)
):
    """
    Retrieves the complete Supply Chain Control Tower graph topology, KPIs, and operational insights.
    """
    try:
        data = network_service.get_network_overview(
            db=db,
            flow_type=flow_type,
            country=country,
            region=region,
            hub_type=hub_type,
            tpr_id=tpr_id,
            part_category=part_category,
            priority=priority,
            sla_status=sla_status,
            min_cost=min_cost,
            max_cost=max_cost,
            min_transit=min_transit,
            max_transit=max_transit,
            timeline_month=timeline_month,
            search=search
        )
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate Supply Chain Control Tower stats: {str(e)}"
        )

from typing import List
from backend.schemas.risk import RiskEvent
from backend.services.risk_service import risk_service

@router.get("/risk-overlay", response_model=List[RiskEvent])
def get_risk_overlay(db: Session = Depends(get_db)):
    """
    Retrieves real-time global disaster and geopolitical risks using GDACS live feeds, 
    calculates intersections with our Hub locations, and returns risk radii.
    """
    try:
        data = risk_service.get_realtime_risk_overlay(db=db)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch real-time risk data: {str(e)}"
        )

