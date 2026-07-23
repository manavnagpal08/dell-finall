from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from backend.schemas.part import PartSchema
from backend.schemas.hub import HubSchema
from backend.schemas.tpr import TPRSchema

class TransactionBase(BaseModel):
    transaction_id: str
    flow_type: str
    part_no: str
    priority: str
    source_location: str
    origin_hub_id: str
    intermediate_hub_id: Optional[str] = None
    tpr_id: Optional[str] = None
    destination_location: str
    logistics_partner: str
    
    quantity: int = Field(..., gt=0)
    unit_cost_usd: float = Field(..., ge=0)
    parts_value_usd: float = Field(..., ge=0)
    logistics_cost_per_unit_usd: float = Field(..., ge=0)
    logistics_cost_total_usd: float = Field(..., ge=0)
    total_cost_usd: float = Field(..., ge=0)
    
    dispatch_date: datetime
    hub1_arrival_date: Optional[datetime] = None
    hub2_arrival_date: Optional[datetime] = None
    tpr_arrival_date: Optional[datetime] = None
    expected_delivery_date: datetime
    actual_delivery_date: datetime
    
    transit_days_actual: float = Field(..., ge=0)
    transit_days_expected: float = Field(..., ge=0)
    sla_breach: bool
    
    stock_at_origin_hub: int = Field(..., ge=0)
    stock_at_intermediate_hub: Optional[int] = Field(None, ge=0)
    stock_at_tpr: Optional[int] = Field(None, ge=0)
    
    tamper_flag: str
    status: str
    qr_code_id: str
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionSchema(TransactionBase):
    class Config:
        from_attributes = True

class TransactionDetailSchema(TransactionSchema):
    part: Optional[PartSchema] = None
    origin_hub: Optional[HubSchema] = None
    intermediate_hub: Optional[HubSchema] = None
    tpr: Optional[TPRSchema] = None
    
    class Config:
        from_attributes = True
