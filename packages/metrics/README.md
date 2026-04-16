# @foundation/metrics

Shared Prometheus metrics package for the foundation.

## Usage in any service

```js
const { metricsMiddleware, metricsEndpoint } = require('@foundation/metrics');

// In your Express app
app.use(metricsMiddleware);
app.get('/metrics', metricsEndpoint);
```

Metrics automatically include:
- `http_requests_total`
- `http_request_duration_seconds`
- All default Node.js metrics (memory, CPU, event loop, etc.)