from pydantic import BaseModel
from typing import Optional, Any

class ValidationIssue(BaseModel):
    sheet: str
    row_index: int
    column: str
    issue: str
    severity: str  # ERROR, WARNING

class IngestionReportSchema(BaseModel):
    status: str  # PASS, FAIL
    sheets_checked: list[str]
    rows_processed: dict[str, int]
    issues: list[ValidationIssue]
    database_populated: bool
    message: str

class DatasetLoadRequest(BaseModel):
    file_path: Optional[str] = None

class DashboardStatisticsSchema(BaseModel):
    total_transactions: int
    forward_transactions: int
    reverse_transactions: int
    total_hubs: int
    total_tprs: int
    total_parts: int
    total_cost: float
    average_cost: float
    average_transit_time: float
    sla_breach_percentage: float
    tamper_alert_percentage: float
    
    # Distribution data for charts
    cost_distribution: list[dict[str, Any]]       # [{"name": "Compute", "value": 123.4}, ...]
    flow_distribution: list[dict[str, Any]]       # [{"name": "Forward", "value": 1089}, ...]
    country_distribution: list[dict[str, Any]]    # [{"name": "India", "value": 456}, ...]
    top_categories_by_cost: list[dict[str, Any]]  # [{"name": "Compute", "value": 5000000.0}, ...]
