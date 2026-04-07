# Full Stack Observatory

**A complete 12-layer production reference architecture — built as a Turborepo monorepo.**

One command gives you a fully monitored, secured, containerized full-stack system with real Prometheus + Grafana observability and alerting.

**Live interactive explorer** → [markusisaksson1982.github.io](https://markusisaksson1982.github.io/)

## 🚀 One-Command Demo

```bash
git clone https://github.com/MarkusIsaksson1982/fullstack-observatory.git
cd fullstack-observatory
cp .env.example .env
npm install
npm run compose
```

After ~30 seconds open:
- **http://localhost** → API (redirects to health)
- **http://localhost:3001** → Grafana (admin / admin123)
- **http://localhost:9090** → Prometheus + alerts

## What You Get

- Turborepo monorepo with shared packages (`@observatory/*`)
- Layer 2: Express + Zod API with live metrics
- Layer 3: PostgreSQL + exporter
- Layer 4: Nginx + hardened configs
- Layer 8: Security hardening (Helmet, CSP, rate limiting, Zod)
- Layer 9: Multi-stage Dockerfiles
- Layer 11: Prometheus + Grafana + Alertmanager

## Screenshots

![Terminal](screenshots/01-terminal-compose.png)
![Grafana](screenshots/02-grafana-dashboard.png)
![Prometheus](screenshots/03-prometheus-targets.png)

## Links

- [Interactive 12-Layer Explorer](https://markusisaksson1982.github.io/)
- [Architecture](ARCHITECTURE.md)
- [End-to-End Demo](COMPOSE.md)

---

Made with ❤️ as part of **The Full Stack Observatory**
