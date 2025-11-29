/**
 * Universal Logger Utility
 *
 * Provides structured logging with sensitive data filtering
 * and environment-based log levels.
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
];

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

// Get current log level from environment
const getCurrentLogLevel = () => {
  const envLevel = import.meta.env.VITE_LOG_LEVEL || 'INFO';
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

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
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
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };
};

/**
 * Send logs to external service (optional)
 * You can integrate with services like Sentry, LogRocket, etc.
 */
const sendToExternalService = (logData) => {
  // Only send errors to external service in production
  if (import.meta.env.PROD && logData.level === 'ERROR') {
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

  // Console output
  const consoleMethod = level === 'ERROR' ? 'error' :
                       level === 'WARN' ? 'warn' :
                       level === 'DEBUG' ? 'debug' : 'log';

  if (import.meta.env.DEV) {
    // Detailed output in development
    console[consoleMethod](
      `[${logData.timestamp}] ${level}:`,
      message,
      logData.context
    );
  } else {
    // Compact output in production
    console[consoleMethod](`[${level}] ${message}`, logData.context);
  }

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
      } : null,
    };
    log('ERROR', LOG_LEVELS.ERROR, `[${this.namespace}] ${message}`, errorContext);
  }

  /**
   * Log API request
   */
  apiRequest(method, url, data = null) {
    this.debug('API Request', {
      method,
      url,
      data: sanitizeData(data),
    });
  }

  /**
   * Log API response
   */
  apiResponse(method, url, status, data = null) {
    this.debug('API Response', {
      method,
      url,
      status,
      data: sanitizeData(data),
    });
  }

  /**
   * Log API error
   */
  apiError(method, url, error) {
    this.error('API Error', error, {
      method,
      url,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
  }

  /**
   * Log user action
   */
  userAction(action, details = {}) {
    this.info('User Action', {
      action,
      details: sanitizeData(details),
    });
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
export { Logger };
export default logger;
