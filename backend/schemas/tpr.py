from pydantic import BaseModel, Field

class TPRBase(BaseModel):
    tpr_id: str
    tpr_name: str
    city: str
    country: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    repair_capacity_per_day: int = Field(..., ge=0)
    current_workload: int = Field(..., ge=0)
    sla_days: int = Field(..., ge=0)
    active_contracts: int = Field(..., ge=0)
    specialisation: str

class TPRCreate(TPRBase):
    pass

class TPRSchema(TPRBase):
    class Config:
        from_attributes = True
