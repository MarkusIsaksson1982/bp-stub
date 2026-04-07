# Full Stack Observatory

**A complete 12-layer production reference architecture — now a Turborepo monorepo.**

One command gives you a fully monitored, secured, containerized full-stack system with real Prometheus + Grafana observability.

**Live interactive explorer** → [markusisaksson1982.github.io](https://markusisaksson1982.github.io/)

## 🚀 One-Command Full Stack Demo

```bash
git clone https://github.com/MarkusIsaksson1982/fullstack-observatory.git
cd fullstack-observatory
cp .env.example .env
npm install
npm run compose
```

After ~30 seconds open:
- http://localhost → API (redirects to health check)
- http://localhost:3001 → Grafana (admin / admin123)
- http://localhost:9090 → Prometheus

## See it running









## What’s included

- **Turborepo monorepo** with shared packages (`@observatory/metrics`)
- Layer 2: Express + Zod API with live Prometheus metrics
- Layer 3: PostgreSQL with health checks
- Layer 4: Nginx reverse proxy + security headers
- Layer 8: Security hardening (Helmet, CSP, rate limiting, Zod)
- Layer 9: Proper multi-stage Dockerfiles
- Layer 11: Full Prometheus + Grafana observability

## Tech Stack

- Node.js 22 LTS + Express + Zod
- PostgreSQL
- Docker + Turborepo
- Prometheus + Grafana
- Nginx + hardened configs

## Links

- [Interactive 12-Layer Explorer](https://markusisaksson1982.github.io/)
- [Architecture](ARCHITECTURE.md)
- [End-to-End Demo](COMPOSE.md)
- [Roadmap](ROADMAP.md)

---

Made with ❤️ as part of **The Full Stack Observatory**
