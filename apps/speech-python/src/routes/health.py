from fastapi import APIRouter
from ..models import HealthResponse
from ..config import settings
from ..ml_models import is_initialized
import time

router = APIRouter()

_start_time = time.time()


@router.get("/", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok" if is_initialized() else "degraded",
        service=settings.SERVICE_NAME,
        models_loaded=is_initialized(),
        uptime_seconds=time.time() - _start_time
    )


@router.get("/ready")
async def readiness():
    if is_initialized():
        return {"status": "ready"}
    raise 503


@router.get("/live")
async def liveness():
    return {"status": "alive"}
