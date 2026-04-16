# Foundation

Production-ready foundation for voice and speech technology prototypes.

## Quick Start

```bash
git clone https://github.com/example/foundation.git
cd foundation
cp .env.example .env
npm install
npm run compose
```

After ~30 seconds open:

- **http://localhost** -> API
- **http://localhost:3001** -> Grafana (`admin` / `admin123`)
- **http://localhost:9090** -> Prometheus

## What You Get

- Turborepo workspace with shared packages (`@foundation/*`)
- Express.js API with Prometheus metrics
- PostgreSQL with inference logging
- Prometheus + Grafana + Alertmanager
- Multi-stage Docker builds
- ML inference metrics support

## Project Structure

```
foundation/
├── apps/
│   ├── api/           # Express API server
│   └── db/            # PostgreSQL schema
├── packages/
│   ├── core/          # Error classes, utilities
│   ├── logger/        # Pino logger
│   ├── metrics/       # Prometheus metrics
│   └── healthcheck/   # Health endpoints
├── docker-compose.foundation.yml
└── prometheus/
    └── prometheus.yml
```

## Use Cases

This foundation is designed for building prototypes quickly:

- Meeting assistants and transcription services
- Voice biometrics and speaker verification
- Real-time captioning and speech-to-text
- Text-to-speech and voice synthesis
- RAG pipelines for voice-enabled products

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | Express.js, Zod validation |
| Database | PostgreSQL 16 |
| Metrics | Prometheus, Grafana |
| Container | Docker, multi-stage builds |
| Monitoring | prom-client, alerting |

## Development

```bash
# Start all services
npm run compose

# Run API locally
cd apps/api-server && npm run dev

# Run migrations
npm run db:migrate

# Run tests
npm test
```

## Adding ML Inference

The foundation includes metrics for ML inference tracking:

```javascript
const { mlInferenceDurationSeconds, mlInferenceTotal } = require('@foundation/metrics');

async function runInference(input) {
  const start = Date.now();
  try {
    const result = await model.predict(input);
    mlInferenceTotal.inc({ model: 'whisper', operation: 'transcribe', status: 'success' });
    mlInferenceDurationSeconds.observe({ model: 'whisper', operation: 'transcribe' }, (Date.now() - start) / 1000);
    return result;
  } catch (error) {
    mlInferenceTotal.inc({ model: 'whisper', operation: 'transcribe', status: 'error' });
    throw error;
  }
}
```
