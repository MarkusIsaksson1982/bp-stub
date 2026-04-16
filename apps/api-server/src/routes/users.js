const express = require('express');

const { query } = require('../db/pool');
const { NotFoundError } = require('../utils/errors');

function mapResourceRow(row) {
  return {
    id: Number(row.id),
    type: row.type,
    name: row.name,
    config: row.config,
    metadata: row.metadata,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function createPostgresResourceStore(options = {}) {
  const queryFn = options.queryFn || query;

  const store = {
    async list(type = null) {
      let sql = `
        SELECT
          id, type, name, config, metadata, status, created_at, updated_at
        FROM resources
      `;
      const params = [];

      if (type) {
        sql += ' WHERE type = $1';
        params.push(type);
      }

      sql += ' ORDER BY id ASC;';
      const result = await queryFn(sql, params);
      return result.rows.map(mapResourceRow);
    },

    async getById(id) {
      const result = await queryFn(
        `SELECT id, type, name, config, metadata, status, created_at, updated_at
         FROM resources WHERE id = $1;`,
        [id]
      );
      return result.rows[0] ? mapResourceRow(result.rows[0]) : null;
    },

    async getByType(type) {
      const result = await queryFn(
        `SELECT id, type, name, config, metadata, status, created_at, updated_at
         FROM resources WHERE type = $1 AND status = 'active';`,
        [type]
      );
      return result.rows.map(mapResourceRow);
    },

    async create(input) {
      const result = await queryFn(
        `INSERT INTO resources (type, name, config, metadata, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, type, name, config, metadata, status, created_at, updated_at;`,
        [input.type, input.name, input.config || {}, input.metadata || {}, input.status || 'active']
      );
      return mapResourceRow(result.rows[0]);
    },

    async update(id, changes) {
      const existing = await store.getById(id);
      if (!existing) return null;

      const result = await queryFn(
        `UPDATE resources
         SET name = $2, config = $3, metadata = $4, status = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, type, name, config, metadata, status, created_at, updated_at;`,
        [id, changes.name ?? existing.name, changes.config ?? existing.config,
         changes.metadata ?? existing.metadata, changes.status ?? existing.status]
      );
      return mapResourceRow(result.rows[0]);
    },

    async remove(id) {
      const result = await queryFn(
        `DELETE FROM resources WHERE id = $1
         RETURNING id, type, name, config, metadata, status, created_at, updated_at;`,
        [id]
      );
      return result.rows[0] ? mapResourceRow(result.rows[0]) : null;
    }
  };

  return store;
}

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createResourcesRouter(options = {}) {
  const authenticate = options.authenticate;
  const validate = options.validate;
  const resourceStore = options.resourceStore || createPostgresResourceStore();

  if (typeof authenticate !== 'function') {
    throw new Error('authenticate middleware must be provided');
  }

  if (typeof validate !== 'function') {
    throw new Error('validate middleware factory must be provided');
  }

  const router = express.Router();

  router.get(
    '/',
    authenticate,
    asyncHandler(async (req, res) => {
      const type = req.query.type || null;
      const resources = await resourceStore.list(type);

      res.json({
        data: resources,
        count: resources.length,
        meta: { page: 1, perPage: 100 }
      });
    })
  );

  router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      const resource = await resourceStore.getById(Number(req.params.id));
      if (!resource) {
        throw new NotFoundError(`Resource #${req.params.id} not found`);
      }
      res.json({ data: resource });
    })
  );

  router.get(
    '/type/:type',
    authenticate,
    asyncHandler(async (req, res) => {
      const resources = await resourceStore.getByType(req.params.type);
      res.json({ data: resources, count: resources.length });
    })
  );

  router.post(
    '/',
    authenticate,
    validate({
      type: { required: true, type: 'string' },
      name: { required: true, type: 'string' },
      config: { required: false, type: 'object' },
      metadata: { required: false, type: 'object' }
    }),
    asyncHandler(async (req, res) => {
      const resource = await resourceStore.create(req.body);
      res.status(201).json({ data: resource, message: 'Resource created' });
    })
  );

  router.put(
    '/:id',
    authenticate,
    validate({
      name: { required: false, type: 'string' },
      config: { required: false, type: 'object' },
      metadata: { required: false, type: 'object' },
      status: { required: false, type: 'string' }
    }),
    asyncHandler(async (req, res) => {
      const resource = await resourceStore.update(Number(req.params.id), req.body);
      if (!resource) {
        throw new NotFoundError(`Resource #${req.params.id} not found`);
      }
      res.json({ data: resource, message: 'Resource updated' });
    })
  );

  router.delete(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      const resource = await resourceStore.remove(Number(req.params.id));
      if (!resource) {
        throw new NotFoundError(`Resource #${req.params.id} not found`);
      }
      res.json({ data: resource, message: 'Resource deleted' });
    })
  );

  return router;
}

module.exports = {
  createResourcesRouter,
  createPostgresResourceStore
};
