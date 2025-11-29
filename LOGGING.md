# Universal Logger Documentation

## Overview

BuyTree uses a comprehensive universal logger that automatically filters sensitive data and provides structured logging across both frontend and backend.

## Features

- **Automatic Sensitive Data Redaction**: Passwords, tokens, API keys, and other sensitive fields are automatically redacted
- **Environment-Based Log Levels**: Control verbosity based on environment (development/production)
- **Structured Logging**: Consistent log format with timestamps, context, and metadata
- **HTTP Request/Response Logging**: Automatic logging of all API requests and responses
- **Error Tracking**: Detailed error logging with stack traces
- **Namespace Support**: Create child loggers for different modules

## Sensitive Data Protection

The logger automatically redacts the following patterns:
- `password`, `token`, `secret`
- `apikey`, `api_key`, `authorization`
- `cookie`, `session`, `jwt`
- `credit_card`, `cvv`, `card_number`
- `ssn`, `social_security`
- `private_key`, `access_token`, `refresh_token`

**Example:**
```javascript
logger.info('User login', {
  email: 'user@example.com',
  password: 'secret123',  // Will be logged as '[REDACTED]'
  token: 'xyz789'         // Will be logged as '[REDACTED]'
});

// Output: { email: 'user@example.com', password: '[REDACTED]', token: '[REDACTED]' }
```

## Frontend Usage

### Basic Usage

```javascript
import logger from '@/utils/logger';

// Info logging
logger.info('User logged in', { userId: 123 });

// Debug logging (only visible in development)
logger.debug('Component mounted', { props });

// Warning logging
logger.warn('API response slow', { duration: 5000 });

// Error logging
logger.error('Failed to load data', error, { endpoint: '/api/users' });
```

### API Request Logging

```javascript
import logger from '@/utils/logger';

// Log API request
logger.apiRequest('POST', '/api/auth/login', { email: 'user@example.com' });

// Log API response
logger.apiResponse('POST', '/api/auth/login', 200, { success: true });

// Log API error
logger.apiError('POST', '/api/auth/login', error);
```

### User Action Logging

```javascript
import logger from '@/utils/logger';

// Track user interactions
logger.userAction('button_clicked', { buttonId: 'checkout', page: '/cart' });
logger.userAction('product_viewed', { productId: 456 });
```

### Creating Child Loggers

```javascript
import logger from '@/utils/logger';

// Create module-specific logger
const cartLogger = logger.child('Cart');
cartLogger.info('Item added to cart', { productId: 123 });
// Output: [App:Cart] Item added to cart

const checkoutLogger = logger.child('Checkout');
checkoutLogger.info('Payment initiated', { orderId: 789 });
// Output: [App:Checkout] Payment initiated
```

### Custom Logger Instance

```javascript
import { Logger } from '@/utils/logger';

const myLogger = new Logger('MyComponent');
myLogger.info('Component initialized');
```

## Backend Usage

### Basic Usage

```javascript
const { logger } = require('./utils/logger');

// Info logging
logger.info('Server started', { port: 5001 });

// Debug logging
logger.debug('Processing order', { orderId: 123 });

// Warning logging
logger.warn('High memory usage', { usage: '85%' });

// Error logging
logger.error('Database connection failed', error);
```

### HTTP Request Logging

The backend automatically logs all HTTP requests and responses via the `requestLogger` middleware.

**Manual logging:**
```javascript
const { logger } = require('./utils/logger');

// Log request
logger.httpRequest(req);

// Log response with duration
logger.httpResponse(req, res, 150); // 150ms duration
```

### Database Logging

```javascript
const { logger } = require('./utils/logger');

// Log query
logger.dbQuery('SELECT * FROM users WHERE id = $1', [userId]);

// Log database error
logger.dbError('INSERT INTO orders...', error);
```

### Authentication Events

```javascript
const { logger } = require('./utils/logger');

// Log auth events
logger.authEvent('login_success', userId, { method: 'email' });
logger.authEvent('login_failed', null, { email: 'user@example.com', reason: 'invalid_password' });
logger.authEvent('token_refresh', userId);
```

### Security Events

```javascript
const { logger } = require('./utils/logger');

// Security events are always logged regardless of log level
logger.security('Suspicious activity detected', {
  ip: req.ip,
  userId: req.user.id,
  action: 'multiple_failed_logins'
});
```

### Creating Child Loggers

```javascript
const { logger } = require('./utils/logger');

// Create controller-specific logger
const authLogger = logger.child('AuthController');
authLogger.info('User login attempt', { email: 'user@example.com' });
// Output: [App:AuthController] User login attempt

const orderLogger = logger.child('OrderController');
orderLogger.info('Order created', { orderId: 123 });
// Output: [App:OrderController] Order created
```

## Log Levels

Set log level via environment variable:

**Frontend (.env):**
```bash
VITE_LOG_LEVEL=DEBUG  # Shows all logs
VITE_LOG_LEVEL=INFO   # Shows info, warn, error (default)
VITE_LOG_LEVEL=WARN   # Shows warn, error only
VITE_LOG_LEVEL=ERROR  # Shows errors only
VITE_LOG_LEVEL=NONE   # No logging
```

**Backend (.env):**
```bash
LOG_LEVEL=DEBUG  # Shows all logs
LOG_LEVEL=INFO   # Shows info, warn, error (default)
LOG_LEVEL=WARN   # Shows warn, error only
LOG_LEVEL=ERROR  # Shows errors only
LOG_LEVEL=NONE   # No logging
```

## Environment-Specific Behavior

### Development
- Detailed console output with colors
- All log levels visible (if LOG_LEVEL allows)
- Pretty-printed objects
- Full stack traces

### Production
- Compact JSON output (backend)
- Minimal console output (frontend)
- Only ERROR and WARN by default
- Sensitive data always redacted

## Integration Examples

### Frontend API Service

```javascript
import logger from '@/utils/logger';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    logger.apiRequest(config.method, config.url, config.data);
    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    logger.apiResponse(
      response.config.method,
      response.config.url,
      response.status,
      response.data
    );
    return response;
  },
  (error) => {
    logger.apiError(error.config?.method, error.config?.url, error);
    return Promise.reject(error);
  }
);
```

### Backend Controller

```javascript
const { logger } = require('../utils/logger');

const authController = {
  async login(req, res) {
    const controllerLogger = logger.child('AuthController');

    try {
      const { email, password } = req.body;

      controllerLogger.info('Login attempt', { email });

      // Authenticate user
      const user = await authenticateUser(email, password);

      if (!user) {
        controllerLogger.warn('Login failed', { email, reason: 'invalid_credentials' });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      controllerLogger.authEvent('login_success', user.id, { email });

      res.json({ user, token });
    } catch (error) {
      controllerLogger.error('Login error', error, { email: req.body.email });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
```

## Best Practices

1. **Use Appropriate Log Levels**
   - `DEBUG`: Detailed debugging information (dev only)
   - `INFO`: General informational messages
   - `WARN`: Warning messages for potential issues
   - `ERROR`: Error messages that need attention

2. **Always Include Context**
   ```javascript
   // Good
   logger.error('Failed to create order', error, { userId, cartId });

   // Bad
   logger.error('Failed to create order');
   ```

3. **Use Child Loggers for Modules**
   ```javascript
   const cartLogger = logger.child('Cart');
   const checkoutLogger = logger.child('Checkout');
   ```

4. **Don't Log Sensitive Data Manually**
   ```javascript
   // Bad - even though it will be redacted, avoid logging sensitive fields
   logger.info('User data', { password: user.password });

   // Good - only log non-sensitive data
   logger.info('User created', { userId: user.id, email: user.email });
   ```

5. **Log User Actions for Analytics**
   ```javascript
   logger.userAction('checkout_completed', { orderId, amount });
   logger.userAction('search_performed', { query, resultsCount });
   ```

## External Service Integration

### Sentry Integration (Optional)

**Frontend:**
```javascript
// frontend/src/utils/logger.js
import * as Sentry from '@sentry/react';

const sendToExternalService = (logData) => {
  if (import.meta.env.PROD && logData.level === 'ERROR') {
    Sentry.captureException(new Error(logData.message), {
      contexts: { logger: logData.context }
    });
  }
};
```

**Backend:**
```javascript
// backend/src/utils/logger.js
const Sentry = require('@sentry/node');

const sendToExternalService = (logData) => {
  if (process.env.NODE_ENV === 'production' && logData.level === 'ERROR') {
    Sentry.captureException(new Error(logData.message), {
      contexts: { logger: logData.context }
    });
  }
};
```

## Troubleshooting

### Logs not appearing in development
- Check `VITE_LOG_LEVEL` (frontend) or `LOG_LEVEL` (backend)
- Ensure log level is set to `DEBUG` or `INFO`

### Too many logs in production
- Set `LOG_LEVEL=ERROR` in production
- Only critical errors will be logged

### Sensitive data appearing in logs
- Check if field name matches patterns in `SENSITIVE_PATTERNS`
- Add custom patterns if needed
- Report as a security issue

## Migration from console.*

Replace existing `console.*` calls:

```javascript
// Before
console.log('User logged in', user);
console.error('Error:', error);
console.warn('Warning:', warning);

// After
logger.info('User logged in', { userId: user.id });
logger.error('Error occurred', error);
logger.warn('Warning detected', { warning });
```
