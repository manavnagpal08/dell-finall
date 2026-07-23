from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    flow_type = Column(String, nullable=False)  # Forward, Reverse
    part_no = Column(String, ForeignKey("parts.part_no"), nullable=False)
    priority = Column(String, nullable=False)  # P1, P2, P3, P4
    source_location = Column(String, nullable=False)
    origin_hub_id = Column(String, ForeignKey("hubs.hub_id"), nullable=False)
    intermediate_hub_id = Column(String, ForeignKey("hubs.hub_id"), nullable=True)
    tpr_id = Column(String, ForeignKey("tprs.tpr_id"), nullable=True)
    destination_location = Column(String, nullable=False)
    logistics_partner = Column(String, nullable=False)
    
    quantity = Column(Integer, nullable=False)
    unit_cost_usd = Column(Float, nullable=False)
    parts_value_usd = Column(Float, nullable=False)
    logistics_cost_per_unit_usd = Column(Float, nullable=False)
    logistics_cost_total_usd = Column(Float, nullable=False)
    total_cost_usd = Column(Float, nullable=False)
    
    dispatch_date = Column(DateTime, nullable=False)
    hub1_arrival_date = Column(DateTime, nullable=True)
    hub2_arrival_date = Column(DateTime, nullable=True)
    tpr_arrival_date = Column(DateTime, nullable=True)
    expected_delivery_date = Column(DateTime, nullable=False)
    actual_delivery_date = Column(DateTime, nullable=False)
    
    transit_days_actual = Column(Integer, nullable=False)
    transit_days_expected = Column(Integer, nullable=False)
    sla_breach = Column(Boolean, nullable=False, default=False)
    
    stock_at_origin_hub = Column(Integer, nullable=False)
    stock_at_intermediate_hub = Column(Integer, nullable=True)
    stock_at_tpr = Column(Integer, nullable=True)
    
    tamper_flag = Column(String, nullable=False)  # CLEAR, TAMPER_ALERT, RECHECK
    status = Column(String, nullable=False)
    qr_code_id = Column(String, nullable=False)
    notes = Column(String, nullable=True)

    # Relationships
    part = relationship("Part", backref="transactions")
    origin_hub = relationship("Hub", foreign_keys=[origin_hub_id], backref="origin_transactions")
    intermediate_hub = relationship("Hub", foreign_keys=[intermediate_hub_id], backref="intermediate_transactions")
    tpr = relationship("TPR", backref="transactions")
