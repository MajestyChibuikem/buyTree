const db = require('../config/database');

// Create a review
const createReview = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { productId, orderId, rating, title, comment, images } = req.body;

    // Validate required fields
    if (!productId || !orderId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Order ID, and rating are required',
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Verify the purchase
    const orderCheck = await db.query(
      `SELECT o.id, o.buyer_id, oi.product_id
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1 AND o.buyer_id = $2 AND oi.product_id = $3 AND o.payment_status = 'paid'`,
      [orderId, buyerId, productId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased',
      });
    }

    // Check if review already exists for this order
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND buyer_id = $2 AND order_id = $3',
      [productId, buyerId, orderId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order',
      });
    }

    // Create review
    const result = await db.query(
      `INSERT INTO reviews (product_id, buyer_id, order_id, rating, title, comment, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [productId, buyerId, orderId || null, rating, title || null, comment || null, images || null]
    );

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: result.rows[0] },
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = 'recent' } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let whereClause = 'WHERE r.product_id = $1';
    const queryParams = [productId];

    if (rating) {
      queryParams.push(rating);
      whereClause += ` AND r.rating = $${queryParams.length}`;
    }

    // Determine sort order
    let orderClause = 'ORDER BY r.created_at DESC'; // recent (default)
    if (sort === 'helpful') {
      orderClause = 'ORDER BY r.helpful_count DESC, r.created_at DESC';
    } else if (sort === 'rating_high') {
      orderClause = 'ORDER BY r.rating DESC, r.created_at DESC';
    } else if (sort === 'rating_low') {
      orderClause = 'ORDER BY r.rating ASC, r.created_at DESC';
    }

    // Get reviews with buyer info
    const reviewsQuery = `
      SELECT
        r.*,
        u.first_name,
        u.last_name,
        CASE WHEN rh.user_id IS NOT NULL THEN true ELSE false END as marked_helpful_by_user
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      LEFT JOIN review_helpful rh ON r.id = rh.review_id AND rh.user_id = $${queryParams.length + 1}
      ${whereClause}
      ${orderClause}
      LIMIT $${queryParams.length + 2} OFFSET $${queryParams.length + 3}
    `;

    queryParams.push(req.user?.id || 0, limit, offset);

    const reviews = await db.query(reviewsQuery, queryParams);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM reviews r ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams.slice(0, whereClause.includes('$2') ? 2 : 1));
    const totalReviews = parseInt(countResult.rows[0].count);

    // Get rating breakdown
    const ratingBreakdown = await db.query(
      `SELECT rating, COUNT(*) as count
       FROM reviews
       WHERE product_id = $1
       GROUP BY rating
       ORDER BY rating DESC`,
      [productId]
    );

    res.json({
      success: true,
      data: {
        reviews: reviews.rows,
        pagination: {
          total: totalReviews,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalReviews / limit),
        },
        ratingBreakdown: ratingBreakdown.rows,
      },
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
};

// Get buyer's reviews
const getBuyerReviews = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await db.query(
      `SELECT
        r.*,
        p.name as product_name,
        p.image_urls as product_images
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.buyer_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3`,
      [buyerId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM reviews WHERE buyer_id = $1',
      [buyerId]
    );

    res.json({
      success: true,
      data: {
        reviews: reviews.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get buyer reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;

    // Check if review exists and belongs to buyer
    const reviewCheck = await db.query(
      'SELECT id FROM reviews WHERE id = $1 AND buyer_id = $2',
      [reviewId, buyerId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized',
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (rating !== undefined) {
      updates.push(`rating = $${paramCount++}`);
      values.push(rating);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (comment !== undefined) {
      updates.push(`comment = $${paramCount++}`);
      values.push(comment);
    }
    if (images !== undefined) {
      updates.push(`images = $${paramCount++}`);
      values.push(images);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(reviewId);

    const result = await db.query(
      `UPDATE reviews
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: { review: result.rows[0] },
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { reviewId } = req.params;

    const result = await db.query(
      'DELETE FROM reviews WHERE id = $1 AND buyer_id = $2 RETURNING id',
      [reviewId, buyerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized',
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

// Mark review as helpful
const markReviewHelpful = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;

    // Check if already marked
    const existing = await db.query(
      'SELECT id FROM review_helpful WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (existing.rows.length > 0) {
      // Remove helpful mark
      await db.query(
        'DELETE FROM review_helpful WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );

      return res.json({
        success: true,
        message: 'Helpful mark removed',
        data: { marked: false },
      });
    } else {
      // Add helpful mark
      await db.query(
        'INSERT INTO review_helpful (review_id, user_id) VALUES ($1, $2)',
        [reviewId, userId]
      );

      return res.json({
        success: true,
        message: 'Review marked as helpful',
        data: { marked: true },
      });
    }
  } catch (error) {
    console.error('Mark review helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message,
    });
  }
};

// Seller response to review
const addSellerResponse = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { reviewId } = req.params;
    const { response } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Response is required',
      });
    }

    // Check if review is for seller's product
    const reviewCheck = await db.query(
      `SELECT r.id
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.id = $1 AND p.seller_id = $2`,
      [reviewId, sellerId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized',
      });
    }

    // Add seller response
    const result = await db.query(
      `UPDATE reviews
       SET seller_response = $1,
           seller_response_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [response, reviewId]
    );

    res.json({
      success: true,
      message: 'Response added successfully',
      data: { review: result.rows[0] },
    });
  } catch (error) {
    console.error('Add seller response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message,
    });
  }
};

// Get reviewable products for a buyer (products they bought but haven't reviewed)
const getReviewableProducts = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const products = await db.query(
      `SELECT DISTINCT
        oi.product_id,
        p.name as product_name,
        p.image_urls as product_images,
        o.id as order_id,
        o.order_number,
        o.delivered_at
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.buyer_id = $1
        AND o.payment_status = 'paid'
        AND o.status = 'delivered'
        AND NOT EXISTS (
          SELECT 1 FROM reviews r
          WHERE r.product_id = oi.product_id
            AND r.buyer_id = $1
            AND r.order_id = o.id
        )
      ORDER BY o.delivered_at DESC`,
      [buyerId]
    );

    res.json({
      success: true,
      data: { products: products.rows },
    });
  } catch (error) {
    console.error('Get reviewable products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviewable products',
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getBuyerReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  addSellerResponse,
  getReviewableProducts,
};
