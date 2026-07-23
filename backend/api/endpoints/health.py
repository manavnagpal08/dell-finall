from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database.connection import get_db_session
from backend.models.hub import Hub
from backend.models.part import Part
from backend.models.tpr import TPR
from backend.models.transaction import Transaction

router = APIRouter()

@router.get("", response_model=dict)
def health_check(db: Session = Depends(get_db_session)):
    """
    Service health check endpoint.
    """
    counts = {
        "hubs": db.query(Hub).count(),
        "tprs": db.query(TPR).count(),
        "parts": db.query(Part).count(),
        "transactions": db.query(Transaction).count(),
    }
    data_ready = all(count > 0 for count in counts.values())

    return {
        "status": "ok" if data_ready else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Sanchar AI Logistics Intelligence API",
        "database": {
            "status": "ready" if data_ready else "missing_data",
            "counts": counts,
        },
    }
