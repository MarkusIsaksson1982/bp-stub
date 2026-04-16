# CI Templates

Reusable GitHub Actions workflow templates.

## Workflows

| Workflow | Purpose |
|----------|---------|
| `node-ci.yml` | Lint -> Test -> Build for Node.js |
| `docker-build.yml` | Build + tag Docker image |
| `terraform-plan.yml` | fmt -> validate -> plan |
| `security-scan.yml` | npm audit + CodeQL SAST |

## Usage

```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    uses: ./.github/workflows/node-ci.yml
    with:
      node-version: '22'
```
