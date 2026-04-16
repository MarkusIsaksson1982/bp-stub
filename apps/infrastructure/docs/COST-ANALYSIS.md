# Cost Analysis

| Scale       | Monthly Cost Range | Primary Cost Drivers | Notes |
|-------------|--------------------|----------------------|-------|
| **Hobby**   | $0-20              | Cloudflare Workers (free tier), D1 (free tier) | Pay-per-request, single region |
| **Startup** | $200-800           | ALB ($20+), EC2 ASG (t3.medium x 2-10), RDS Multi-AZ, ElastiCache | Multi-AZ HA |
| **Scale**   | $2K-10K            | EKS control plane + nodes, Aurora Global (2 regions), SQS, CloudWatch | Global low-latency |

**Assumptions**:
- Moderate traffic (10k-1M requests/day)
- 2-6 vCPU / 8-32 GB RAM compute
- 20-100 GB storage
