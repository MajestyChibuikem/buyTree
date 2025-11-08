const express = require('express');
const router = express.Router();
const { getSellerAnalytics } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get seller analytics
router.get('/seller', getSellerAnalytics);

module.exports = router;
