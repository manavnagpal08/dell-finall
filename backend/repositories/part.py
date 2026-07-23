from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.repositories.base import BaseRepository
from backend.models.part import Part

class PartRepository(BaseRepository[Part]):
    def __init__(self):
        super().__init__(Part)

    def search_parts(
        self, 
        db: Session, 
        *, 
        search: str = None, 
        category: str = None, 
        skip: int = 0, 
        limit: int = 100
    ) -> tuple[list[Part], int]:
        """
        Fuzzy search and filter Parts catalog. Returns (items, total_count).
        """
        query = db.query(Part)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Part.part_no.ilike(search_pattern),
                    Part.part_description.ilike(search_pattern),
                    Part.category.ilike(search_pattern)
                )
            )
            
        if category:
            query = query.filter(Part.category == category)
            
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def get_count(self, db: Session) -> int:
        return db.query(Part).count()

part_repository = PartRepository()
