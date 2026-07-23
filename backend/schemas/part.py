from pydantic import BaseModel, Field

class PartBase(BaseModel):
    part_no: str
    part_description: str
    category: str
    unit_cost_usd: float = Field(..., ge=0)
    weight_kg: float = Field(..., ge=0)
    volume_cm3: int = Field(..., ge=0)
    lead_time_days: int = Field(..., ge=0)
    min_stock_level: int = Field(..., ge=0)
    reorder_quantity: int = Field(..., ge=0)
    fragile: bool
    hazardous: bool

class PartCreate(PartBase):
    pass

class PartSchema(PartBase):
    class Config:
        from_attributes = True
        # Pydantic v2 ORM compatibility
