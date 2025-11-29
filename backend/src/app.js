const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestLogger = require('./middleware/requestLogger');
const { logger } = require('./utils/logger');

const app = express();

// Security Headers - Helmet.js
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from Cloudinary
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    },
  },
}));

// Rate Limiting - TEMPORARILY DISABLED FOR TESTING
// TODO: Re-enable before production deployment

// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 login attempts per windowMs
//   message: 'Too many login attempts, please try again after 15 minutes.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const passwordResetLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 3, // Limit each IP to 3 password reset requests per hour
//   message: 'Too many password reset requests, please try again after an hour.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api/', generalLimiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (should be after body parsers)
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Try to connect to database
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await pool.query('SELECT NOW()');
    await pool.end();

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
const authRoutes = require('./routes/auth.routes');
const sellerRoutes = require('./routes/seller.routes');
const productRoutes = require('./routes/product.routes');
const uploadRoutes = require('./routes/upload.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const reviewRoutes = require('./routes/review.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const passwordResetRoutes = require('./routes/passwordReset.routes');
const adminRoutes = require('./routes/admin.routes');

// Export limiters for use in routes (DISABLED FOR TESTING)
// app.set('authLimiter', authLimiter);
// app.set('passwordResetLimiter', passwordResetLimiter);

// Apply routes (rate limiters disabled for testing)
app.use('/api/auth', authRoutes);
app.use('/api/password-reset', passwordResetRoutes);

// Other routes use general limiter (already applied globally)
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'BuyTree API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (protected)'
      },
      sellers: {
        register: 'POST /api/sellers/register (coming soon)',
        get: 'GET /api/sellers/:shopSlug (coming soon)'
      },
      products: {
        create: 'POST /api/products (coming soon)',
        list: 'GET /api/products (coming soon)',
        get: 'GET /api/products/:id (coming soon)'
      }
    },
    documentation: 'See BUILD_PLAN.md for implementation timeline'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: '/api'
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Log error using logger
  logger.error('Unhandled error', err, {
    method: req.method,
    url: req.url,
    statusCode: err.statusCode || 500,
  });

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
