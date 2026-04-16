import time
import structlog
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..models import TranscriptionRequest, TranscriptionResponse
from ..ml_models import get_whisper_model
from ..config import settings
from prometheus_client import Histogram, Counter

logger = structlog.get_logger()

router = APIRouter()

TRANSCRIBE_DURATION = Histogram(
    "transcribe_duration_seconds",
    "Transcription duration",
    buckets=[0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0]
)

TRANSCRIBE_COUNT = Counter(
    "transcribe_total",
    "Total transcriptions",
    ["status", "language"]
)


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str | None = None,
    task: str = "transcribe"
):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(400, "File must be audio")
    
    model = get_whisper_model()
    if model is None:
        raise HTTPException(503, "Whisper model not loaded")
    
    start_time = time.time()
    
    try:
        contents = await file.read()
        audio_path = f"/tmp/{file.filename}"
        with open(audio_path, "wb") as f:
            f.write(contents)
        
        result = model.transcribe(
            audio_path,
            language=language,
            task=task if task == "translate" else "transcribe"
        )
        
        import os
        os.unlink(audio_path)
        
        duration = time.time() - start_time
        TRANSCRIBE_DURATION.observe(duration)
        TRANSCRIBE_COUNT.labels(
            status="success",
            language=result.get("language", "unknown")
        ).inc()
        
        logger.info(
            "Transcription completed",
            duration_ms=int(duration * 1000),
            language=result.get("language"),
            segments=len(result.get("segments", []))
        )
        
        return TranscriptionResponse(
            text=result["text"],
            language=result.get("language"),
            duration_seconds=result.get("duration"),
            model="whisper-base",
            confidence=result.get("probability", 0.95)
        )
        
    except Exception as e:
        TRANSCRIBE_COUNT.labels(status="error", language=language or "unknown").inc()
        logger.error("Transcription failed", error=str(e))
        raise HTTPException(500, f"Transcription failed: {str(e)}")


@router.post("/transcribe-url", response_model=TranscriptionResponse)
async def transcribe_url(request: TranscriptionRequest):
    model = get_whisper_model()
    if model is None:
        raise HTTPException(503, "Whisper model not loaded")
    
    if not request.audio_url:
        raise HTTPException(400, "audio_url required")
    
    start_time = time.time()
    
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(request.audio_url)
            response.raise_for_status()
        
        audio_path = f"/tmp/audio_from_url.{request.audio_url.split('.')[-1]}"
        with open(audio_path, "wb") as f:
            f.write(response.content)
        
        result = model.transcribe(
            audio_path,
            language=request.language,
            task=request.task
        )
        
        import os
        os.unlink(audio_path)
        
        duration = time.time() - start_time
        TRANSCRIBE_DURATION.observe(duration)
        TRANSCRIBE_COUNT.labels(status="success", language=result.get("language", "unknown")).inc()
        
        return TranscriptionResponse(
            text=result["text"],
            language=result.get("language"),
            duration_seconds=result.get("duration"),
            model="whisper-base",
            confidence=result.get("probability", 0.95)
        )
        
    except httpx.HTTPError as e:
        TRANSCRIBE_COUNT.labels(status="error", language=request.language or "unknown").inc()
        raise HTTPException(400, f"Failed to fetch audio: {str(e)}")
    except Exception as e:
        TRANSCRIBE_COUNT.labels(status="error", language=request.language or "unknown").inc()
        logger.error("Transcription failed", error=str(e))
        raise HTTPException(500, f"Transcription failed: {str(e)}")
