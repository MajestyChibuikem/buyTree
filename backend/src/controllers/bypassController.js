const db = require('../config/database');
const { Logger } = require('../utils/logger');

const logger = new Logger('BypassController');

// GET /api/admin/bypass-flags
const adminListBypassFlags = async (req, res) => {
  try {
    const { risk, status = 'open', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    const conditions = [];

    if (status) { params.push(status); conditions.push(`bf.status = $${params.length}`); }
    if (risk)   { params.push(risk);   conditions.push(`bf.risk_level = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT bf.*,
              s.shop_name,
              u.first_name as buyer_first_name, u.last_name as buyer_last_name
       FROM bypass_flags bf
       LEFT JOIN sellers s ON bf.seller_id = s.id
       LEFT JOIN users u ON bf.buyer_id = u.id
       ${where}
       ORDER BY
         CASE bf.risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         bf.ai_analysed_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ success: true, data: { flags: result.rows } });
  } catch (error) {
    logger.error('adminListBypassFlags error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bypass flags' });
  }
};

// PUT /api/admin/bypass-flags/:id
const adminUpdateBypassFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!['dismissed', 'actioned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be dismissed or actioned' });
    }

    const result = await db.query(
      `UPDATE bypass_flags
       SET status = $1, resolved_at = NOW(), resolved_by = $2
       WHERE id = $3 RETURNING *`,
      [status, adminId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Flag not found' });
    }

    res.json({ success: true, data: { flag: result.rows[0] } });
  } catch (error) {
    logger.error('adminUpdateBypassFlag error', error);
    res.status(500).json({ success: false, message: 'Failed to update flag' });
  }
};

module.exports = { adminListBypassFlags, adminUpdateBypassFlag };
