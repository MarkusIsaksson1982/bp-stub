# Architecture Overview

```mermaid
flowchart TD
    subgraph "API Layer"
        API[foundation-api]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
    end

    subgraph "Observability"
        PROM[Prometheus]
        GRAF[Grafana]
        ALERT[Alertmanager]
    end

    API --> DB
    API --> PROM
    DB --> PROM
    PROM --> GRAF
    PROM --> ALERT

    style API fill:#e3f2fd
    style DB fill:#fff3e0
    style PROM fill:#f3e5f5
```

## Components

| Component | Purpose |
|-----------|---------|
| `@foundation/api` | Express.js REST API with metrics |
| `@foundation/db` | PostgreSQL schema for ML resources |
| `@foundation/metrics` | Prometheus metrics (HTTP + ML) |
| `@foundation/logger` | Structured Pino logging |
| `@foundation/core` | Error classes and utilities |

## Resource Types

| Type | Description |
|------|-------------|
| `speech_to_text` | STT/ASR models |
| `text_to_speech` | TTS synthesis |
| `voice_biometrics` | Speaker verification |
| `llm` | Language models |
| `rag` | Retrieval-augmented generation |

## Inference Flow

1. Request → API with API key
2. API → Validate with Zod
3. API → Log inference start
4. API → Run ML model
5. API → Log inference end (duration, status)
6. Response → Client
7. Prometheus scrapes metrics
