# Pipeline Design

## CI/CD Pipeline Stages

```text
1. Lint     -> Catch code quality issues (fastest, cheapest)
2. Test     -> Verify correctness (fast, catches logic errors)
3. Build    -> Produce artifacts (Docker image, bundle)
4. Security -> Audit dependencies, scan for vulnerabilities
5. Deploy   -> Push to production (only on main, after all gates pass)
```

## Fail Fast Principle

Stages are ordered by **speed** and **cost**. Linting takes seconds and catches
formatting issues. Tests catch real bugs. Building and security scanning are heavier.
Deployment only happens if everything passes.

## Reusable Workflows

GitHub Actions `workflow_call` lets repos reference shared workflows:
- One place to update CI logic
- All repos get the same quality gates
- New repos inherit best practices by default
