const jwt = require('jsonwebtoken');

const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

function createAuthenticate(options = {}) {
  const apiKey = options.apiKey || process.env.API_KEY;
  const jwtSecret = options.jwtSecret || process.env.JWT_SECRET;

  return function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new UnauthorizedError('Missing or invalid Authorization header')
      );
    }

    const token = authHeader.slice(7).trim();

    if (apiKey && token === apiKey) {
      req.user = {
        id: 1,
        name: 'Service Account',
        role: 'admin'
      };
      return next();
    }

    if (jwtSecret) {
      try {
        req.user = jwt.verify(token, jwtSecret);
        return next();
      } catch (error) {
        // Token verification failed
      }
    }

    return next(new ForbiddenError('Invalid token'));
  };
}

module.exports = createAuthenticate;
