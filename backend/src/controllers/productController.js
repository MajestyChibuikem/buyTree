const db = require('../config/database');

// Create a new product (sellers only)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      quantityAvailable,
      category,
      imageUrls,
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required',
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0',
      });
    }

    // Check if user is a seller
    const sellerResult = await db.query(
      'SELECT id, categories FROM sellers WHERE user_id = $1',
      [userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can create products. Please register as a seller first.',
      });
    }

    const seller = sellerResult.rows[0];

    // Verify category matches one of seller's categories
    if (!seller.categories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Product category must be one of your shop categories: ${seller.categories.join(', ')}`,
      });
    }

    // Generate slug from product name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure slug is unique for this seller
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const slugCheck = await db.query(
        'SELECT id FROM products WHERE seller_id = $1 AND slug = $2',
        [seller.id, slug]
      );
      if (slugCheck.rows.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Insert product
    const result = await db.query(
      `INSERT INTO products
       (seller_id, name, slug, description, price, quantity_available, category, image_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, slug, description, price, quantity_available, category, image_urls, created_at`,
      [seller.id, name, slug, description || null, price, quantityAvailable || 0, category, imageUrls || []]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: result.rows[0] },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

// Get all products (with filters)
const getProducts = async (req, res) => {
  try {
    const {
      category,
      sellerId,
      search,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0,
    } = req.query;

    let query = `
      SELECT
        p.id, p.name, p.description, p.price, p.quantity_available,
        p.category, p.image_urls, p.created_at,
        s.id as seller_id, s.shop_name, s.shop_slug, s.rating
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE p.deleted_at IS NULL AND p.quantity_available > 0
    `;
    const params = [];
    let paramCount = 0;

    // Add filters
    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    if (sellerId) {
      paramCount++;
      query += ` AND p.seller_id = $${paramCount}`;
      params.push(sellerId);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(minPrice);
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(maxPrice);
    }

    // Order by most recent
    query += ' ORDER BY p.created_at DESC';

    // Pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        products: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        p.id, p.name, p.description, p.price, p.quantity_available,
        p.category, p.image_urls, p.created_at,
        s.id as seller_id, s.shop_name, s.shop_slug, s.rating
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Track product view for analytics
    await db.query(
      `INSERT INTO product_analytics (product_id, date, views)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (product_id, date)
       DO UPDATE SET views = product_analytics.views + 1`,
      [id]
    );

    res.json({
      success: true,
      data: { product: result.rows[0] },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
};

// Update product (seller's own products only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      quantityAvailable,
      category,
      imageUrls,
    } = req.body;
    const userId = req.user.id;

    // Get seller ID
    const sellerResult = await db.query(
      'SELECT id, categories FROM sellers WHERE user_id = $1',
      [userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can update products',
      });
    }

    const seller = sellerResult.rows[0];

    // Check if product belongs to this seller
    const productCheck = await db.query(
      'SELECT id FROM products WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL',
      [id, seller.id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to update it',
      });
    }

    // Verify category if being changed
    if (category && !seller.categories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Product category must be one of your shop categories: ${seller.categories.join(', ')}`,
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than 0',
        });
      }
      paramCount++;
      updates.push(`price = $${paramCount}`);
      params.push(price);
    }

    if (quantityAvailable !== undefined) {
      paramCount++;
      updates.push(`quantity_available = $${paramCount}`);
      params.push(quantityAvailable);
    }

    if (category !== undefined) {
      paramCount++;
      updates.push(`category = $${paramCount}`);
      params.push(category);
    }

    if (imageUrls !== undefined) {
      paramCount++;
      updates.push(`image_urls = $${paramCount}`);
      params.push(imageUrls);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    paramCount++;
    params.push(id);

    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, price, quantity_available, category, image_urls, updated_at
    `;

    const result = await db.query(query, params);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: result.rows[0] },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

// Delete product (soft delete - seller's own products only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get seller ID
    const sellerResult = await db.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can delete products',
      });
    }

    const seller = sellerResult.rows[0];

    // Soft delete
    const result = await db.query(
      `UPDATE products
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, seller.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
};

// Get seller's own products
const getMyProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get seller ID
    const sellerResult = await db.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [userId]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can view their products',
      });
    }

    const seller = sellerResult.rows[0];

    const result = await db.query(
      `SELECT
        id, name, description, price, quantity_available,
        category, image_urls, created_at, updated_at
      FROM products
      WHERE seller_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC`,
      [seller.id]
    );

    res.json({
      success: true,
      data: { products: result.rows },
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

// Get products by shop slug (public)
const getProductsByShopSlug = async (req, res) => {
  try {
    const { shopSlug } = req.params;
    const {
      category,
      search,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0,
    } = req.query;

    // First, get the seller by shop slug
    const sellerResult = await db.query(
      'SELECT id FROM sellers WHERE shop_slug = $1',
      [shopSlug]
    );

    if (sellerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    const sellerId = sellerResult.rows[0].id;

    // Build query for products
    let query = `
      SELECT
        p.id, p.name, p.slug, p.description, p.price, p.quantity_available,
        p.category, p.image_urls, p.created_at
      FROM products p
      WHERE p.seller_id = $1 AND p.deleted_at IS NULL AND p.quantity_available > 0
    `;
    const params = [sellerId];
    let paramCount = 1;

    // Add filters
    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(minPrice);
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(maxPrice);
    }

    // Order by most recent
    query += ' ORDER BY p.created_at DESC';

    // Pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        products: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get products by shop slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop products',
      error: error.message,
    });
  }
};

// Search products across all shops
const searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sort = 'relevance' } = req.query;

    // Build search query
    let query = `
      SELECT
        p.id, p.name, p.slug, p.description, p.price, p.quantity_available,
        p.category, p.image_urls, p.created_at,
        s.id as seller_id, s.shop_name, s.shop_slug, s.rating as shop_rating, s.is_verified
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE p.deleted_at IS NULL AND p.quantity_available > 0
    `;

    const params = [];
    let paramCount = 0;

    // Search by query (product name or description)
    if (q && q.trim()) {
      paramCount++;
      query += ` AND (
        LOWER(p.name) LIKE LOWER($${paramCount}) OR
        LOWER(p.description) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${q.trim()}%`);
    }

    // Filter by category
    if (category && category !== 'All') {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    // Filter by min price
    if (minPrice) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
    }

    // Filter by max price
    if (maxPrice) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
    }

    // Sorting - Always prioritize verified sellers first
    switch (sort) {
      case 'price_low':
        query += ' ORDER BY s.is_verified DESC, p.price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY s.is_verified DESC, p.price DESC';
        break;
      case 'newest':
        query += ' ORDER BY s.is_verified DESC, p.created_at DESC';
        break;
      case 'relevance':
      default:
        // If search query exists, sort by verified first, then relevance
        if (q && q.trim()) {
          query += ` ORDER BY
            s.is_verified DESC,
            CASE
              WHEN LOWER(p.name) LIKE LOWER($${params.length + 1}) THEN 1
              ELSE 2
            END,
            p.created_at DESC
          `;
          params.push(`%${q.trim()}%`);
        } else {
          query += ' ORDER BY s.is_verified DESC, p.created_at DESC';
        }
        break;
    }

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        products: result.rows,
        count: result.rows.length,
        query: q || '',
      },
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductsByShopSlug,
  searchProducts,
};
