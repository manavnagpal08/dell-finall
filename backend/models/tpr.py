from sqlalchemy import Column, String, Float, Integer
from backend.database.base import Base

class TPR(Base):
    __tablename__ = "tprs"

    tpr_id = Column(String, primary_key=True, index=True)
    tpr_name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    repair_capacity_per_day = Column(Integer, nullable=False)
    current_workload = Column(Integer, nullable=False)
    sla_days = Column(Integer, nullable=False)
    active_contracts = Column(Integer, nullable=False)
    specialisation = Column(String, nullable=False)
