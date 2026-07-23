from sqlalchemy import Column, String, Float, Integer
from backend.database.base import Base

class Hub(Base):
    __tablename__ = "hubs"

    hub_id = Column(String, primary_key=True, index=True)
    hub_name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hub_type = Column(String, nullable=False)  # Primary, Regional, Satellite, International
    primary_region = Column(String, nullable=False)
    inventory_capacity = Column(Integer, nullable=False)
    current_stock_level = Column(Integer, nullable=False)
    utilisation_pct = Column(Float, nullable=False)
