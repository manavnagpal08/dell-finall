from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ConnectorBase(BaseModel):
    name: str
    type: str # 'postgres', 'sap', 'csv', etc.
    enabled: bool
    status: str # 'connected', 'disconnected', 'error'
    config: Optional[Dict[str, Any]] = {}

class ConnectorCreate(ConnectorBase):
    pass

class Connector(ConnectorBase):
    id: str
    last_sync: Optional[datetime] = None
    next_sync: Optional[datetime] = None

class SyncJob(BaseModel):
    id: str
    connector_id: str
    connector_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str # 'running', 'completed', 'failed'
    rows_imported: int = 0
    rows_updated: int = 0
    rows_failed: int = 0
    duration_seconds: Optional[int] = None
    error_message: Optional[str] = None

class AuditLog(BaseModel):
    id: str
    timestamp: datetime
    event_type: str # 'import_started', 'import_completed', 'validation_warning', 'error'
    message: str
    user: str
    details: Optional[Dict[str, Any]] = None

class Webhook(BaseModel):
    id: str
    name: str
    url: str
    events: List[str] # 'new_shipment', 'delivered', etc.
    active: bool
    secret: Optional[str] = None

class FieldMapping(BaseModel):
    source_field: str
    target_field: str
