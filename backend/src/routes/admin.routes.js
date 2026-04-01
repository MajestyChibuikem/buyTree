const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  requireAdmin,
  getDashboardMetrics,
  getAllSellers,
  approveSeller,
  suspendSeller,
  getAllOrders,
  getRevenueAnalytics,
  getTopProducts,
} = require('../controllers/adminController');
const {
  adminListDisputes,
  adminGetTriage,
  adminResolveDispute,
} = require('../controllers/disputeController');
const { adminListBypassFlags, adminUpdateBypassFlag } = require('../controllers/bypassController');

// All admin routes require authentication AND admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard metrics
router.get('/dashboard', getDashboardMetrics);

// Seller management
router.get('/sellers', getAllSellers);
router.put('/sellers/:sellerId/approve', approveSeller);
router.put('/sellers/:sellerId/suspend', suspendSeller);

// Order monitoring
router.get('/orders', getAllOrders);

// Analytics
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/top-products', getTopProducts);

// Dispute management
router.get('/disputes', adminListDisputes);
router.get('/disputes/:id/triage', adminGetTriage);
router.put('/disputes/:id/resolve', adminResolveDispute);

// Bypass flags
router.get('/bypass-flags', adminListBypassFlags);
router.put('/bypass-flags/:id', adminUpdateBypassFlag);

module.exports = router;
