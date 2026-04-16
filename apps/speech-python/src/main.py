import os
import time
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from prometheus_client import make_asgi_app, Counter, Histogram, Gauge

from .routes import health, transcribe, query, metrics
from .config import settings
from .models import initialize_models

logger = structlog.get_logger()

REQUEST_COUNT = Counter(
    "speech_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "speech_http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

INFERENCE_DURATION = Histogram(
    "ml_inference_duration_seconds",
    "ML model inference duration",
    ["model", "operation"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0]
)

INFERENCE_COUNT = Counter(
    "ml_inference_total",
    "Total ML inferences",
    ["model", "operation", "status"]
)

MODEL_LOAD_STATUS = Gauge(
    "ml_model_loaded",
    "Whether ML model is loaded (1=yes, 0=no)",
    ["model"]
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting speech-python service", service=settings.SERVICE_NAME)
    
    try:
        await initialize_models()
        MODEL_LOAD_STATUS.labels(model="whisper").set(1)
        MODEL_LOAD_STATUS.labels(model="embeddings").set(1)
        logger.info("Models initialized successfully")
    except Exception as e:
        logger.warning("Model initialization failed, using fallback", error=str(e))
        MODEL_LOAD_STATUS.labels(model="whisper").set(0)
        MODEL_LOAD_STATUS.labels(model="embeddings").set(0)
    
    yield
    
    logger.info("Shutting down speech-python service")
    MODEL_LOAD_STATUS.labels(model="whisper").set(0)
    MODEL_LOAD_STATUS.labels(model="embeddings").set(0)


app = FastAPI(
    title="Speech AI Service",
    description="FastAPI + Haystack + Whisper for voice and speech technology",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(transcribe.router, prefix="/api/v1", tags=["Transcription"])
app.include_router(query.router, prefix="/api/v1", tags=["RAG Query"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])


@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    endpoint = request.url.path
    method = request.method
    status = response.status_code
    
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
    
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "statusCode": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "statusCode": 500}
    )
