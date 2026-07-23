from fastapi import APIRouter
from backend.api.endpoints.health import router as health_router
from backend.api.endpoints.dataset import router as dataset_router
from backend.api.endpoints.hubs import router as hubs_router
from backend.api.endpoints.tprs import router as tprs_router
from backend.api.endpoints.parts import router as parts_router
from backend.api.endpoints.transactions import router as transactions_router
from backend.api.endpoints.network import router as network_router
from backend.api.endpoints.route_intelligence import router as route_intel_router
from backend.optimization.routers.optimization import router as optimization_router
from backend.api.endpoints.logistics import router as logistics_router
from backend.api.endpoints.analytics import router as analytics_router
from backend.api.endpoints.recommendations import router as recommendations_router
from backend.api.endpoints.cost_reverse import router as cost_reverse_router
from backend.api.endpoints.executive import router as executive_router
from backend.api.endpoints.twin import router as twin_router
from backend.api.endpoints.war_room import router as war_room_router
from backend.api.endpoints.challenge import router as challenge_router
from backend.api.endpoints.nl_analytics import router as nl_analytics_router
from backend.api.endpoints.settings import router as settings_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(dataset_router, prefix="/dataset", tags=["dataset"])
api_router.include_router(hubs_router, prefix="/hubs", tags=["hubs"])
api_router.include_router(tprs_router, prefix="/tprs", tags=["tprs"])
api_router.include_router(parts_router, prefix="/parts", tags=["parts"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
api_router.include_router(network_router, prefix="/network", tags=["network"])
api_router.include_router(route_intel_router, prefix="/route-intelligence", tags=["route-intelligence"])
api_router.include_router(optimization_router, prefix="/optimization", tags=["optimization"])
api_router.include_router(logistics_router, tags=["logistics"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(cost_reverse_router, tags=["cost_reverse"])
api_router.include_router(executive_router, tags=["executive_risk"])
api_router.include_router(twin_router)
api_router.include_router(war_room_router)
api_router.include_router(challenge_router, prefix="/challenge", tags=["challenge"])
api_router.include_router(nl_analytics_router, prefix="/analytics-query", tags=["analytics-query"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])






from backend.api.routers.predictions import router as predictions_router
api_router.include_router(predictions_router)
from backend.api.routers.copilot import router as copilot_router
api_router.include_router(copilot_router)
from backend.api.routers.integrations import router as integrations_router
api_router.include_router(integrations_router)
