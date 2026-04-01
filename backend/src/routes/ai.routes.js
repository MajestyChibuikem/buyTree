const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { chat, generateDescription, suggestCategory, triageDispute } = require('../controllers/aiController');

// Stricter rate limit for AI endpoints (10 req/min per user)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, message: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticateToken);
router.use(aiLimiter);

router.post('/chat', chat);
router.post('/generate-description', generateDescription);
router.post('/suggest-category', suggestCategory);
router.post('/triage-dispute', triageDispute);

module.exports = router;
