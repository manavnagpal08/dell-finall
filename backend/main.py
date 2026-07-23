import logging
import time
import uuid
from collections import defaultdict, deque
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.api import api_router
from backend.database.connection import engine
from backend.database.base import Base
# Import models to ensure they are registered on Metadata
from backend import models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 240
MAX_REQUEST_BYTES = 10 * 1024 * 1024
_request_windows = defaultdict(deque)

# Auto-initialize SQLite tables on startup
try:
    logger.info("Initializing database tables if not exist.")
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error(f"Database initialization failed on startup: {str(e)}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=settings.DEBUG
)

@app.middleware("http")
async def add_production_headers(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    started_at = time.perf_counter()
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = _request_windows[client_ip]
    while window and now - window[0] > RATE_LIMIT_WINDOW_SECONDS:
        window.popleft()

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_BYTES:
        response = JSONResponse(
            status_code=413,
            content={
                "detail": "Request payload too large",
                "request_id": request_id,
                "max_bytes": MAX_REQUEST_BYTES,
            },
        )
    elif len(window) >= RATE_LIMIT_MAX_REQUESTS:
        response = JSONResponse(
            status_code=429,
            content={
                "detail": "Rate limit exceeded",
                "request_id": request_id,
                "retry_after_seconds": RATE_LIMIT_WINDOW_SECONDS,
            },
        )
        response.headers["Retry-After"] = str(RATE_LIMIT_WINDOW_SECONDS)
    else:
        window.append(now)
        try:
            response: Response = await call_next(request)
        except Exception:
            logger.exception("Unhandled API error request_id=%s path=%s", request_id, request.url.path)
            response = JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "request_id": request_id,
                    "path": request.url.path,
                },
            )

    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-ms"] = str(duration_ms)
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX_REQUESTS)
    response.headers["X-RateLimit-Remaining"] = str(max(0, RATE_LIMIT_MAX_REQUESTS - len(window)))
    response.headers["X-Max-Request-Bytes"] = str(MAX_REQUEST_BYTES)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cache-Control"] = "no-store"
    return response

# Set CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Sanchar AI Logistics Intelligence API",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
