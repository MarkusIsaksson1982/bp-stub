const express = require('express');

function createHealthRouter({ getDatabaseStatus }) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const dbStatus = await getDatabaseStatus().catch(() => 'down');

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      service: 'fullstack-api-server',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = { createHealthRouter };