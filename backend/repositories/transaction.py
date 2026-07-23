from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from backend.repositories.base import BaseRepository
from backend.models.transaction import Transaction

class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self):
        super().__init__(Transaction)

    def search_transactions(
        self,
        db: Session,
        *,
        search: str = None,
        flow_type: str = None,
        priority: str = None,
        sla_breach: bool = None,
        tamper_flag: str = None,
        status: str = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = None,
        sort_order: str = "asc"
    ) -> tuple[list[Transaction], int]:
        """
        Fuzzy search, filter and sort transactions. Returns (items, total_count).
        """
        query = db.query(Transaction)
        
        # 1. Filters
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Transaction.transaction_id.ilike(search_pattern),
                    Transaction.part_no.ilike(search_pattern),
                    Transaction.source_location.ilike(search_pattern),
                    Transaction.destination_location.ilike(search_pattern),
                    Transaction.logistics_partner.ilike(search_pattern)
                )
            )
            
        if flow_type:
            query = query.filter(Transaction.flow_type == flow_type)
            
        if priority:
            query = query.filter(Transaction.priority == priority)
            
        if sla_breach is not None:
            query = query.filter(Transaction.sla_breach == sla_breach)
            
        if tamper_flag:
            query = query.filter(Transaction.tamper_flag == tamper_flag)
            
        if status:
            query = query.filter(Transaction.status == status)

        # 2. Sorting
        if sort_by:
            column = getattr(Transaction, sort_by, None)
            if column is not None:
                if sort_order.lower() == "desc":
                    query = query.order_by(desc(column))
                else:
                    query = query.order_by(asc(column))
        else:
            # Default sorting by transaction_id or dispatch_date
            query = query.order_by(desc(Transaction.dispatch_date))

        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def get_count(self, db: Session) -> int:
        return db.query(Transaction).count()

    def get_forward_count(self, db: Session) -> int:
        return db.query(Transaction).filter(Transaction.flow_type == "Forward").count()

    def get_reverse_count(self, db: Session) -> int:
        return db.query(Transaction).filter(Transaction.flow_type == "Reverse").count()

    def get_sla_breach_count(self, db: Session) -> int:
        return db.query(Transaction).filter(Transaction.sla_breach == True).count()

    def get_tamper_alert_count(self, db: Session) -> int:
        return db.query(Transaction).filter(Transaction.tamper_flag == "TAMPER_ALERT").count()

transaction_repository = TransactionRepository()
