from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.repositories.base import BaseRepository
from backend.models.tpr import TPR

class TPRRepository(BaseRepository[TPR]):
    def __init__(self):
        super().__init__(TPR)

    def search_tprs(
        self, 
        db: Session, 
        *, 
        search: str = None, 
        specialisation: str = None, 
        skip: int = 0, 
        limit: int = 100
    ) -> tuple[list[TPR], int]:
        """
        Fuzzy search and filter TPRs. Returns (items, total_count).
        """
        query = db.query(TPR)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    TPR.tpr_id.ilike(search_pattern),
                    TPR.tpr_name.ilike(search_pattern),
                    TPR.city.ilike(search_pattern),
                    TPR.country.ilike(search_pattern)
                )
            )
            
        if specialisation:
            query = query.filter(TPR.specialisation.ilike(f"%{specialisation}%"))
            
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def get_count(self, db: Session) -> int:
        return db.query(TPR).count()

tpr_repository = TPRRepository()
