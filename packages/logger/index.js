const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['password', 'secret', 'token'],
  base: {
    service: 'fullstack-observatory',
    environment: process.env.NODE_ENV || 'development'
  }
});

module.exports = logger;