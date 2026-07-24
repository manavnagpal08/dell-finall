from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.api.deps import get_db
from backend.models.transaction import Transaction
from backend.schemas.integrations import Connector, ConnectorUpdate, SyncJob, AuditLog, Webhook, SyncResult
from backend.services.integrations import integration_service

router = APIRouter(
    prefix="/integrations",
    tags=["Integrations"]
)

@router.get("/connectors", response_model=List[Connector])
def get_connectors(db: Session = Depends(get_db)):
    return integration_service.get_connectors(db)

@router.get("/connectors/{connector_id}", response_model=Connector)
def get_connector(connector_id: str, db: Session = Depends(get_db)):
    connector = integration_service.get_connector(db, connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    return connector

@router.put("/connectors/{connector_id}", response_model=Connector)
def update_connector(connector_id: str, payload: ConnectorUpdate, db: Session = Depends(get_db)):
    connector = integration_service.upsert_connector(db, connector_id, payload.model_dump(exclude_unset=True))
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    return connector

@router.post("/connectors/{connector_id}/sync", response_model=SyncResult)
def sync_connector(connector_id: str, db: Session = Depends(get_db)):
    rows_available = db.query(Transaction).count()
    result = integration_service.run_sync(db, connector_id, rows_available=rows_available)
    if not result:
        raise HTTPException(status_code=404, detail="Connector not found")
    return result

@router.get("/jobs", response_model=List[SyncJob])
def get_jobs(db: Session = Depends(get_db)):
    return integration_service.get_jobs(db)

@router.get("/logs", response_model=List[AuditLog])
def get_logs(db: Session = Depends(get_db)):
    return integration_service.get_logs(db)

@router.get("/webhooks", response_model=List[Webhook])
def get_webhooks():
    return integration_service.get_webhooks()
