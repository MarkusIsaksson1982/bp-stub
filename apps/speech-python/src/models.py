from pydantic import BaseModel, Field
from typing import Literal


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"] = "ok"
    service: str
    version: str = "1.0.0"
    models_loaded: bool = False
    uptime_seconds: float


class TranscriptionRequest(BaseModel):
    audio_url: str | None = None
    language: str | None = None
    task: Literal["transcribe", "translate"] = "transcribe"


class TranscriptionResponse(BaseModel):
    text: str
    language: str | None = None
    duration_seconds: float | None = None
    model: str
    confidence: float | None = None


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(default=5, ge=1, le=20)
    filters: dict | None = None


class QueryResponse(BaseModel):
    answer: str
    query: str
    sources: list[dict]
    model: str
    inference_time_ms: int


class ErrorResponse(BaseModel):
    error: str
    statusCode: int
    details: dict | None = None
