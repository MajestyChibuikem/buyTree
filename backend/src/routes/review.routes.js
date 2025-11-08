const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getBuyerReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  addSellerResponse,
  getReviewableProducts,
} = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', getProductReviews); // Get reviews for a product (optionally authenticated)

// Protected routes (requires authentication)
router.use(authenticateToken);

router.post('/', createReview); // Create a review
router.get('/my-reviews', getBuyerReviews); // Get buyer's reviews
router.get('/reviewable-products', getReviewableProducts); // Get products buyer can review
router.put('/:reviewId', updateReview); // Update a review
router.delete('/:reviewId', deleteReview); // Delete a review
router.post('/:reviewId/helpful', markReviewHelpful); // Mark review as helpful
router.post('/:reviewId/seller-response', addSellerResponse); // Seller responds to review

module.exports = router;
