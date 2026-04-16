const request = require('supertest');

const { createApp } = require('../src/app');

function createSilentLogger() {
  return {
    child() {
      return this;
    },
    info() {},
    error() {}
  };
}

describe('GET /api/health', () => {
  test('returns service metadata without auth', async () => {
    const app = createApp({
      getDatabaseStatus: async () => 'up',
      rateLimitMax: 100
    });

    const response = await request(app).get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      framework: 'Express.js',
      database: 'up'
    });
    expect(response.headers['access-control-allow-origin']).toBe('*');
    expect(response.headers['x-ratelimit-limit']).toBe('100');
    expect(response.body.memory).toBeDefined();
  });
});
