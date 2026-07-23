from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from backend.database.base import Base
import datetime

class CostReport(Base):
    __tablename__ = "cost_reports"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    total_cost = Column(Float, nullable=False)
    potential_savings = Column(Float, nullable=False)
    avg_cost_shipment = Column(Float, nullable=False)
    avg_cost_km = Column(Float, nullable=False)
    most_expensive_corridor = Column(String, nullable=True)
    least_efficient_corridor = Column(String, nullable=True)
    efficiency_score = Column(Float, nullable=False)


class MoneyLeak(Base):
    __tablename__ = "money_leaks"

    id = Column(Integer, primary_key=True, index=True)
    leak_type = Column(String, nullable=False)  # Unnecessary Routing, Idle Inventory, etc.
    money_lost = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    evidence = Column(String, nullable=False)
    suggested_fix = Column(String, nullable=False)
    potential_savings = Column(Float, nullable=False)
    priority = Column(String, nullable=False)  # Critical, High, Medium, Low


class InvestmentRecommendation(Base):
    __tablename__ = "investment_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_type = Column(String, nullable=False)
    expected_investment = Column(Float, nullable=False)
    expected_savings = Column(Float, nullable=False)
    roi_pct = Column(Float, nullable=False)
    payback_months = Column(Float, nullable=False)
    priority = Column(String, nullable=False)


class RepairCenterMetric(Base):
    __tablename__ = "repair_center_metrics"

    id = Column(Integer, primary_key=True, index=True)
    tpr_id = Column(String, nullable=False, index=True)
    tpr_name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_load = Column(Integer, nullable=False)
    avg_repair_time = Column(Float, nullable=False)
    utilization_pct = Column(Float, nullable=False)
    efficiency_score = Column(Float, nullable=False)


class StockoutPrediction(Base):
    __tablename__ = "stockout_predictions"

    id = Column(Integer, primary_key=True, index=True)
    part_no = Column(String, nullable=False, index=True)
    current_stock = Column(Integer, nullable=False)
    avg_daily_usage = Column(Float, nullable=False)
    days_remaining = Column(Float, nullable=False)
    critical_level = Column(String, nullable=False)  # Critical, Warning, Normal
    recommendation = Column(String, nullable=False)


class RedeploymentPlan(Base):
    __tablename__ = "redeployment_plans"

    id = Column(Integer, primary_key=True, index=True)
    part_no = Column(String, nullable=False, index=True)
    excess_location = Column(String, nullable=False)
    low_stock_location = Column(String, nullable=False)
    best_destination = Column(String, nullable=False)
    est_cost = Column(Float, nullable=False)
    transit_days = Column(Float, nullable=False)
    benefit = Column(String, nullable=False)


class ConsolidationReport(Base):
    __tablename__ = "consolidation_reports"

    id = Column(Integer, primary_key=True, index=True)
    shipment_count = Column(Integer, nullable=False)
    consolidated_count = Column(Integer, nullable=False)
    savings_usd = Column(Float, nullable=False)
    transit_impact = Column(String, nullable=False)
