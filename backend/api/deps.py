from typing import Generator
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.database.connection import SessionLocal
from backend.core.config import settings
from backend.repositories.hub import hub_repository, HubRepository
from backend.repositories.tpr import tpr_repository, TPRRepository
from backend.repositories.part import part_repository, PartRepository
from backend.repositories.transaction import transaction_repository, TransactionRepository

security = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session context.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_hub_repo() -> HubRepository:
    return hub_repository

def get_tpr_repo() -> TPRRepository:
    return tpr_repository

def get_part_repo() -> PartRepository:
    return part_repository

def get_transaction_repo() -> TransactionRepository:
    return transaction_repository

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        email = payload.get("email")
        app_metadata = payload.get("app_metadata", {})
        user_metadata = payload.get("user_metadata", {})
        
        role = app_metadata.get("role", "Viewer")
        name = user_metadata.get("full_name", email)
        
        return {
            "id": user_id,
            "email": email,
            "role": role,
            "name": name,
            "raw_payload": payload
        }
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def check_role(allowed_roles: list[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return role_checker
