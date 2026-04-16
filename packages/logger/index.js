const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['password', 'secret', 'token', 'apiKey', 'api_key'],
  base: {
    service: process.env.SERVICE_NAME || 'foundation-service',
    environment: process.env.NODE_ENV || 'development'
  }
});

module.exports = logger;