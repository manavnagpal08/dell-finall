import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sanchar AI Logistics Intelligence API"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./backend/database/logistics.db"
    )

    # Excel Ingestion
    DEFAULT_DATASET_PATH: str = Field(
        default="./Logistics_Route_Optimization_Dataset.xlsx"
    )


    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]


    # App Settings
    DEBUG: bool = True

    # Supabase Settings
    SUPABASE_URL: str = Field(default="")
    SUPABASE_ANON_KEY: str = Field(default="")
    SUPABASE_JWT_SECRET: str = Field(default="super-secret-supabase-jwt-key-change-in-prod-12345")

    # External LLM settings
    GEMINI_API_KEY: str = Field(default="")

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
