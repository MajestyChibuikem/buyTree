const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

// All cart routes require authentication
router.use(authenticateToken);

router.get('/', getCart); // Get cart with items
router.post('/add', addToCart); // Add item to cart
router.put('/update', updateCartItem); // Update item quantity
router.delete('/remove/:productId', removeFromCart); // Remove item from cart
router.delete('/clear', clearCart); // Clear all items

module.exports = router;
