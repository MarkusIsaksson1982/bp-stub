from .health import router as health_router
from .transcribe import router as transcribe_router
from .query import router as query_router
from .metrics import router as metrics_router

__all__ = ["health_router", "transcribe_router", "query_router", "metrics_router"]
