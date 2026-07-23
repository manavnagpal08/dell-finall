import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from backend.schemas.integrations import Connector, SyncJob, AuditLog, Webhook

class IntegrationService:
    def __init__(self):
        self.connectors = [
            Connector(
                id="conn_1",
                name="SAP ERP (Global)",
                type="sap",
                enabled=True,
                status="connected",
                last_sync=datetime.now() - timedelta(hours=2),
                next_sync=datetime.now() + timedelta(hours=22),
                config={"host": "sap.enterprise.internal"}
            ),
            Connector(
                id="conn_2",
                name="Oracle WMS (Austin)",
                type="oracle_db",
                enabled=True,
                status="connected",
                last_sync=datetime.now() - timedelta(minutes=15),
                next_sync=datetime.now() + timedelta(minutes=45),
                config={"host": "wms-aus.oracle.cloud"}
            ),
            Connector(
                id="conn_3",
                name="Legacy CSV Drops",
                type="csv",
                enabled=False,
                status="disconnected",
                last_sync=None,
                next_sync=None
            ),
        ]
        
        self.jobs = [
            SyncJob(
                id="job_1",
                connector_id="conn_2",
                connector_name="Oracle WMS (Austin)",
                start_time=datetime.now() - timedelta(minutes=15),
                end_time=datetime.now() - timedelta(minutes=14),
                status="completed",
                rows_imported=1250,
                rows_updated=45,
                rows_failed=0,
                duration_seconds=60
            ),
            SyncJob(
                id="job_2",
                connector_id="conn_1",
                connector_name="SAP ERP (Global)",
                start_time=datetime.now() - timedelta(hours=2),
                end_time=datetime.now() - timedelta(hours=1, minutes=58),
                status="completed",
                rows_imported=8420,
                rows_updated=1120,
                rows_failed=12,
                duration_seconds=120
            ),
            SyncJob(
                id="job_3",
                connector_id="conn_1",
                connector_name="SAP ERP (Global)",
                start_time=datetime.now() - timedelta(hours=26),
                end_time=datetime.now() - timedelta(hours=25, minutes=55),
                status="failed",
                rows_imported=400,
                rows_updated=0,
                rows_failed=400,
                duration_seconds=300,
                error_message="Connection timeout during batch processing."
            )
        ]
        
        self.logs = [
            AuditLog(
                id="log_1",
                timestamp=datetime.now() - timedelta(minutes=15),
                event_type="import_started",
                message="Started sync for Oracle WMS (Austin)",
                user="system",
                details={"connector_id": "conn_2"}
            ),
            AuditLog(
                id="log_2",
                timestamp=datetime.now() - timedelta(minutes=14),
                event_type="import_completed",
                message="Completed sync for Oracle WMS (Austin). 1250 rows imported.",
                user="system",
                details={"connector_id": "conn_2", "job_id": "job_1"}
            ),
            AuditLog(
                id="log_3",
                timestamp=datetime.now() - timedelta(hours=2),
                event_type="validation_warning",
                message="12 rows failed validation during SAP ERP sync.",
                user="system",
                details={"connector_id": "conn_1", "missing_fields": ["priority"]}
            )
        ]
        
        self.webhooks = [
            Webhook(
                id="wh_1",
                name="External TMS Update",
                url="https://api.tms-provider.com/v1/shipments/update",
                events=["shipment_updated", "shipment_delivered"],
                active=True
            ),
            Webhook(
                id="wh_2",
                name="Inventory Alerts",
                url="https://alerts.enterprise.com/webhook",
                events=["inventory_changed"],
                active=False
            )
        ]

    def get_connectors(self) -> List[Connector]:
        return self.connectors

    def get_connector(self, connector_id: str) -> Connector:
        for c in self.connectors:
            if c.id == connector_id:
                return c
        return None

    def get_jobs(self) -> List[SyncJob]:
        return self.jobs
        
    def get_logs(self) -> List[AuditLog]:
        return self.logs

    def get_webhooks(self) -> List[Webhook]:
        return self.webhooks

integration_service = IntegrationService()
