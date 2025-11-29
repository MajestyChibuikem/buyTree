/**
 * Request Logging Middleware
 *
 * Automatically logs all HTTP requests and responses
 */

const { logger } = require('../utils/logger');

const requestLogger = (req, res, next) => {
  // Record start time
  const startTime = Date.now();

  // Log incoming request
  logger.httpRequest(req);

  // Capture the original res.json to log response
  const originalJson = res.json;
  res.json = function (data) {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Log response
    logger.httpResponse(req, res, duration);

    // Call original json method
    return originalJson.call(this, data);
  };

  // Capture response finish event for non-JSON responses
  res.on('finish', () => {
    if (!res.headersSent || res.getHeader('content-type')?.includes('application/json')) {
      return; // Already logged via res.json override
    }

    const duration = Date.now() - startTime;
    logger.httpResponse(req, res, duration);
  });

  next();
};

module.exports = requestLogger;
