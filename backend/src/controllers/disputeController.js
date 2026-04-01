const db = require('../config/database');
const aiService = require('../services/aiService');
const { Logger } = require('../utils/logger');

const logger = new Logger('DisputeController');

// POST /api/disputes
const createDispute = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { orderId, disputeType, description, evidenceUrls } = req.body;

    if (!orderId || !disputeType || !description) {
      return res.status(400).json({ success: false, message: 'orderId, disputeType, and description are required' });
    }

    // Verify the order belongs to this buyer and is eligible for dispute
    const orderCheck = await db.query(
      `SELECT o.id, o.seller_id, o.status, o.can_dispute, o.delivered_at
       FROM orders o
       WHERE o.id = $1 AND o.buyer_id = $2`,
      [orderId, buyerId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderCheck.rows[0];

    if (!order.can_dispute) {
      return res.status(403).json({ success: false, message: 'This order is not eligible for a dispute' });
    }

    // Check no existing dispute for this order
    const existing = await db.query('SELECT id FROM disputes WHERE order_id = $1', [orderId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A dispute already exists for this order' });
    }

    const result = await db.query(
      `INSERT INTO disputes (order_id, buyer_id, seller_id, dispute_type, description, evidence_urls)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [orderId, buyerId, order.seller_id, disputeType, description, evidenceUrls || null]
    );

    const dispute = result.rows[0];

    // Fire-and-forget: triage the dispute with AI
    setImmediate(() => {
      aiService.triageDispute(dispute.id).catch(() => {});
    });

    res.status(201).json({ success: true, message: 'Dispute filed successfully', data: { dispute } });
  } catch (error) {
    logger.error('createDispute error', error);
    res.status(500).json({ success: false, message: 'Failed to file dispute', error: error.message });
  }
};

// GET /api/disputes/my  (buyer's disputes)
const getBuyerDisputes = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const result = await db.query(
      `SELECT d.*, o.order_number, o.total_amount, s.shop_name
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       JOIN sellers s ON d.seller_id = s.id
       WHERE d.buyer_id = $1
       ORDER BY d.created_at DESC`,
      [buyerId]
    );
    res.json({ success: true, data: { disputes: result.rows } });
  } catch (error) {
    logger.error('getBuyerDisputes error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
  }
};

// GET /api/disputes/:id  (buyer or admin)
const getDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await db.query(
      `SELECT d.*, o.order_number, o.total_amount, o.status as order_status,
              s.shop_name, u.first_name as buyer_first_name
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       JOIN sellers s ON d.seller_id = s.id
       JOIN users u ON d.buyer_id = u.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    const dispute = result.rows[0];

    // Only the buyer who filed it or an admin can view
    if (userRole !== 'admin' && dispute.buyer_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: { dispute } });
  } catch (error) {
    logger.error('getDispute error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dispute' });
  }
};

// PUT /api/disputes/:id/seller-response  (seller responds)
const addSellerResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const { response } = req.body;

    if (!response?.trim()) {
      return res.status(400).json({ success: false, message: 'Response is required' });
    }

    // Verify this dispute belongs to this seller
    const check = await db.query(
      'SELECT id FROM disputes WHERE id = $1 AND seller_id = (SELECT id FROM sellers WHERE user_id = $2)',
      [id, sellerId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispute not found or unauthorized' });
    }

    const result = await db.query(
      `UPDATE disputes SET seller_response = $1, seller_response_at = NOW(), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [response, id]
    );

    res.json({ success: true, message: 'Response submitted', data: { dispute: result.rows[0] } });
  } catch (error) {
    logger.error('addSellerResponse error', error);
    res.status(500).json({ success: false, message: 'Failed to submit response' });
  }
};

// ── Admin endpoints ────────────────────────────────────────────────────────────

// GET /api/admin/disputes
const adminListDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    if (status) {
      params.push(status);
      where = `WHERE d.status = $${params.length}`;
    }

    const result = await db.query(
      `SELECT d.*, o.order_number, o.total_amount, s.shop_name,
              u.first_name as buyer_first_name, u.last_name as buyer_last_name
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       JOIN sellers s ON d.seller_id = s.id
       JOIN users u ON d.buyer_id = u.id
       ${where}
       ORDER BY d.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ success: true, data: { disputes: result.rows } });
  } catch (error) {
    logger.error('adminListDisputes error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
  }
};

// GET /api/admin/disputes/:id/triage
const adminGetTriage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT ai_triage, ai_triage_at FROM disputes WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('adminGetTriage error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch triage' });
  }
};

// PUT /api/admin/disputes/:id/resolve
const adminResolveDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminDecision, resolutionType, refundAmount, resolvedInFavor } = req.body;

    const result = await db.query(
      `UPDATE disputes
       SET admin_decision = $1, resolution_type = $2, refund_amount = $3,
           resolved_in_favor = $4, status = 'resolved', resolved_at = NOW(), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [adminDecision, resolutionType, refundAmount || 0, resolvedInFavor, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    res.json({ success: true, message: 'Dispute resolved', data: { dispute: result.rows[0] } });
  } catch (error) {
    logger.error('adminResolveDispute error', error);
    res.status(500).json({ success: false, message: 'Failed to resolve dispute' });
  }
};

module.exports = {
  createDispute,
  getBuyerDisputes,
  getDispute,
  addSellerResponse,
  adminListDisputes,
  adminGetTriage,
  adminResolveDispute,
};
