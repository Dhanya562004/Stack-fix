const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global Express Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  
  logger.error('Unhandled API Error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  const response = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred.',
      ...(config.env === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found on this server.`
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
