const fs = require('fs');
const path = require('path');

function loadEnv(filePath = path.resolve(process.cwd(), '.env')) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const normalizedValue = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = normalizedValue;
    }
  }
}

async function startServer() {
  loadEnv();

  const logger = require('@foundation/logger');
  const { createApp } = require('./app');
  const { closePool, initializeDatabase } = require('./db/pool');

  await initializeDatabase();

  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  const serviceName = process.env.SERVICE_NAME || 'foundation-api';

  const server = app.listen(port, () => {
    logger.info({ port, service: serviceName }, 'Foundation API started');
  });

  const shutdown = async () => {
    logger.info('Shutting down...');
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
}

module.exports = {
  loadEnv,
  startServer
};
