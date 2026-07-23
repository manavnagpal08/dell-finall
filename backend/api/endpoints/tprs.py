from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.api.deps import get_db, get_tpr_repo
from backend.repositories.tpr import TPRRepository
from backend.schemas.tpr import TPRSchema
from typing import Any

router = APIRouter()

@router.get("", response_model=dict)
def get_tprs(
    search: str = Query(None, description="Fuzzy search by ID, name, city, or country"),
    specialisation: str = Query(None, description="Filter TPRs by specialization"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    tpr_repo: TPRRepository = Depends(get_tpr_repo)
) -> Any:
    """
    Retrieve list of TPRs with search and specialization filters.
    """
    skip = (page - 1) * limit
    items, total = tpr_repo.search_tprs(
        db, search=search, specialisation=specialisation, skip=skip, limit=limit
    )
    
    return {
        "items": [TPRSchema.model_validate(item) for item in items],
        "total": total,

        "page": page,
        "limit": limit
    }
