const express = require('express');
const router = express.Router();
const {
  registerSeller,
  getSellerProfile,
  getSellerBySlug,
  getAllSellers,
  getBanks,
} = require('../controllers/sellerController');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Public routes with caching
router.get('/banks', cacheMiddleware(3600), getBanks); // Cache for 1 hour (banks don't change often)
router.get('/shops/all', cacheMiddleware(300), getAllSellers); // Cache for 5 minutes (shop list)
router.get('/:shopSlug', cacheMiddleware(600), getSellerBySlug); // Cache for 10 minutes (shop details)

// Protected routes (require authentication)
router.post('/register', authenticateToken, registerSeller); // Register as seller
router.get('/profile/me', authenticateToken, getSellerProfile); // Get own seller profile

module.exports = router;
