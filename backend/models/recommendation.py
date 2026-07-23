from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.database.base import Base
import datetime

class RecommendationRequest(Base):
    __tablename__ = "recommendation_requests"

    id = Column(Integer, primary_key=True, index=True)
    origin_hub_id = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    part_no = Column(String, nullable=False)
    part_category = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    priority = Column(String, nullable=False)
    shipment_type = Column(String, nullable=False)  # Forward, Reverse
    required_delivery_date = Column(DateTime, nullable=True)
    preferred_partner = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    results = relationship("RecommendationResult", back_populates="request", cascade="all, delete-orphan")
    approvals = relationship("ApprovedRoute", back_populates="request", cascade="all, delete-orphan")


class RecommendationResult(Base):
    __tablename__ = "recommendation_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("recommendation_requests.id"), nullable=False)
    rank = Column(Integer, nullable=False)
    recommendation_score = Column(Float, nullable=False)
    origin = Column(String, nullable=False)
    intermediate_hubs = Column(String, nullable=True)  # Comma-separated hub IDs
    destination = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    est_transit_days = Column(Float, nullable=False)
    est_cost_usd = Column(Float, nullable=False)
    inventory_status = Column(String, nullable=False)  # In Stock, Low Stock, Out of Stock
    hub_utilization_pct = Column(Float, nullable=False)
    historical_sla_pct = Column(Float, nullable=False)
    reasoning_json = Column(JSON, nullable=True)  # Problem, root_cause, context, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    request = relationship("RecommendationRequest", back_populates="results")
    approvals = relationship("ApprovedRoute", back_populates="result")


class ApprovedRoute(Base):
    __tablename__ = "approved_routes"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("recommendation_requests.id"), nullable=False)
    result_id = Column(Integer, ForeignKey("recommendation_results.id"), nullable=True)
    status = Column(String, nullable=False)  # Approved, Rejected, Escalated, AlternativeRequested
    user = Column(String, default="logistics_manager")
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    request = relationship("RecommendationRequest", back_populates="approvals")
    result = relationship("RecommendationResult", back_populates="approvals")


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user = Column(String, default="logistics_manager")
    request_id = Column(Integer, ForeignKey("recommendation_requests.id"), nullable=False)
    approved_route_id = Column(Integer, ForeignKey("approved_routes.id"), nullable=True)
    decision = Column(String, nullable=False)  # e.g., Approved Route #1, Rejected, etc.
    reason = Column(String, nullable=True)


class RecommendationAuditLog(Base):
    __tablename__ = "recommendation_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user = Column(String, default="logistics_manager")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    inputs_json = Column(JSON, nullable=False)
    recommendation_json = Column(JSON, nullable=False)
    approval_status = Column(String, nullable=False)
