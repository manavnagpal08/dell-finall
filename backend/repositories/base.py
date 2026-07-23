from typing import Generic, TypeVar, Type, Any, Optional
from sqlalchemy.orm import Session
from backend.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        """
        Base repository constructor.
        :param model: The SQLAlchemy model class.
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Retrieve a single model by primary key.
        """
        return db.query(self.model).filter(self.model.hub_id == id if hasattr(self.model, 'hub_id') else 
                        self.model.tpr_id == id if hasattr(self.model, 'tpr_id') else
                        self.model.part_no == id if hasattr(self.model, 'part_no') else
                        self.model.transaction_id == id).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> list[ModelType]:
        """
        Retrieve multiple records with pagination.
        """
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: Any) -> ModelType:
        """
        Create a new database record.
        """
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def create_multi(self, db: Session, *, objs_in: list[ModelType]) -> list[ModelType]:
        """
        Create multiple records efficiently.
        """
        db.add_all(objs_in)
        db.commit()
        return objs_in

    def remove(self, db: Session, *, id: Any) -> Optional[ModelType]:
        """
        Delete a record by primary key.
        """
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
