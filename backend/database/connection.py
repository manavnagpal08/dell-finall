import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.core.config import settings

# Parse the database URL to get local paths and make directories if SQLite is used
if settings.DATABASE_URL.startswith("sqlite:///"):
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    # Check if there is an absolute path on Windows containing drive letters
    if db_path.startswith("/") and len(db_path) > 3 and db_path[2] == ":":
        db_path = db_path[1:]
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

# Create engine for SQLite
# SQLite requires check_same_thread=False when using multithreading with FastAPI
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_session() -> Session:
    """
    Database session context creator/generator.
    Provides session and closes it after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
