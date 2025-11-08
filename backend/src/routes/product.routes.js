const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductsByShopSlug,
  searchProducts,
} = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Public routes
router.get('/', cacheMiddleware(300), getProducts); // Get all products with filters - 5 min cache
router.get('/search', cacheMiddleware(180), searchProducts); // Search products across all shops - 3 min cache
router.get('/shop/:shopSlug', cacheMiddleware(300), getProductsByShopSlug); // Get products by shop slug - 5 min cache
router.get('/:id', cacheMiddleware(600), getProductById); // Get single product - 10 min cache

// Protected routes (require authentication)
router.post('/', authenticateToken, createProduct); // Create product (sellers only)
router.get('/my/products', authenticateToken, getMyProducts); // Get my products (sellers only)
router.put('/:id', authenticateToken, updateProduct); // Update product (seller's own)
router.delete('/:id', authenticateToken, deleteProduct); // Delete product (seller's own)

module.exports = router;
