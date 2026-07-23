from pydantic import BaseModel, Field

class HubBase(BaseModel):
    hub_id: str
    hub_name: str
    city: str
    country: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    hub_type: str
    primary_region: str
    inventory_capacity: int = Field(..., ge=0)
    current_stock_level: int = Field(..., ge=0)
    utilisation_pct: float = Field(..., ge=0, le=1)

class HubCreate(HubBase):
    pass

class HubSchema(HubBase):
    class Config:
        from_attributes = True
        # Pydantic v2 ORM compatibility
