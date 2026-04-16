const { Pool } = require('pg');

const { DatabaseError } = require('../utils/errors');

let pool;

function createPoolConfig() {
  return {
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/foundation_db',
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

function getPool() {
  if (!pool) {
    pool = new Pool(createPoolConfig());
    pool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error', error);
    });
  }

  return pool;
}

async function query(text, params) {
  try {
    return await getPool().query(text, params);
  } catch (error) {
    throw new DatabaseError('Database query failed', {
      message: error.message
    });
  }
}

async function initializeDatabase() {
  const client = await getPool().connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        config JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS inference_logs (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER REFERENCES resources(id),
        model TEXT NOT NULL,
        operation TEXT NOT NULL,
        duration_ms INTEGER,
        input_size INTEGER,
        output_size INTEGER,
        status TEXT NOT NULL,
        error TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await client.query(
      'SELECT COUNT(*)::integer AS count FROM resources;'
    );

    if (result.rows[0].count === 0) {
      await client.query(`
        INSERT INTO resources (type, name, config, status)
        VALUES
          ('speech_to_text', 'Default STT Model', '{"model": "whisper-base"}', 'active'),
          ('text_to_speech', 'Default TTS Model', '{"model": "tts-1"}', 'active'),
          ('voice_biometrics', 'Default Voice Auth', '{"model": "resemblyzer"}', 'active');
      `);
    }
  } catch (error) {
    throw new DatabaseError('Failed to initialize database', {
      message: error.message
    });
  } finally {
    client.release();
  }
}

async function pingDatabase() {
  try {
    await getPool().query('SELECT 1;');
    return 'up';
  } catch (error) {
    throw new DatabaseError('Database health check failed', {
      message: error.message
    });
  }
}

async function closePool() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
}

module.exports = {
  getPool,
  query,
  initializeDatabase,
  pingDatabase,
  closePool
};
