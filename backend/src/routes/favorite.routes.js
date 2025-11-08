const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite,
  batchCheckFavorites,
} = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

// All favorite routes require authentication
router.use(authenticateToken);

// Get user's favorites
router.get('/', getUserFavorites);

// Add product to favorites
router.post('/add', addFavorite);

// Remove product from favorites
router.delete('/remove/:productId', removeFavorite);

// Check if product is favorited
router.get('/check/:productId', checkFavorite);

// Batch check multiple products
router.post('/batch-check', batchCheckFavorites);

module.exports = router;
