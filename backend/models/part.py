from sqlalchemy import Column, String, Float, Integer, Boolean
from backend.database.base import Base

class Part(Base):
    __tablename__ = "parts"

    part_no = Column(String, primary_key=True, index=True)
    part_description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    unit_cost_usd = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    volume_cm3 = Column(Integer, nullable=False)
    lead_time_days = Column(Integer, nullable=False)
    min_stock_level = Column(Integer, nullable=False)
    reorder_quantity = Column(Integer, nullable=False)
    fragile = Column(Boolean, nullable=False, default=False)
    hazardous = Column(Boolean, nullable=False, default=False)
