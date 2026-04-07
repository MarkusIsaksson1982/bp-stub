# @observatory/metrics

Shared Prometheus metrics package for the Full Stack Observatory.

## Usage in any service

```js
const { metricsMiddleware, metricsEndpoint } = require('@observatory/metrics');

// In your Express app
app.use(metricsMiddleware);
app.get('/metrics', metricsEndpoint);
```

Metrics automatically include:
- `http_requests_total`
- `http_request_duration_seconds`
- All default Node.js metrics (memory, CPU, event loop, etc.)