from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from backend.api.deps import get_db, get_transaction_repo
from backend.repositories.transaction import TransactionRepository
from backend.schemas.transaction import TransactionSchema, TransactionDetailSchema
from backend.models.transaction import Transaction
from typing import Any, Optional

router = APIRouter()

@router.get("", response_model=dict)
def get_transactions(
    search: str = Query(None, description="Search by ID, Part No, Source, Destination, or Partner"),
    flow_type: str = Query(None, description="Filter by Forward/Reverse logistics"),
    priority: str = Query(None, description="Filter by priority P1-P4"),
    sla_breach: Optional[bool] = Query(None, description="Filter by SLA Breach state"),
    tamper_flag: str = Query(None, description="Filter by CLEAR, TAMPER_ALERT, RECHECK"),
    status_filter: str = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=1000),
    sort_by: str = Query(None, description="Column to sort by"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
    tx_repo: TransactionRepository = Depends(get_transaction_repo)
) -> Any:
    """
    Retrieve list of transactions with advanced search, filter, sorting, and pagination.
    """
    skip = (page - 1) * limit
    items, total = tx_repo.search_transactions(
        db,
        search=search,
        flow_type=flow_type,
        priority=priority,
        sla_breach=sla_breach,
        tamper_flag=tamper_flag,
        status=status_filter,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {
        "items": [TransactionSchema.model_validate(item, from_attributes=True) for item in items],
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/{transaction_id}", response_model=TransactionDetailSchema)
def get_transaction_by_id(
    transaction_id: str,
    db: Session = Depends(get_db),
    tx_repo: TransactionRepository = Depends(get_transaction_repo)
):
    """
    Get a single transaction by ID, with relationships pre-loaded (Part, Hubs, TPR).
    """
    # Fetch using eager loads for relations
    item = db.query(Transaction).options(
        joinedload(Transaction.part),
        joinedload(Transaction.origin_hub),
        joinedload(Transaction.intermediate_hub),
        joinedload(Transaction.tpr)
    ).filter(Transaction.transaction_id == transaction_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID '{transaction_id}' not found."
        )
        
    return TransactionDetailSchema.from_attributes(item)
