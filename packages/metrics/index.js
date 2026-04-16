const prom = require('prom-client');

const register = new prom.Registry();
register.setDefaultLabels({
  service: process.env.SERVICE_NAME || 'foundation-api',
  environment: process.env.NODE_ENV || 'development'
});

prom.collectDefaultMetrics({ register });

const httpRequestsTotal = new prom.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDurationSeconds = new prom.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const mlInferenceDurationSeconds = new prom.Histogram({
  name: 'ml_inference_duration_seconds',
  help: 'ML model inference duration in seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const mlInferenceTotal = new prom.Counter({
  name: 'ml_inference_total',
  help: 'Total number of ML inferences',
  labelNames: ['model', 'operation', 'status'],
  registers: [register]
});

const queueSize = new prom.Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name'],
  registers: [register]
});

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
  mlInferenceDurationSeconds,
  mlInferenceTotal,
  queueSize,
  register,
  prom
};
