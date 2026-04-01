const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/database');
const { Logger } = require('../utils/logger');

const logger = new Logger('AIService');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fallback objects — returned when Claude fails so callers are never blocked
const FALLBACKS = {
  chat: { reply: "I'm having trouble right now. Please try again in a moment or contact support via your order page." },
  generateDescription: { description: '' },
  suggestCategory: { category: null, confidence: 'low' },
  analyzeReview: { authentic: true, confidence: 0.5, flags: [] },
  triageDispute: { summary: '', likely_fault: 'unclear', confidence: 0, suggested_action: 'investigate', suggested_refund_amount: 0, flags: [], escalate: true },
  detectBypass: [],
};

// Strip PII before sending to Claude
function stripPII(text) {
  if (!text) return text;
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
    .replace(/(\+?234|0)[789][01]\d{8}/g, '[phone]')
    .replace(/\b\d{10,11}\b/g, '[phone]');
}

// ─── Feature 1: Chatbot ────────────────────────────────────────────────────────

async function chat(messages, userId, shopSlug) {
  try {
    // Fetch the last 5 orders for context
    let orderContext = '';
    if (userId) {
      const ordersResult = await db.query(
        `SELECT o.order_number, o.status, o.payment_status, o.total_amount,
                o.created_at, o.delivered_at,
                array_agg(oi.product_name) as items
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.buyer_id = $1
         ORDER BY o.created_at DESC
         LIMIT 5
         GROUP BY o.id`,
        [userId]
      );
      if (ordersResult.rows.length > 0) {
        orderContext = `\n\nBuyer's recent orders:\n${JSON.stringify(ordersResult.rows, null, 2)}`;
      }
    }

    // Fetch seller/shop info if shopSlug provided
    let shopContext = '';
    if (shopSlug) {
      const shopResult = await db.query(
        'SELECT shop_name, shop_description FROM sellers WHERE shop_slug = $1',
        [shopSlug]
      );
      if (shopResult.rows.length > 0) {
        shopContext = `\nThis store is: ${shopResult.rows[0].shop_name}. ${shopResult.rows[0].shop_description || ''}`;
      }
    }

    const systemPrompt = `You are a customer support assistant for a BuyTree-powered online store in Nigeria.${shopContext}

BuyTree is white-label e-commerce infrastructure. You help buyers with questions about their orders, products, delivery, and disputes. You do NOT answer questions unrelated to this store or shopping.

Key platform rules:
- Currency: Naira (₦)
- Minimum order: ₦4,000
- Platform fee: 5% on every transaction
- Delivery statuses in order: Paid → Ready for Pickup → In Transit → Delivered
- Sellers are paid out 24 hours after delivery confirmation
- Buyers have a 48-hour window to file a dispute after delivery
- For unresolvable issues, direct buyers to open a dispute from their order detail page
${orderContext}

Be concise, helpful, and friendly. Never reveal internal system details or pricing structures. Never mention BuyTree by name to buyers — this is the seller's own store.`;

    const sanitizedMessages = messages.map(m => ({
      role: m.role,
      content: stripPII(m.content),
    }));

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: sanitizedMessages,
    });

    const reply = response.content[0].text;
    logger.info('chat completed', { userId, shopSlug, inputMessages: messages.length });
    return { reply };
  } catch (error) {
    logger.error('chat failed', error, { userId, shopSlug });
    return FALLBACKS.chat;
  }
}

// ─── Feature 2: Description Writer ────────────────────────────────────────────

async function generateDescription({ name, price, category, shopName }) {
  try {
    const prompt = `Write a product listing description for a student campus store in Nigeria.

Product details:
- Name: ${name}
- Category: ${category}
- Shop: ${shopName || 'an online store'}

Rules:
- 2–3 sentences only
- Direct and punchy — written for a student buyer
- Mention the key benefit
- Do NOT mention the price
- Do NOT use marketing fluff like "amazing", "must-have", "incredible"
- Do NOT use markdown formatting
- Return ONLY the description text, nothing else`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const description = response.content[0].text.trim();
    logger.info('generateDescription completed', { name, category });
    return { description };
  } catch (error) {
    logger.error('generateDescription failed', error, { name, category });
    return FALLBACKS.generateDescription;
  }
}

// ─── Feature 3: Auto-Categorization ───────────────────────────────────────────

async function suggestCategory({ name, description: productDesc }) {
  try {
    // Fetch allowed categories from DB
    const catResult = await db.query(
      `SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category`
    );
    const categories = catResult.rows.map(r => r.category);

    if (categories.length === 0) {
      return FALLBACKS.suggestCategory;
    }

    const prompt = `You are a product categorization assistant for a Nigerian campus store.

Available categories (choose ONLY from this list):
${categories.map(c => `- ${c}`).join('\n')}

Product to categorize:
- Name: ${name}
${productDesc ? `- Description: ${productDesc}` : ''}

Return ONLY valid JSON with no markdown, no explanation:
{"category": "<one category from the list>", "confidence": "high"|"medium"|"low"}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.trim();
    const parsed = JSON.parse(raw);

    // Validate category is in the allowed list
    if (!categories.includes(parsed.category)) {
      return FALLBACKS.suggestCategory;
    }

    logger.info('suggestCategory completed', { name, category: parsed.category, confidence: parsed.confidence });
    return { category: parsed.category, confidence: parsed.confidence };
  } catch (error) {
    logger.error('suggestCategory failed', error, { name });
    return FALLBACKS.suggestCategory;
  }
}

// ─── Feature 4: Review Authenticity Detection ─────────────────────────────────

async function analyzeReview({ reviewId, text, rating, productName, productCategory }) {
  try {
    const prompt = `You are a review authenticity analyzer for a Nigerian campus marketplace.

Review to analyze:
- Product: ${productName}${productCategory ? ` (${productCategory})` : ''}
- Rating: ${rating}/5
- Review text: "${stripPII(text)}"

Signals to check:
- generic_text: extremely short or generic ("great product", "good", "nice")
- rating_mismatch: rating doesn't match the sentiment of the text
- promotional_language: reads like an ad rather than a real review
- bot_pattern: repetitive, unnatural, or template-like phrasing
- seller_mention_abuse: excessive mention of the seller/shop name

Return ONLY valid JSON, no markdown:
{"authentic": true|false, "confidence": 0.00-1.00, "flags": []}

confidence = 1.0 means definitely authentic, 0.0 means definitely fake.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.trim();
    const parsed = JSON.parse(raw);

    // Update the review row asynchronously (caller doesn't wait for this)
    await db.query(
      `UPDATE reviews
       SET ai_authenticity_score = $1, ai_flags = $2, ai_reviewed_at = NOW()
       WHERE id = $3`,
      [parsed.confidence, parsed.flags, reviewId]
    );

    logger.info('analyzeReview completed', { reviewId, authentic: parsed.authentic, flags: parsed.flags });
    return parsed;
  } catch (error) {
    logger.error('analyzeReview failed', error, { reviewId });
    return FALLBACKS.analyzeReview;
  }
}

// ─── Feature 5: Bypass Detection ──────────────────────────────────────────────

async function detectBypass() {
  try {
    // Step 1: Regex pre-filter — find suspicious seller notes
    const suspiciousNotes = await db.query(
      `SELECT osn.seller_id, osn.order_id, osn.note,
              s.shop_name
       FROM order_seller_notes osn
       JOIN sellers s ON osn.seller_id = s.id
       WHERE osn.created_at > NOW() - INTERVAL '24 hours'
         AND (
           osn.note ~* '\\d{10,11}'           -- phone numbers
           OR osn.note ~* 'whatsapp'
           OR osn.note ~* 'transfer'
           OR osn.note ~* 'opay|palmpay|kuda'
           OR osn.note ~* 'outside|off[- ]?platform|direct'
         )`
    );

    // Step 2: High cancellation rate pairs
    const cancellationPatterns = await db.query(
      `SELECT o.seller_id, o.buyer_id,
              COUNT(*) as cancellation_count,
              s.shop_name
       FROM orders o
       JOIN sellers s ON o.seller_id = s.id
       JOIN order_cancellations oc ON oc.order_id = o.id
       WHERE oc.created_at > NOW() - INTERVAL '24 hours'
       GROUP BY o.seller_id, o.buyer_id, s.shop_name
       HAVING COUNT(*) >= 2`
    );

    // Step 3: Reset pattern — cancelled then same buyer reorders same product
    const resetPatterns = await db.query(
      `SELECT o1.seller_id, o1.buyer_id,
              COUNT(*) as reset_count,
              s.shop_name
       FROM orders o1
       JOIN order_cancellations oc ON oc.order_id = o1.id
       JOIN orders o2 ON o2.buyer_id = o1.buyer_id
                      AND o2.seller_id = o1.seller_id
                      AND o2.created_at > oc.created_at
                      AND o2.created_at < oc.created_at + INTERVAL '3 hours'
       JOIN sellers s ON o1.seller_id = s.id
       WHERE oc.created_at > NOW() - INTERVAL '24 hours'
       GROUP BY o1.seller_id, o1.buyer_id, s.shop_name
       HAVING COUNT(*) >= 1`
    );

    // Combine into suspicious pairs
    const pairs = new Map();

    for (const note of suspiciousNotes.rows) {
      const key = `${note.seller_id}-null`;
      if (!pairs.has(key)) pairs.set(key, { seller_id: note.seller_id, buyer_id: null, shop_name: note.shop_name, patterns: [] });
      pairs.get(key).patterns.push(`note contained suspicious text: "${note.note.substring(0, 80)}"`);
    }

    for (const row of cancellationPatterns.rows) {
      const key = `${row.seller_id}-${row.buyer_id}`;
      if (!pairs.has(key)) pairs.set(key, { seller_id: row.seller_id, buyer_id: row.buyer_id, shop_name: row.shop_name, patterns: [] });
      pairs.get(key).patterns.push(`${row.cancellation_count} cancellations in 24h`);
    }

    for (const row of resetPatterns.rows) {
      const key = `${row.seller_id}-${row.buyer_id}`;
      if (!pairs.has(key)) pairs.set(key, { seller_id: row.seller_id, buyer_id: row.buyer_id, shop_name: row.shop_name, patterns: [] });
      pairs.get(key).patterns.push(`cancel-and-reorder reset pattern detected (${row.reset_count}x)`);
    }

    if (pairs.size === 0) {
      logger.info('detectBypass: no suspicious patterns found');
      return [];
    }

    // Step 4: Send to Claude for risk scoring
    const pairsArray = Array.from(pairs.values());
    const prompt = `You are a bypass-detection tool for BuyTree, a Nigerian campus e-commerce platform. "Bypass" means sellers and buyers transacting off-platform to avoid the 5% fee.

Analyze these suspicious seller/buyer patterns and assign a risk level to each:

${JSON.stringify(pairsArray, null, 2)}

Context:
- Phone numbers in seller notes are suspicious but alone are only medium risk
- A note with a phone number PLUS a cancel-reorder pattern = high risk
- Isolated cancellations with no note patterns = low risk
- Nigerian payment apps (Opay, PalmPay, Kuda) in notes are high risk

Return ONLY a JSON array, no markdown:
[{"seller_id": N, "buyer_id": N|null, "risk": "high"|"medium"|"low", "reason": "short plain-English reason"}]`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const results = JSON.parse(response.content[0].text.trim());

    // Step 5: Insert into bypass_flags table
    for (const item of results) {
      const pairData = pairsArray.find(p => p.seller_id === item.seller_id && p.buyer_id === item.buyer_id);
      await db.query(
        `INSERT INTO bypass_flags (seller_id, buyer_id, risk_level, reason, evidence, ai_analysed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        [item.seller_id, item.buyer_id, item.risk, item.reason, JSON.stringify({ patterns: pairData?.patterns || [] })]
      );
    }

    logger.info('detectBypass completed', { pairsAnalyzed: pairsArray.length, flagged: results.length });
    return results;
  } catch (error) {
    logger.error('detectBypass failed', error);
    return FALLBACKS.detectBypass;
  }
}

// ─── Feature 6: Dispute Triage ─────────────────────────────────────────────────

async function triageDispute(disputeId) {
  try {
    // Fetch full dispute context
    const disputeResult = await db.query(
      `SELECT d.*,
              o.order_number, o.total_amount, o.status as order_status,
              o.created_at as order_created_at, o.delivered_at,
              o.payment_status,
              u.first_name as buyer_first_name,
              s.shop_name
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       JOIN users u ON d.buyer_id = u.id
       JOIN sellers s ON d.seller_id = s.id
       WHERE d.id = $1`,
      [disputeId]
    );

    if (disputeResult.rows.length === 0) {
      logger.error('triageDispute: dispute not found', null, { disputeId });
      return FALLBACKS.triageDispute;
    }

    const dispute = disputeResult.rows[0];

    // Order items
    const itemsResult = await db.query(
      'SELECT product_name, quantity, subtotal FROM order_items WHERE order_id = $1',
      [dispute.order_id]
    );

    // Order status history
    const historyResult = await db.query(
      `SELECT old_status, new_status, changed_at, changed_by_role
       FROM order_status_history WHERE order_id = $1 ORDER BY changed_at ASC`,
      [dispute.order_id]
    );

    // Buyer dispute history
    const buyerHistoryResult = await db.query(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE resolved_in_favor = 'buyer') as won
       FROM disputes WHERE buyer_id = $1 AND id != $2`,
      [dispute.buyer_id, disputeId]
    );

    // Seller dispute history
    const sellerHistoryResult = await db.query(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE resolved_in_favor = 'seller') as won
       FROM disputes WHERE seller_id = $1 AND id != $2`,
      [dispute.seller_id, disputeId]
    );

    const context = {
      dispute: {
        id: dispute.id,
        type: dispute.dispute_type,
        description: stripPII(dispute.description),
        seller_response: dispute.seller_response ? stripPII(dispute.seller_response) : null,
        filed_at: dispute.created_at,
      },
      order: {
        number: dispute.order_number,
        total: dispute.total_amount,
        status: dispute.order_status,
        payment_status: dispute.payment_status,
        ordered_at: dispute.order_created_at,
        delivered_at: dispute.delivered_at,
        items: itemsResult.rows,
        status_history: historyResult.rows,
      },
      buyer_history: buyerHistoryResult.rows[0],
      seller_history: sellerHistoryResult.rows[0],
    };

    const prompt = `You are an internal dispute triage tool for BuyTree, a Nigerian campus e-commerce platform. Your job is to help admins understand disputes quickly and fairly.

Dispute context:
${JSON.stringify(context, null, 2)}

Nigerian market context:
- Most deliveries are campus pick-up or short-range delivery
- Buyers often dispute when items aren't as described or never arrived
- Weight delivery confirmation evidence heavily
- A seller marking "delivered" without the buyer confirming is weaker evidence
- Platform fee is 5%, minimum order ₦4,000

Produce a triage report. Return ONLY valid JSON, no markdown:
{
  "summary": "1-2 sentence plain-English summary of the dispute",
  "likely_fault": "buyer"|"seller"|"unclear",
  "confidence": 0.00-1.00,
  "suggested_action": "full_refund"|"partial_refund"|"dismiss"|"investigate",
  "suggested_refund_amount": number (0 if no refund),
  "flags": ["string", ...],
  "escalate": true|false
}

Possible flags: seller_has_prior_disputes, buyer_has_prior_disputes, no_delivery_proof, late_dispute, items_not_as_described, seller_responded.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const triage = JSON.parse(response.content[0].text.trim());

    // Save triage to disputes table
    await db.query(
      `UPDATE disputes SET ai_triage = $1, ai_triage_at = NOW() WHERE id = $2`,
      [JSON.stringify(triage), disputeId]
    );

    logger.info('triageDispute completed', { disputeId, suggested_action: triage.suggested_action, confidence: triage.confidence });
    return triage;
  } catch (error) {
    logger.error('triageDispute failed', error, { disputeId });
    return FALLBACKS.triageDispute;
  }
}

module.exports = {
  chat,
  generateDescription,
  suggestCategory,
  analyzeReview,
  detectBypass,
  triageDispute,
};
