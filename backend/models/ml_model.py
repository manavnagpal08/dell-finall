from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.database.base import Base

class MLModelRegistry(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String, nullable=False, index=True)
    model_version = Column(String, nullable=False)
    target_variable = Column(String, nullable=False) # e.g. "sla_breach", "transit_time"
    model_type = Column(String, nullable=False) # e.g. "RandomForestClassifier"
    
    # Metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    roc_auc = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_score = Column(Float, nullable=True)
    
    training_time_sec = Column(Float, nullable=True)
    status = Column(String, default="Active") # Active, Deprecated, Failed
    
    file_path = Column(String, nullable=False) # Path to .joblib file
    
    created_at = Column(DateTime, default=datetime.utcnow)
