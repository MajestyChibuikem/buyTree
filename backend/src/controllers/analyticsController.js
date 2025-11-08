const db = require('../config/database');

// Get seller analytics
const getSellerAnalytics = async (req, res) => {
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
        message: 'Not a seller',
      });
    }

    const sellerId = sellerResult.rows[0].id;

    // 1. Overview Stats
    const overviewResult = await db.query(
      `SELECT
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.seller_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as average_order_value,
        COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'processing' THEN o.id END) as processing_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.id END) as shipped_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as delivered_orders
      FROM orders o
      WHERE o.seller_id = $1 AND o.payment_status = 'paid'`,
      [sellerId]
    );

    // 2. Revenue by day (last 30 days)
    const revenueByDayResult = await db.query(
      `SELECT
        DATE(o.created_at) as date,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.seller_amount), 0) as revenue
      FROM orders o
      WHERE o.seller_id = $1
        AND o.payment_status = 'paid'
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC`,
      [sellerId]
    );

    // 3. Top selling products
    const topProductsResult = await db.query(
      `SELECT
        p.id,
        p.name,
        p.slug,
        p.price,
        p.quantity_available,
        p.image_urls,
        COUNT(oi.id) as units_sold,
        COALESCE(SUM(oi.subtotal), 0) as revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE p.seller_id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY units_sold DESC, revenue DESC
      LIMIT 10`,
      [sellerId]
    );

    // 4. Low stock products (stock < 5)
    const lowStockResult = await db.query(
      `SELECT
        id,
        name,
        slug,
        quantity_available,
        price,
        image_urls
      FROM products
      WHERE seller_id = $1
        AND deleted_at IS NULL
        AND quantity_available < 5
      ORDER BY quantity_available ASC
      LIMIT 10`,
      [sellerId]
    );

    // 5. Recent orders summary
    const recentOrdersResult = await db.query(
      `SELECT
        o.id,
        o.order_number,
        o.total_amount,
        o.seller_amount,
        o.status,
        o.created_at,
        u.first_name,
        u.last_name
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = $1
      ORDER BY o.created_at DESC
      LIMIT 10`,
      [sellerId]
    );

    // 6. This month vs last month comparison
    const monthComparisonResult = await db.query(
      `SELECT
        COUNT(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as current_month_orders,
        COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN o.seller_amount ELSE 0 END), 0) as current_month_revenue,
        COUNT(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                    AND o.created_at < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as last_month_orders,
        COALESCE(SUM(CASE WHEN o.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                          AND o.created_at < DATE_TRUNC('month', CURRENT_DATE) THEN o.seller_amount ELSE 0 END), 0) as last_month_revenue
      FROM orders o
      WHERE o.seller_id = $1 AND o.payment_status = 'paid'`,
      [sellerId]
    );

    // Calculate growth percentages
    const monthComparison = monthComparisonResult.rows[0];
    const orderGrowth = monthComparison.last_month_orders > 0
      ? ((monthComparison.current_month_orders - monthComparison.last_month_orders) / monthComparison.last_month_orders * 100)
      : 0;
    const revenueGrowth = parseFloat(monthComparison.last_month_revenue) > 0
      ? ((parseFloat(monthComparison.current_month_revenue) - parseFloat(monthComparison.last_month_revenue)) / parseFloat(monthComparison.last_month_revenue) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          ...overviewResult.rows[0],
          order_growth_percentage: orderGrowth,
          revenue_growth_percentage: revenueGrowth,
        },
        revenue_by_day: revenueByDayResult.rows,
        top_products: topProductsResult.rows,
        low_stock_products: lowStockResult.rows,
        recent_orders: recentOrdersResult.rows,
      },
    });
  } catch (error) {
    console.error('Get seller analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
};

module.exports = {
  getSellerAnalytics,
};
