const express = require('express');
const router = express.Router();
const { getSellerAnalytics, getProductViewAnalytics } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get seller analytics
router.get('/seller', getSellerAnalytics);

// Get product view analytics
router.get('/seller/views', getProductViewAnalytics);

module.exports = router;
