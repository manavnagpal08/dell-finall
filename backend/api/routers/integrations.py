from fastapi import APIRouter, HTTPException
from typing import List
from backend.schemas.integrations import Connector, SyncJob, AuditLog, Webhook
from backend.services.integrations import integration_service

router = APIRouter(
    prefix="/integrations",
    tags=["Integrations"]
)

@router.get("/connectors", response_model=List[Connector])
def get_connectors():
    return integration_service.get_connectors()

@router.get("/connectors/{connector_id}", response_model=Connector)
def get_connector(connector_id: str):
    connector = integration_service.get_connector(connector_id)
    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")
    return connector

@router.get("/jobs", response_model=List[SyncJob])
def get_jobs():
    return integration_service.get_jobs()

@router.get("/logs", response_model=List[AuditLog])
def get_logs():
    return integration_service.get_logs()

@router.get("/webhooks", response_model=List[Webhook])
def get_webhooks():
    return integration_service.get_webhooks()
