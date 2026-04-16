const request = require('supertest');

const { createApp } = require('../src/app');

function createMemoryResourceStore() {
  const resources = [
    { id: 1, type: 'speech_to_text', name: 'Whisper Base', config: {}, metadata: {}, status: 'active', created_at: new Date(), updated_at: new Date() },
    { id: 2, type: 'text_to_speech', name: 'TTS Standard', config: {}, metadata: {}, status: 'active', created_at: new Date(), updated_at: new Date() }
  ];
  let nextId = 3;

  function clone(resource) {
    return resource ? { ...resource } : null;
  }

  return {
    async list() {
      return resources.map(clone);
    },
    async getById(id) {
      return clone(resources.find((r) => r.id === id));
    },
    async getByType(type) {
      return resources.filter((r) => r.type === type).map(clone);
    },
    async create(input) {
      const resource = {
        id: nextId++,
        type: input.type,
        name: input.name,
        config: input.config || {},
        metadata: input.metadata || {},
        status: input.status || 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      resources.push(resource);
      return clone(resource);
    },
    async update(id, changes) {
      const resource = resources.find((r) => r.id === id);
      if (!resource) return null;
      Object.assign(resource, changes, { updated_at: new Date() });
      return clone(resource);
    },
    async remove(id) {
      const index = resources.findIndex((r) => r.id === id);
      if (index === -1) return null;
      const [removed] = resources.splice(index, 1);
      return clone(removed);
    }
  };
}

function createTestApp() {
  process.env.API_KEY = 'test-api-key';

  return createApp({
    getDatabaseStatus: async () => 'up',
    resourceStore: createMemoryResourceStore(),
    rateLimitMax: 100
  });
}

describe('/api/v1/resources', () => {
  test('rejects missing auth', async () => {
    const app = createTestApp();
    const response = await request(app).get('/api/v1/resources');

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      error: 'Unauthorized'
    });
  });

  test('supports full CRUD with valid API key', async () => {
    const app = createTestApp();
    const authHeader = { Authorization: 'Bearer test-api-key' };

    const listResponse = await request(app).get('/api/v1/resources').set(authHeader);
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.body.count).toBe(2);

    const getResponse = await request(app).get('/api/v1/resources/1').set(authHeader);
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body.data).toMatchObject({
      id: 1,
      name: 'Whisper Base'
    });

    const createResponse = await request(app)
      .post('/api/v1/resources')
      .set({
        ...authHeader,
        'Content-Type': 'application/json'
      })
      .send({ type: 'llm', name: 'GPT-4o Mini' });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body).toMatchObject({
      message: 'Resource created'
    });

    const updateResponse = await request(app)
      .put('/api/v1/resources/1')
      .set({
        ...authHeader,
        'Content-Type': 'application/json'
      })
      .send({ status: 'inactive' });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.status).toBe('inactive');

    const deleteResponse = await request(app)
      .delete('/api/v1/resources/2')
      .set(authHeader);

    expect(deleteResponse.statusCode).toBe(200);
  });

  test('validates required fields', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/v1/resources')
      .set({
        Authorization: 'Bearer test-api-key',
        'Content-Type': 'application/json'
      })
      .send({ type: 'llm' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({
      error: 'ValidationError'
    });
  });
});
