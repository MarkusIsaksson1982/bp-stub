# Containerized Service

Multi-stage Docker setup for foundation services.

## Quick Start

```bash
cp .env.example .env
make up
# Visit http://localhost:3000
```

## Services

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build |
| `docker-compose.yml` | 3-service stack: web + PostgreSQL + Redis |
| `docker-compose.prod.yml` | Production overrides |
| `healthcheck.js` | Health probe |
| `Makefile` | Commands: `make up`, `make down`, `make logs`
