const express = require('express');

const { pingDatabase } = require('../db/pool');

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createHealthRouter(options = {}) {
  const getDatabaseStatus = options.getDatabaseStatus || pingDatabase;
  const router = express.Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const database = await getDatabaseStatus();
      const memUsage = process.memoryUsage();

      res.json({
        status: 'ok',
        uptime: `${Math.round(process.uptime())}s`,
        framework: 'Express.js',
        environment: process.env.NODE_ENV || 'development',
        service: process.env.SERVICE_NAME || 'foundation-api',
        database,
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
        }
      });
    })
  );

  return router;
}

module.exports = createHealthRouter;
