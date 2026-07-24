import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String

from backend.database.base import Base


class IntegrationConnector(Base):
    __tablename__ = "integration_connectors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False, index=True)
    enabled = Column(Boolean, default=False)
    status = Column(String, default="available")
    cadence = Column(String, default="Manual")
    category = Column(String, default="Files")
    endpoint = Column(String, nullable=True)
    auth_type = Column(String, nullable=True)
    entities = Column(JSON, nullable=True)
    config = Column(JSON, nullable=True)
    last_sync = Column(DateTime, nullable=True)
    next_sync = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class IntegrationSyncJob(Base):
    __tablename__ = "integration_sync_jobs"

    id = Column(String, primary_key=True, index=True)
    connector_id = Column(String, nullable=False, index=True)
    connector_name = Column(String, nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, nullable=False)
    rows_imported = Column(Integer, default=0)
    rows_updated = Column(Integer, default=0)
    rows_failed = Column(Integer, default=0)
    duration_seconds = Column(Integer, nullable=True)
    error_message = Column(String, nullable=True)


class IntegrationAuditLog(Base):
    __tablename__ = "integration_audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    event_type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    user = Column(String, default="system")
    details = Column(JSON, nullable=True)
