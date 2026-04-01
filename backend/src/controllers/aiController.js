const aiService = require('../services/aiService');
const { Logger } = require('../utils/logger');

const logger = new Logger('AIController');

// POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { messages, shopSlug } = req.body;
    const userId = req.user?.id || null;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'messages array is required' });
    }

    const result = await aiService.chat(messages, userId, shopSlug);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('chat endpoint error', error);
    res.status(500).json({ success: false, message: 'Chat unavailable' });
  }
};

// POST /api/ai/generate-description
const generateDescription = async (req, res) => {
  try {
    const { name, price, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'name and category are required' });
    }

    // Get seller's shop name for context
    const db = require('../config/database');
    const sellerResult = await db.query(
      'SELECT shop_name FROM sellers WHERE user_id = $1',
      [req.user.id]
    );
    const shopName = sellerResult.rows[0]?.shop_name || null;

    const result = await aiService.generateDescription({ name, price, category, shopName });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('generateDescription endpoint error', error);
    res.status(500).json({ success: false, message: 'Description generation unavailable' });
  }
};

// POST /api/ai/suggest-category
const suggestCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    const result = await aiService.suggestCategory({ name, description });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('suggestCategory endpoint error', error);
    res.status(500).json({ success: false, message: 'Category suggestion unavailable' });
  }
};

// POST /api/ai/triage-dispute  (internal, called from disputeController)
const triageDispute = async (req, res) => {
  try {
    const { disputeId } = req.body;

    if (!disputeId) {
      return res.status(400).json({ success: false, message: 'disputeId is required' });
    }

    const result = await aiService.triageDispute(disputeId);
    res.json({ success: true, data: { triage: result } });
  } catch (error) {
    logger.error('triageDispute endpoint error', error);
    res.status(500).json({ success: false, message: 'Dispute triage unavailable' });
  }
};

module.exports = { chat, generateDescription, suggestCategory, triageDispute };
