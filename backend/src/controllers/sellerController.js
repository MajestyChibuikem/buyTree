const db = require('../config/database');
const axios = require('axios');

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const paystackAxios = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Register as a seller
const registerSeller = async (req, res) => {
  try {
    const { shopName, categories, bankCode, accountNumber } = req.body;
    const userId = req.user.id;

    // Validation
    if (!shopName || !categories || !bankCode || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: shopName, categories, bankCode, accountNumber',
      });
    }

    if (!Array.isArray(categories) || categories.length === 0 || categories.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Please select 1-3 categories',
      });
    }

    // Check if user is already a seller
    const existingSeller = await db.query(
      'SELECT id FROM sellers WHERE user_id = $1',
      [userId]
    );

    if (existingSeller.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as a seller',
      });
    }

    // Step 1: Verify bank account with Paystack
    let accountName;

    // Skip verification for test bank code 001 (Paystack test mode)
    if (bankCode === '001') {
      accountName = 'Test Account';
      console.log('Using Paystack test bank code - skipping verification');
    } else {
      try {
        const verifyResponse = await paystackAxios.get(
          `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
        );
        accountName = verifyResponse.data.data.account_name;
      } catch (error) {
        console.error('Paystack verification error:', error.response?.data || error.message);

        // If daily limit exceeded, suggest using test bank code
        if (error.response?.data?.message?.includes('daily limit')) {
          return res.status(400).json({
            success: false,
            message: 'Daily verification limit reached. Please use bank code "001" for testing, or try again tomorrow.',
            error: error.response?.data?.message,
          });
        }

        return res.status(400).json({
          success: false,
          message: 'Could not verify bank account. Please check your account number and bank.',
          error: error.response?.data?.message || 'Bank verification failed',
        });
      }
    }

    // Step 2: Create Paystack subaccount (95% to seller, 5% to platform)
    let subaccountCode;

    // Skip subaccount creation for test bank code 001
    if (bankCode === '001') {
      subaccountCode = 'ACCT_test_' + Date.now(); // Generate fake subaccount code for testing
      console.log('Using test bank - skipping Paystack subaccount creation');
    } else {
      try {
        const subaccountResponse = await paystackAxios.post('/subaccount', {
          business_name: shopName,
          settlement_bank: bankCode,
          account_number: accountNumber,
          percentage_charge: 5, // Platform takes 5%
          description: `BuyTree seller: ${shopName}`,
        });
        subaccountCode = subaccountResponse.data.data.subaccount_code;
      } catch (error) {
        console.error('Paystack subaccount error:', error.response?.data || error.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment account. Please try again.',
          error: error.response?.data?.message || 'Subaccount creation failed',
        });
      }
    }

    // Step 3: Create shop slug (URL-friendly version of shop name)
    const baseSlug = shopName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug is unique, append number if needed
    let shopSlug = baseSlug;
    let counter = 1;
    while (true) {
      const slugCheck = await db.query(
        'SELECT id FROM sellers WHERE shop_slug = $1',
        [shopSlug]
      );
      if (slugCheck.rows.length === 0) break;
      shopSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Step 4: Insert seller into database
    const result = await db.query(
      `INSERT INTO sellers
       (user_id, shop_name, shop_slug, categories, bank_code, account_number,
        account_name, paystack_subaccount_code, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, shop_name, shop_slug, categories`,
      [userId, shopName, shopSlug, categories, bankCode, accountNumber, accountName, subaccountCode]
    );

    // Step 5: Update user role to seller
    await db.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['seller', userId]
    );

    res.status(201).json({
      success: true,
      message: 'Seller account created successfully',
      data: {
        seller: result.rows[0],
        accountName,
        shopUrl: `/shop/${shopSlug}`,
      },
    });
  } catch (error) {
    console.error('Register seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register as seller',
      error: error.message,
    });
  }
};

// Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        s.id, s.shop_name, s.shop_slug, s.categories, s.total_sales,
        s.rating, s.total_orders, s.is_verified, s.created_at,
        s.account_name, s.bank_code
      FROM sellers s
      WHERE s.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found',
      });
    }

    res.json({
      success: true,
      data: { seller: result.rows[0] },
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller profile',
      error: error.message,
    });
  }
};

// Get seller by shop slug (public)
const getSellerBySlug = async (req, res) => {
  try {
    const { shopSlug } = req.params;

    const result = await db.query(
      `SELECT
        s.id, s.shop_name, s.shop_slug, s.shop_description, s.shop_logo_url,
        s.categories, s.total_sales, s.rating, s.is_verified, s.created_at,
        COALESCE(COUNT(DISTINCT o.id), 0) as total_orders
      FROM sellers s
      LEFT JOIN orders o ON s.id = o.seller_id AND o.payment_status = 'paid'
      WHERE s.shop_slug = $1
      GROUP BY s.id`,
      [shopSlug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    res.json({
      success: true,
      data: { seller: result.rows[0] },
    });
  } catch (error) {
    console.error('Get seller by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop',
      error: error.message,
    });
  }
};

// Get list of Nigerian banks from Paystack
const getBanks = async (req, res) => {
  try {
    const response = await paystackAxios.get('/bank?country=nigeria');

    // Add test bank to the beginning of the list for development
    const banks = [
      {
        id: 0,
        name: '🧪 TEST BANK (Use for Development)',
        code: '001',
        longcode: '001',
        type: 'test',
        active: true,
      },
      ...response.data.data,
    ];

    res.json({
      success: true,
      data: { banks },
    });
  } catch (error) {
    console.error('Get banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banks',
      error: error.message,
    });
  }
};

// Get all sellers/shops for homepage
const getAllSellers = async (req, res) => {
  try {
    const { category, verified } = req.query;

    let query = `
      SELECT
        s.id, s.shop_name, s.shop_slug, s.shop_description, s.shop_logo_url,
        s.categories, s.total_sales, s.rating, s.is_verified, s.created_at,
        COALESCE(COUNT(DISTINCT o.id), 0) as total_orders,
        (
          SELECT json_agg(json_build_object('id', p.id, 'name', p.name, 'price', p.price, 'image_urls', p.image_urls))
          FROM (
            SELECT id, name, price, image_urls
            FROM products
            WHERE seller_id = s.id AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 2
          ) p
        ) as sample_products
      FROM sellers s
      LEFT JOIN orders o ON s.id = o.seller_id AND o.payment_status = 'paid'
    `;

    const conditions = [];
    const values = [];

    // Filter by category if provided
    if (category && category !== 'All') {
      conditions.push(`$${values.length + 1} = ANY(s.categories)`);
      values.push(category);
    }

    // Filter by verification status if provided
    if (verified === 'true') {
      conditions.push('s.is_verified = true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY s.id
      ORDER BY s.is_verified DESC, s.created_at DESC
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      data: { shops: result.rows },
    });
  } catch (error) {
    console.error('Get all sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops',
      error: error.message,
    });
  }
};

module.exports = {
  registerSeller,
  getSellerProfile,
  getSellerBySlug,
  getAllSellers,
  getBanks,
};
