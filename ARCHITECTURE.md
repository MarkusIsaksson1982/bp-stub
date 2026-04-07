# Architecture Overview

**The Full Stack Observatory – 12 Layer Reference Architecture**

```mermaid
flowchart TD
    subgraph "Client / Browser"
        UI[Layer 1: Frontend UI + Interactive Demos]
    end

    UI --> API[Layer 2: Backend APIs<br/>fullstack-api-server]
    API --> DB[Layer 3: Database<br/>fullstack-database]
    API --> SRV[Layer 4: Servers<br/>fullstack-server-configs]
    API --> SEC[Layer 8: Security Hardening<br/>fullstack-security-hardened]

    subgraph "Runtime & Deployment"
        CNT[Layer 9: Containers<br/>fullstack-containerized]
        INF[Layer 6: Cloud Infrastructure<br/>fullstack-infrastructure]
        CI[Layer 7: CI/CD<br/>fullstack-ci-templates]
    end

    API --> CNT
    CNT --> INF
    CNT --> CI

    subgraph "Observability"
        MON[Layer 11: Monitoring, Logging & Alerting<br/>fullstack-monitoring]
    end

    API --> MON
    DB --> MON
    CNT --> MON
    INF --> MON

    style UI fill:#e3f2fd
    style MON fill:#f3e5f5
```

## Request / Data Flow (simplified)

1. Browser → **Layer 2 API** (Express)
2. API → **Layer 3 Database** (PostgreSQL)
3. All services expose health/metrics to **Layer 11 Monitoring**
4. Containers (**Layer 9**) run on **Layer 6 Infrastructure** (Terraform)
5. Everything is secured by **Layer 8** and configured via **Layer 4**
6. CI/CD (**Layer 7**) builds, tests, and deploys the whole stack

**See the live interactive version** → [markusisaksson1982.github.io](https://markusisaksson1982.github.io/)

## Cross-Layer Integration Points

- `fullstack-monitoring` modules are imported directly into `fullstack-api-server`
- `fullstack-containerized` Dockerfiles reference configs from `fullstack-server-configs`
- Terraform modules in `fullstack-infrastructure` can deploy the containerized stack + monitoring
- All repos share consistent logging, health checks, and environment variable patterns

