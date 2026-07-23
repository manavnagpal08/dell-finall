from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.api.deps import get_db
from backend.core.config import settings
from backend.schemas.dataset import IngestionReportSchema, DashboardStatisticsSchema, DatasetLoadRequest
from backend.services.data_loader import data_loader
from backend.services.analytics import analytics_service

router = APIRouter()

@router.post("/load", response_model=IngestionReportSchema)
def load_dataset(
    request_data: DatasetLoadRequest, 
    db: Session = Depends(get_db)
):
    """
    Trigger the Excel ingestion pipeline. Validates, cleans, and stores the data.
    """
    file_path = request_data.file_path or settings.DEFAULT_DATASET_PATH
    
    try:
        report = data_loader.load_dataset(db, file_path)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dataset loader encountered an unexpected error: {str(e)}"
        )

@router.get("/statistics", response_model=DashboardStatisticsSchema)
def get_dataset_statistics(db: Session = Depends(get_db)):
    """
    Calculates summary aggregates and chart distributions for the executive dashboard.
    """
    try:
        stats = analytics_service.get_dashboard_statistics(db)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard statistics: {str(e)}"
        )
