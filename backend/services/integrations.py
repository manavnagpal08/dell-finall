from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from backend.models.integration import IntegrationAuditLog, IntegrationConnector, IntegrationSyncJob
from backend.schemas.integrations import AuditLog, Connector, SyncJob, Webhook


DEFAULT_CONNECTORS = [
    {
        "id": "sap",
        "name": "SAP ERP",
        "type": "sap",
        "category": "ERP",
        "cadence": "Real-time",
        "endpoint": "sap.enterprise.internal",
        "auth_type": "OAuth 2.0",
        "entities": ["Shipments", "Inventory", "Costs", "Parts"],
    },
    {
        "id": "oracle_erp",
        "name": "Oracle ERP",
        "type": "oracle_erp",
        "category": "ERP",
        "cadence": "15 min",
        "endpoint": "oracle.erp.operations.internal",
        "auth_type": "OAuth 2.0",
        "entities": ["Orders", "Finance", "Parts"],
    },
    {
        "id": "netsuite",
        "name": "NetSuite",
        "type": "netsuite",
        "category": "ERP",
        "cadence": "30 min",
        "endpoint": "https://account.suitetalk.api.netsuite.com",
        "auth_type": "Token auth",
        "entities": ["Orders", "Items", "Vendors"],
    },
    {
        "id": "tms",
        "name": "Transportation Management System",
        "type": "tms",
        "category": "Logistics",
        "cadence": "Real-time",
        "endpoint": "tms.operations.internal",
        "auth_type": "API key",
        "entities": ["Routes", "Carriers", "Milestones"],
    },
    {
        "id": "wms",
        "name": "Warehouse Management System",
        "type": "wms",
        "category": "Logistics",
        "cadence": "15 min",
        "endpoint": "wms.operations.internal",
        "auth_type": "API key",
        "entities": ["Stock", "Bins", "Pick Lists"],
    },
    {
        "id": "ims",
        "name": "Inventory Management System",
        "type": "ims",
        "category": "Logistics",
        "cadence": "15 min",
        "endpoint": "ims.operations.internal",
        "auth_type": "API key",
        "entities": ["Parts", "Demand", "Safety Stock"],
    },
    {
        "id": "excel",
        "name": "Excel Workbook",
        "type": "excel",
        "category": "Files",
        "cadence": "Manual",
        "endpoint": "Logistics_Route_Optimization_Dataset.xlsx",
        "auth_type": "Local upload",
        "entities": ["Transactions", "Hubs", "Parts", "TPRs"],
    },
    {
        "id": "csv",
        "name": "CSV Drop",
        "type": "csv",
        "category": "Files",
        "cadence": "Manual",
        "endpoint": "uploads/route-data/*.csv",
        "auth_type": "Local upload",
        "entities": ["Transactions", "Rates", "SLA"],
    },
    {
        "id": "sftp",
        "name": "SFTP Folder",
        "type": "sftp",
        "category": "Files",
        "cadence": "Hourly",
        "endpoint": "sftp://partners.operations.internal/inbound",
        "auth_type": "SSH key",
        "entities": ["Shipments", "Invoices", "Events"],
    },
    {
        "id": "api",
        "name": "REST API",
        "type": "api",
        "category": "APIs",
        "cadence": "Real-time",
        "endpoint": "https://api.operations.internal/logistics",
        "auth_type": "Bearer token",
        "entities": ["Events", "Alerts", "Shipments"],
    },
    {
        "id": "webhook",
        "name": "Webhook Receiver",
        "type": "webhook",
        "category": "APIs",
        "cadence": "Instant",
        "endpoint": "https://logistics.local/api/v1/integrations/webhooks/events",
        "auth_type": "Signing secret",
        "entities": ["Milestones", "Alerts", "Exceptions"],
    },
    {
        "id": "postgres",
        "name": "PostgreSQL",
        "type": "postgres",
        "category": "Databases",
        "cadence": "15 min",
        "endpoint": "postgresql://readonly@warehouse-replica:5432/ops",
        "auth_type": "Password",
        "entities": ["Shipments", "Parts", "Routes"],
    },
    {
        "id": "sqlserver",
        "name": "SQL Server",
        "type": "sqlserver",
        "category": "Databases",
        "cadence": "15 min",
        "endpoint": "sqlserver://ops-replica.internal/logistics",
        "auth_type": "Password",
        "entities": ["ERP Tables", "Costs", "Inventory"],
    },
    {
        "id": "s3",
        "name": "Object Storage",
        "type": "s3",
        "category": "Cloud",
        "cadence": "Hourly",
        "endpoint": "s3://logistics-production/inbound",
        "auth_type": "Access key",
        "entities": ["Reports", "Exports", "Files"],
    },
]


class IntegrationService:
    def ensure_defaults(self, db: Session) -> None:
        for item in DEFAULT_CONNECTORS:
            existing = db.query(IntegrationConnector).filter(IntegrationConnector.id == item["id"]).first()
            legacy = db.query(IntegrationConnector).filter(IntegrationConnector.type == item["type"]).first()
            if existing or legacy:
                continue
            db.add(IntegrationConnector(
                id=item["id"],
                name=item["name"],
                type=item["type"],
                enabled=item["id"] == "excel",
                status="connected" if item["id"] == "excel" else "available",
                cadence=item["cadence"],
                category=item["category"],
                endpoint=item["endpoint"],
                auth_type=item["auth_type"],
                entities=item["entities"],
                config={"host": item["endpoint"], "source": "database_seed"},
            ))
        db.commit()

    def _to_connector(self, row: IntegrationConnector) -> Connector:
        return Connector(
            id=row.id,
            name=row.name,
            type=row.type,
            enabled=bool(row.enabled),
            status=row.status,
            cadence=row.cadence,
            category=row.category,
            endpoint=row.endpoint,
            auth_type=row.auth_type,
            entities=row.entities or [],
            config=row.config or {},
            last_sync=row.last_sync,
            next_sync=row.next_sync,
        )

    def _to_job(self, row: IntegrationSyncJob) -> SyncJob:
        return SyncJob(
            id=row.id,
            connector_id=row.connector_id,
            connector_name=row.connector_name,
            start_time=row.start_time,
            end_time=row.end_time,
            status=row.status,
            rows_imported=row.rows_imported,
            rows_updated=row.rows_updated,
            rows_failed=row.rows_failed,
            duration_seconds=row.duration_seconds,
            error_message=row.error_message,
        )

    def _to_log(self, row: IntegrationAuditLog) -> AuditLog:
        return AuditLog(
            id=row.id,
            timestamp=row.timestamp,
            event_type=row.event_type,
            message=row.message,
            user=row.user,
            details=row.details or {},
        )

    def get_connectors(self, db: Session) -> List[Connector]:
        self.ensure_defaults(db)
        rows = db.query(IntegrationConnector).order_by(IntegrationConnector.category, IntegrationConnector.name).all()
        return [self._to_connector(row) for row in rows]

    def get_connector(self, db: Session, connector_id: str) -> Optional[Connector]:
        self.ensure_defaults(db)
        row = (
            db.query(IntegrationConnector)
            .filter((IntegrationConnector.id == connector_id) | (IntegrationConnector.type == connector_id))
            .first()
        )
        return self._to_connector(row) if row else None

    def upsert_connector(self, db: Session, connector_id: str, payload: Dict[str, Any]) -> Optional[Connector]:
        self.ensure_defaults(db)
        row = (
            db.query(IntegrationConnector)
            .filter((IntegrationConnector.id == connector_id) | (IntegrationConnector.type == connector_id))
            .first()
        )
        if not row:
            return None
        for key in ["name", "enabled", "status", "cadence", "category", "endpoint", "auth_type", "entities", "config"]:
            if key in payload and payload[key] is not None:
                setattr(row, key, payload[key])
        row.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(row)
        return self._to_connector(row)

    def run_sync(self, db: Session, connector_id: str, rows_available: int = 0) -> Optional[Dict[str, Any]]:
        self.ensure_defaults(db)
        row = (
            db.query(IntegrationConnector)
            .filter((IntegrationConnector.id == connector_id) | (IntegrationConnector.type == connector_id))
            .first()
        )
        if not row:
            return None

        now = datetime.utcnow()
        row.status = "connected" if rows_available > 0 else "needs_data"
        row.enabled = rows_available > 0
        row.last_sync = now
        row.next_sync = now + timedelta(hours=24 if row.cadence == "Manual" else 1)
        row.updated_at = now

        job = IntegrationSyncJob(
            id=f"job_{row.id}_{now.strftime('%Y%m%d%H%M%S')}",
            connector_id=row.id,
            connector_name=row.name,
            start_time=now,
            end_time=now,
            status="completed" if rows_available > 0 else "failed",
            rows_imported=rows_available,
            rows_updated=0,
            rows_failed=0 if rows_available > 0 else 1,
            duration_seconds=1,
            error_message=None if rows_available > 0 else "No workbook-backed records are loaded for this connector.",
        )
        log = IntegrationAuditLog(
            id=f"log_{row.id}_{now.strftime('%Y%m%d%H%M%S')}",
            timestamp=now,
            event_type="import_completed" if rows_available > 0 else "validation_warning",
            message=f"{row.name} sync {'completed' if rows_available > 0 else 'could not load rows'} with {rows_available} records available.",
            user="system",
            details={"connector_id": row.id, "rows_imported": rows_available},
        )
        db.add(job)
        db.add(log)
        db.commit()
        db.refresh(row)
        db.refresh(job)
        return {
            "connector": self._to_connector(row),
            "job": self._to_job(job),
            "message": f"{row.name} sync {'completed' if rows_available > 0 else 'requires data load'} with {rows_available} workbook-backed records.",
        }

    def get_jobs(self, db: Session) -> List[SyncJob]:
        self.ensure_defaults(db)
        rows = db.query(IntegrationSyncJob).order_by(IntegrationSyncJob.start_time.desc()).limit(100).all()
        return [self._to_job(row) for row in rows]

    def get_logs(self, db: Session) -> List[AuditLog]:
        self.ensure_defaults(db)
        rows = db.query(IntegrationAuditLog).order_by(IntegrationAuditLog.timestamp.desc()).limit(100).all()
        return [self._to_log(row) for row in rows]

    def get_webhooks(self) -> List[Webhook]:
        return []


integration_service = IntegrationService()
