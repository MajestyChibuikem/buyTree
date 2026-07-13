const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getUserOrders,
  getUserOrdersByShop,
  getOrderDetails,
  getSellerOrders,
  updateOrderStatus,
  getSellerDashboardSummary,
  getSellerOrdersByStatus,
  addSellerNote,
  getSellerNotes,
  getOrderStatusHistory,
  confirmDelivery,
  getOrderByTrackingToken,
  confirmDeliveryByToken,
  createDisputeByToken,
} = require('../controllers/orderController');
const { authenticateToken, authenticateTokenOptional } = require('../middleware/auth');

// Public / Guest Buyer routes
router.post('/create', authenticateTokenOptional, createOrder);
router.get('/verify/:reference', verifyPayment);
router.get('/track/:trackingToken', getOrderByTrackingToken);
router.post('/track/:trackingToken/confirm-delivery', confirmDeliveryByToken);
router.post('/track/:trackingToken/dispute', createDisputeByToken);

// All routes below require seller or buyer authentication
router.use(authenticateToken);

// Authenticated Buyer routes
router.get('/user', getUserOrders);
router.get('/user/shop/:shopSlug', getUserOrdersByShop);
router.post('/:orderId/confirm-delivery', confirmDelivery);

// Order details and history (both buyer and seller can access)
router.get('/:orderId', getOrderDetails);
router.get('/:orderId/history', getOrderStatusHistory);

// Seller routes - Dashboard & Order Management
router.get('/seller/dashboard-summary', getSellerDashboardSummary); // Performance optimized summary
router.get('/seller/orders', getSellerOrders); // All orders (legacy)
router.get('/seller/orders/:status', getSellerOrdersByStatus); // Orders by status with pagination
router.put('/seller/:orderId/status', updateOrderStatus); // Update order status
router.post('/seller/:orderId/notes', addSellerNote); // Add internal note
router.get('/seller/:orderId/notes', getSellerNotes); // Get all notes for order

module.exports = router;
