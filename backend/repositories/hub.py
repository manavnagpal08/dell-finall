from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.repositories.base import BaseRepository
from backend.models.hub import Hub

class HubRepository(BaseRepository[Hub]):
    def __init__(self):
        super().__init__(Hub)

    def search_hubs(
        self, 
        db: Session, 
        *, 
        search: str = None, 
        hub_type: str = None, 
        skip: int = 0, 
        limit: int = 100
    ) -> tuple[list[Hub], int]:
        """
        Fuzzy search and filter Hubs. Returns (items, total_count).
        """
        query = db.query(Hub)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Hub.hub_id.ilike(search_pattern),
                    Hub.hub_name.ilike(search_pattern),
                    Hub.city.ilike(search_pattern),
                    Hub.country.ilike(search_pattern)
                )
            )
            
        if hub_type:
            query = query.filter(Hub.hub_type == hub_type)
            
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def get_count(self, db: Session) -> int:
        return db.query(Hub).count()

hub_repository = HubRepository()
