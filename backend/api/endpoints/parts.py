from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.api.deps import get_db, get_part_repo
from backend.repositories.part import PartRepository
from backend.schemas.part import PartSchema
from typing import Any

router = APIRouter()

@router.get("", response_model=dict)
def get_parts(
    search: str = Query(None, description="Fuzzy search by Part_No, description, or category"),
    category: str = Query(None, description="Filter parts by category"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    part_repo: PartRepository = Depends(get_part_repo)
) -> Any:
    """
    Retrieve list of Parts with search and category filters.
    """
    skip = (page - 1) * limit
    items, total = part_repo.search_parts(
        db, search=search, category=category, skip=skip, limit=limit
    )
    
    return {
        "items": [PartSchema.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "limit": limit
    }
