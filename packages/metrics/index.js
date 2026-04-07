const prom = require('prom-client');

// Create a Registry
const register = new prom.Registry();
register.setDefaultLabels({
  service: 'fullstack-api-server',
  environment: process.env.NODE_ENV || 'development'
});

// Standard collectors (CPU, memory, event loop, etc.)
prom.collectDefaultMetrics({ register });

// HTTP request metrics
const httpRequestsTotal = new prom.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDurationSeconds = new prom.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

// Middleware for Express
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status: res.statusCode
    });

    httpRequestDurationSeconds.observe({
      method: req.method,
      route: route
    }, duration);
  });

  next();
}

// Expose /metrics endpoint
async function metricsEndpoint(req, res, next) {
  res.set('Content-Type', register.contentType);

  try {
    res.end(await register.metrics());
  } catch (error) {
    next(error);
  }
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  register,
  prom
};
