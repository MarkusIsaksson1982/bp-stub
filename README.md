# Full Stack Observatory

**A complete, production-grade 12-layer reference architecture — now a Turborepo monorepo.**

Not just "frontend + backend". This is a fully integrated, self-referencing system with real observability, security hardening, containerization, and one-command end-to-end demo.

**Live interactive exploration** → [markusisaksson1982.github.io](https://markusisaksson1982.github.io/)

## 🚀 One-Command Full Stack Demo

```bash
git clone https://github.com/MarkusIsaksson1982/fullstack-observatory.git
cd fullstack-observatory
cp .env.example .env
npm install
npm run compose
```

After ~30 seconds you will have:
- API + PostgreSQL + Nginx proxy
- Prometheus + Grafana (with live metrics dashboard)
- Everything pre-wired and monitored

Open:
- http://localhost → API (redirects to health)
- http://localhost:3001 → Grafana (admin / admin123)
- http://localhost:9090 → Prometheus

## 📁 What You Get

- **Turborepo monorepo** — one `npm install`, shared packages, consistent tooling
- **Layer 2** → `@observatory/metrics` + Express API
- **Layer 3** → PostgreSQL with health checks
- **Layer 4** → Nginx + hardened configs
- **Layer 8** → Security hardening (Helmet, rate limiting, CSP, Zod validation)
- **Layer 9** → Containerized with proper multi-stage Dockerfiles
- **Layer 11** → Full Prometheus + Grafana observability
- **Cross-layer integration** — metrics, healthchecks, logging, and configs are shared

## Tech Stack (unified)

- Node.js 22 LTS + Express + Zod
- PostgreSQL
- Docker + Turborepo
- Prometheus + Grafana
- Nginx + PM2-ready configs
- Security-first (OWASP-aligned)

## Links

- [Interactive 12-Layer Explorer](https://markusisaksson1982.github.io/)
- [Architecture Diagram](ARCHITECTURE.md)
- [End-to-End Demo Guide](COMPOSE.md)
- [Roadmap](ROADMAP.md)

---

Made with ❤️ as part of **The Full Stack Observatory**
