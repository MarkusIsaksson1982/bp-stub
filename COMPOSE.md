# COMPOSE.md – End-to-End Full Stack Demo

One-command orchestration of the entire Full Stack Observatory.

## Prerequisites
- Docker Desktop (or Docker Engine + Compose v2)
- Git
- ~8 GB RAM recommended (Prometheus + Grafana + Postgres + Node)

## Recommended workspace layout
```bash
mkdir fullstack-observatory-workspace
cd fullstack-observatory-workspace

git clone https://github.com/MarkusIsaksson1982/fullstack-observatory.git
git clone https://github.com/MarkusIsaksson1982/fullstack-api-server.git
git clone https://github.com/MarkusIsaksson1982/fullstack-database.git
git clone https://github.com/MarkusIsaksson1982/fullstack-containerized.git
git clone https://github.com/MarkusIsaksson1982/fullstack-monitoring.git
git clone https://github.com/MarkusIsaksson1982/fullstack-server-configs.git
# (add the rest as you need them)
```

## Quick Start (one command)

```bash
cd fullstack-observatory
cp .env.example .env
docker compose -f docker-compose.fullstack.yml up -d --build
```

After startup (30–60 seconds):
- **API** → http://localhost:3000 (try `/api/health`)
- **Grafana** → http://localhost:3001 (admin / admin123)
- **Prometheus** → http://localhost:9090
- **Nginx proxy** → http://localhost (optional, forwards to API)

## Available commands

```bash
docker compose -f docker-compose.fullstack.yml up -d --build    # start / rebuild
docker compose -f docker-compose.fullstack.yml logs -f api      # tail API logs
docker compose -f docker-compose.fullstack.yml down             # stop everything
docker compose -f docker-compose.fullstack.yml ps               # status
```

## Services included

| Service      | Port   | Source repo                  | Purpose                              |
|--------------|--------|------------------------------|--------------------------------------|
| postgres     | 5432   | fullstack-database           | PostgreSQL + migrations              |
| api          | 3000   | fullstack-api-server         | Node.js Express backend              |
| nginx        | 80     | fullstack-server-configs     | Reverse proxy + security headers     |
| prometheus   | 9090   | fullstack-monitoring         | Metrics scraping                     |
| grafana      | 3001   | fullstack-monitoring         | Dashboards & visualization           |

**Monitoring is pre-wired** — the API automatically exposes `/metrics` and health checks that Prometheus scrapes.

See `docker-compose.fullstack.yml` for the exact configuration.
