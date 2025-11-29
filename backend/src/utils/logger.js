/**
 * Universal Logger Utility - Backend
 *
 * Provides structured logging with sensitive data filtering
 * and environment-based log levels for Node.js backend.
 */

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'auth',
  'cookie',
  'session',
  'credit_card',
  'creditcard',
  'card_number',
  'cvv',
  'ssn',
  'social_security',
  'private_key',
  'privatekey',
  'access_token',
  'refresh_token',
  'jwt',
  'bearer',
];

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

// ANSI color codes for console output
const COLORS = {
  DEBUG: '\x1b[36m',   // Cyan
  INFO: '\x1b[32m',    // Green
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  RESET: '\x1b[0m',
};

// Get current log level from environment
const getCurrentLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL || 'INFO';
  return LOG_LEVELS[envLevel.toUpperCase()] || LOG_LEVELS.INFO;
};

/**
 * Check if a key contains sensitive information
 */
const isSensitiveKey = (key) => {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_PATTERNS.some(pattern => lowerKey.includes(pattern));
};

/**
 * Recursively sanitize an object by redacting sensitive fields
 */
const sanitizeData = (data, depth = 0) => {
  // Prevent infinite recursion
  if (depth > 10) return '[Max Depth Reached]';

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Handle circular references
  const seen = new WeakSet();
  if (seen.has(data)) {
    return '[Circular Reference]';
  }
  seen.add(data);

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  // Handle Error objects
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
  }

  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Format log message with timestamp and context
 */
const formatMessage = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const sanitizedContext = sanitizeData(context);

  return {
    timestamp,
    level,
    message,
    context: sanitizedContext,
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
  };
};

/**
 * Write logs to file (optional)
 */
const writeToFile = (logData) => {
  // TODO: Implement file logging if needed
  // Can use Winston, Bunyan, or Pino for advanced file logging
};

/**
 * Send logs to external service (optional)
 */
const sendToExternalService = (logData) => {
  // Only send errors to external service in production
  if (process.env.NODE_ENV === 'production' && logData.level === 'ERROR') {
    // TODO: Integrate with your logging service
    // Example: Sentry.captureException(logData);
  }
};

/**
 * Core logging function
 */
const log = (level, levelValue, message, context = {}) => {
  const currentLevel = getCurrentLogLevel();

  // Skip if log level is below threshold
  if (levelValue < currentLevel) {
    return;
  }

  const logData = formatMessage(level, message, context);

  // Console output with colors in development
  const isDev = process.env.NODE_ENV !== 'production';
  const color = COLORS[level] || COLORS.RESET;
  const reset = COLORS.RESET;

  if (isDev) {
    // Colored detailed output in development
    console.log(
      `${color}[${logData.timestamp}] ${level}:${reset}`,
      message,
      Object.keys(logData.context).length > 0 ? logData.context : ''
    );
  } else {
    // JSON output in production for log aggregation
    console.log(JSON.stringify(logData));
  }

  // Write to file
  writeToFile(logData);

  // Send to external service
  sendToExternalService(logData);
};

/**
 * Logger class with convenience methods
 */
class Logger {
  constructor(namespace = 'App') {
    this.namespace = namespace;
  }

  /**
   * Debug level logging - for detailed debugging information
   */
  debug(message, context = {}) {
    log('DEBUG', LOG_LEVELS.DEBUG, `[${this.namespace}] ${message}`, context);
  }

  /**
   * Info level logging - for general informational messages
   */
  info(message, context = {}) {
    log('INFO', LOG_LEVELS.INFO, `[${this.namespace}] ${message}`, context);
  }

  /**
   * Warning level logging - for warnings that don't prevent operation
   */
  warn(message, context = {}) {
    log('WARN', LOG_LEVELS.WARN, `[${this.namespace}] ${message}`, context);
  }

  /**
   * Error level logging - for errors that need attention
   */
  error(message, error = null, context = {}) {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      } : null,
    };
    log('ERROR', LOG_LEVELS.ERROR, `[${this.namespace}] ${message}`, errorContext);
  }

  /**
   * Log HTTP request
   */
  httpRequest(req) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      // Don't log headers as they may contain sensitive data
    });
  }

  /**
   * Log HTTP response
   */
  httpResponse(req, res, duration) {
    this.info('HTTP Response', {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log database query
   */
  dbQuery(query, params = null) {
    this.debug('Database Query', {
      query,
      params: sanitizeData(params),
    });
  }

  /**
   * Log database error
   */
  dbError(query, error) {
    this.error('Database Error', error, {
      query,
    });
  }

  /**
   * Log authentication event
   */
  authEvent(event, userId = null, details = {}) {
    this.info('Auth Event', {
      event,
      userId,
      details: sanitizeData(details),
    });
  }

  /**
   * Log security event (always logged regardless of level)
   */
  security(event, details = {}) {
    log('ERROR', LOG_LEVELS.ERROR, `[${this.namespace}] SECURITY: ${event}`, sanitizeData(details));
  }

  /**
   * Create a child logger with a new namespace
   */
  child(childNamespace) {
    return new Logger(`${this.namespace}:${childNamespace}`);
  }
}

// Create default logger instance
const logger = new Logger('App');

// Export both the logger instance and the Logger class
module.exports = { Logger, logger };
