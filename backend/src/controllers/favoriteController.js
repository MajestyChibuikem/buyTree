const db = require('../config/database');

// Add product to favorites
const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Validate product exists
    const productCheck = await db.query(
      'SELECT id FROM products WHERE id = $1 AND deleted_at IS NULL',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Add to favorites (will ignore if already exists due to UNIQUE constraint)
    await db.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING',
      [userId, productId]
    );

    res.json({
      success: true,
      message: 'Product added to favorites',
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favorite',
      error: error.message,
    });
  }
};

// Remove product from favorites
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    await db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({
      success: true,
      message: 'Product removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favorite',
      error: error.message,
    });
  }
};

// Get user's favorites
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        p.id, p.name, p.slug, p.description, p.price, p.quantity_available,
        p.category, p.image_urls, p.favorites_count, p.created_at,
        s.id as seller_id, s.shop_name, s.shop_slug, s.rating as shop_rating,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(r.id) as review_count,
        f.created_at as favorited_at
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE f.user_id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, s.id, s.shop_name, s.shop_slug, s.rating, f.created_at
      ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        favorites: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favorites',
      error: error.message,
    });
  }
};

// Check if product is favorited by user
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await db.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    res.json({
      success: true,
      data: {
        isFavorited: result.rows.length > 0,
      },
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message,
    });
  }
};

// Get favorite status for multiple products (batch check)
const batchCheckFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productIds } = req.body; // Array of product IDs

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'productIds must be a non-empty array',
      });
    }

    const result = await db.query(
      'SELECT product_id FROM favorites WHERE user_id = $1 AND product_id = ANY($2::int[])',
      [userId, productIds]
    );

    const favoritedIds = result.rows.map(row => row.product_id);

    res.json({
      success: true,
      data: {
        favoritedProductIds: favoritedIds,
      },
    });
  } catch (error) {
    console.error('Batch check favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message,
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavorite,
  batchCheckFavorites,
};
