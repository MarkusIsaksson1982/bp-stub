const express = require('express');
const helmet = require('helmet');

const createAuthenticate = require('./middleware/authenticate');
const createCors = require('./middleware/cors');
const createRateLimit = require('./middleware/rateLimit');
const createRequestLogger = require('./middleware/requestLogger');
const createValidate = require('./middleware/validate');
const createHealthRouter = require('./routes/health');
const { NotFoundError, normalizeError } = require('@foundation/core');

const logger = require('@foundation/logger');
const { metricsMiddleware, metricsEndpoint } = require('@foundation/metrics');

function createApp(options = {}) {
  const app = express();

  const authenticate = options.authenticate || createAuthenticate(options.auth);
  const validate = options.validate || createValidate;

  app.disable('x-powered-by');
  app.use(helmet());

  app.use(createCors({ origin: options.corsOrigin }));
  app.use(createRequestLogger({ logger }));
  app.use(metricsMiddleware);
  app.use(
    createRateLimit({
      max: options.rateLimitMax,
      windowMs: options.rateLimitWindowMs,
      store: options.rateLimitStore,
      keyGenerator: options.rateLimitKeyGenerator
    })
  );

  app.use('/api/health', createHealthRouter({
    getDatabaseStatus: options.getDatabaseStatus
  }));

  if (options.router) {
    app.use('/api/v1', options.router);
  }

  app.get('/metrics', metricsEndpoint);

  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

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
