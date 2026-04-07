const express = require('express');

const createAuthenticate = require('./middleware/authenticate');
const createCors = require('./middleware/cors');
const createRateLimit = require('./middleware/rateLimit');
const createRequestLogger = require('./middleware/requestLogger');
const createValidate = require('./middleware/validate');
const createHealthRouter = require('./routes/health');
const { createUsersRouter } = require('./routes/users');
const { NotFoundError, normalizeError } = require('@observatory/core');

// Shared observatory packages
const logger = require('@observatory/logger');
const { metricsMiddleware, metricsEndpoint } = require('@observatory/metrics');
const { createHealthRouter: createObservatoryHealthRouter } = require('@observatory/healthcheck');

function createApp(options = {}) {
  const app = express();

  const authenticate = options.authenticate || createAuthenticate(options.auth);
  const validate = options.validate || createValidate;

  app.disable('x-powered-by');

  // Shared middleware
  app.use(createCors({ origin: options.corsOrigin }));
  app.use(createRequestLogger({ logger }));
  app.use(metricsMiddleware);                    // ← shared metrics
  app.use(
    createRateLimit({
      max: options.rateLimitMax,
      windowMs: options.rateLimitWindowMs,
      store: options.rateLimitStore,
      keyGenerator: options.rateLimitKeyGenerator
    })
  );

  // Health checks (shared + custom)
  app.use('/api/health', createHealthRouter({
    getDatabaseStatus: options.getDatabaseStatus
  }));

  // Users router
  app.use('/api/users', createUsersRouter({
    userStore: options.userStore,
    authenticate,
    validate
  }));

  // Prometheus metrics endpoint
  app.get('/metrics', metricsEndpoint);

  // 404 handler
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Error handler
  app.use((error, req, res, next) => {
    const normalizedError = normalizeError(error);
    const statusCode = normalizedError.statusCode || 500;

    if (statusCode >= 500 && req.log) {
      req.log.error({ err: normalizedError }, 'request failed');
    }

    if (res.headersSent) return next(normalizedError);

    return res.status(statusCode).json({
      error: normalizedError.code || normalizedError.name || 'InternalError',
      message: normalizedError.expose === false ? 'Internal server error' : normalizedError.message,
      statusCode,
      requestId: req.requestId || null,
      ...(normalizedError.details ? { details: normalizedError.details } : {})
    });
  });

  return app;
}

module.exports = { createApp };