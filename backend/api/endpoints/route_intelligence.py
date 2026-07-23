from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.api.deps import get_db
from backend.schemas.route_intelligence import (
    ScoredCorridor,
    HubIntelligence,
    RecommendationRequest,
    RecommendationResponse,
    SimulationRequest,
    SimulationImpact
)
from backend.services.route_intelligence_service import route_intelligence_service
from typing import List

router = APIRouter()

@router.get("/corridors", response_model=List[ScoredCorridor])
def get_scored_corridors(db: Session = Depends(get_db)):
    """
    Returns performance ratings and scores for all active logistics lanes.
    """
    try:
        return route_intelligence_service.get_scored_corridors(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scored corridors: {str(e)}"
        )

@router.get("/hubs", response_model=List[HubIntelligence])
def get_hub_intelligence(db: Session = Depends(get_db)):
    """
    Returns operational performance indices for all logistics hubs.
    """
    try:
        return route_intelligence_service.get_hub_intelligence(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate hub intelligence analytics: {str(e)}"
        )

@router.post("/recommend", response_model=RecommendationResponse)
def get_route_recommendation(payload: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Calculates deterministic, explainable path options linking origin to destination.
    """
    try:
        return route_intelligence_service.get_recommendations(
            db=db,
            origin=payload.origin,
            destination=payload.destination,
            part_no=payload.part_no,
            quantity=payload.quantity,
            priority=payload.priority,
            delivery_window=payload.required_delivery_window_days
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute route recommendations: {str(e)}"
        )

@router.post("/simulate", response_model=SimulationImpact)
def run_scenario_simulation(payload: SimulationRequest, db: Session = Depends(get_db)):
    """
    Runs What-If re-routing analysis assuming outages at selected hubs/repair centers.
    """
    try:
        return route_intelligence_service.simulate_scenario(
            db=db,
            disabled_hubs=payload.disabled_hubs,
            disabled_tprs=payload.disabled_tprs
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run What-If outage simulation: {str(e)}"
        )
