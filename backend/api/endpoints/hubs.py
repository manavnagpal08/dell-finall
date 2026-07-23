from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.api.deps import get_db, get_hub_repo
from backend.repositories.hub import HubRepository
from backend.schemas.hub import HubSchema
from typing import Any

router = APIRouter()

@router.get("", response_model=dict)
def get_hubs(
    search: str = Query(None, description="Fuzzy search by ID, name, city, or country"),
    hub_type: str = Query(None, description="Filter hubs by type"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    hub_repo: HubRepository = Depends(get_hub_repo)
) -> Any:
    """
    Retrieve list of hubs with search and type filters.
    """
    skip = (page - 1) * limit
    items, total = hub_repo.search_hubs(
        db, search=search, hub_type=hub_type, skip=skip, limit=limit
    )
    
    return {
        "items": [HubSchema.model_validate(item) for item in items],
        "total": total,

        "page": page,
        "limit": limit
    }
