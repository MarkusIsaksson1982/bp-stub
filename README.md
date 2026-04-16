# Speech AI Production Library

Production-ready foundation for voice and speech technology prototypes.

## Quick Start

```bash
docker compose -f docker-compose.foundation.yml up -d --build
```

After ~30 seconds open:

- **http://localhost:8000** -> Speech AI API (Swagger docs at `/docs`)
- **http://localhost:3001** -> Grafana (`admin` / `admin123`)
- **http://localhost:9090** -> Prometheus

## What This Is

A production-ready foundation demonstrating:

- **FastAPI** service with **Whisper** speech-to-text
- **Haystack** RAG pipeline with **Llama 3.2** via Ollama
- **Prometheus** metrics for ML inference tracking
- **Docker** + Kubernetes-ready deployment
- **Self-testing code** with pytest suite

## Project Structure

```
speech-ai-production-library/
├── apps/
│   └── speech-python/       # FastAPI + Haystack + Whisper service
│       ├── src/
│       │   ├── main.py      # FastAPI app with lifespan
│       │   ├── config.py    # Settings via pydantic
│       │   ├── ml_models.py # Model initialization
│       │   └── routes/      # API endpoints
│       └── tests/           # pytest suite
├── docker-compose.foundation.yml
└── prometheus/
    └── prometheus.yml
```

## API Endpoints

### Health

```
GET /health/           # Full health check with model status
GET /health/live       # Kubernetes liveness
GET /health/ready      # Kubernetes readiness
```

### Transcription (Whisper)

```
POST /api/v1/transcribe        # Upload audio file
POST /api/v1/transcribe-url    # Transcribe from URL
```

### RAG Query (Haystack + Llama)

```
POST /api/v1/query         # Full RAG pipeline with LLM
POST /api/v1/query-simple  # BM25 retrieval fallback
```

### Metrics

```
GET /metrics              # Prometheus metrics
```

## How This Matches Job Requirements

| Requirement | Demonstrated By |
|-------------|-----------------|
| **Voice/speech technology** | Whisper STT integration |
| **Meeting assistants, captioning** | Transcription endpoints |
| **Voice biometrics** | Resource model registry pattern |
| **Generative AI, RAG pipelines** | Haystack + Ollama integration |
| **Cloud + on-premises** | Docker Compose (local), containerized for cloud |
| **Design production-ready APIs** | FastAPI with OpenAPI docs, validation |
| **Integrate ML models** | Whisper, sentence-transformers, Ollama |
| **PyTorch, Haystack** | Haystack-ai, onnxruntime |
| **Kubernetes-ready** | Health checks, graceful shutdown, metrics |
| **Observability** | Prometheus metrics, Grafana dashboards |
| **Self-testing code** | pytest suite with async tests |
| **Deploy same day** | One-command `docker compose up` |

## ML Inference Metrics

The service exposes:

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `ml_inference_duration_seconds` | Histogram | model, operation | Inference latency |
| `ml_inference_total` | Counter | model, operation, status | Total inferences |
| `transcribe_duration_seconds` | Histogram | - | Transcription time |
| `transcribe_total` | Counter | status, language | Total transcriptions |
| `query_duration_seconds` | Histogram | - | RAG query time |
| `query_total` | Counter | status | Total queries |

## Example Requests

### Transcribe Audio

```bash
curl -X POST "http://localhost:8000/api/v1/transcribe" \
  -F "file=@recording.mp3" \
  -F "language=en"
```

### Query Meeting Notes

```bash
curl -X POST "http://localhost:8000/api/v1/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "What features were requested?", "top_k": 3}'
```

### Check Health

```bash
curl http://localhost:8000/health/
```

## Development

### Python Service

```bash
cd apps/speech-python
npm install  # For npm scripts
pip install -r requirements.txt
npm run dev
```

### Run Tests

```bash
cd apps/speech-python
npm test
# or
pytest tests/ -v
```

## Models

The service uses:

- **Whisper Base** (OpenAI) - Speech-to-text
- **sentence-transformers/all-MiniLM-L6-v2** - Embeddings
- **Llama 3.2** (Ollama) - LLM for RAG

First startup downloads models (~2GB). Subsequent starts use cached models.

## Observability Stack

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Speech Python│────>│  Prometheus  │────>│   Grafana    │
│   Service    │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
     │                    │
     │ metrics            │ scrape
     └────────────────────┘
```

## License

MIT
