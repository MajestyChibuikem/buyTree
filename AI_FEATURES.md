# BuyTree AI Features — Implementation Plan

Six AI-powered features built on the Claude API, integrated into the existing Express + React + PostgreSQL stack.

---

## Overview

| Feature | Who Benefits | Trigger | Claude Model |
|---|---|---|---|
| Chatbot | Buyers | User message | claude-haiku-4-5 (fast, cheap) |
| Description Writer | Sellers | Product creation form | claude-sonnet-4-6 |
| Auto-Categorization | Sellers | Product name/image input | claude-haiku-4-5 |
| Review Authenticity Detection | Platform | Review submitted | claude-haiku-4-5 |
| Bypass Detection | Platform | Order/payment events | claude-sonnet-4-6 |
| Automated Dispute Triage | Admins | Dispute opened | claude-sonnet-4-6 |

All six features share a single backend service: `backend/src/services/aiService.js`, which wraps the Anthropic SDK and exposes focused methods per feature.

---

## Shared Infrastructure

### 1. Install the SDK

```bash
cd backend && npm install @anthropic-ai/sdk
```

### 2. Environment Variable

Add to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. AI Service (`backend/src/services/aiService.js`)

Central module. All six features call methods on this service. Each method:
- Accepts structured input
- Builds a prompt
- Calls the Claude API
- Returns a structured JSON result
- Logs via the existing `logger.js` utility
- Fails gracefully (never throws to the caller — returns a fallback object)

### 4. AI Controller (`backend/src/controllers/aiController.js`)

HTTP handlers for the AI endpoints. Calls `aiService` methods, returns JSON.

### 5. AI Routes (`backend/src/routes/ai.routes.js`)

Mounts at `/api/ai`. Protected by existing `authMiddleware`.

### 6. Database Changes

One new table and several new columns added via a new migration file:
`backend/src/migrations/012_ai_features.sql`

---

## Feature 1: Chatbot

### What It Does

A floating chat widget on all buyer-facing pages. The bot can:
- Answer questions about orders (checks real order data)
- Explain platform policies (returns, disputes, delivery timelines)
- Guide users through checkout, reviews, and dispute filing
- Escalate to human support by directing to the disputes flow

It is **not** a general assistant — it is scoped strictly to BuyTree context via a system prompt.

### Architecture

```
Buyer types message
  → POST /api/ai/chat
  → aiController.chat()
  → aiService.chat(messages, userId)
    → fetch recent orders for user (inject as context)
    → call Claude with system prompt + order context + conversation history
  → return { reply: string }
```

**Conversation history** is managed on the frontend (React state) — the full message array is sent with each request. No server-side session storage needed.

**Order context injection**: When a buyer sends a message, the backend fetches their last 5 orders and injects them as a structured context block into the system prompt. This lets the bot answer "where is my order?" without the user needing to provide an order number.

### Frontend

- New component: `frontend/src/components/common/ChatWidget.jsx`
- Floating button (bottom-right) visible on all buyer pages
- Opens a slide-up panel with a message list and input
- Calls `POST /api/ai/chat` with `{ messages: [...], userId }`

### Database

No new tables needed. Chat history lives in frontend state only (stateless from server perspective).

### API

```
POST /api/ai/chat
Auth: required (buyer)
Body: { messages: [{ role: 'user'|'assistant', content: string }] }
Response: { reply: string }
```

### System Prompt Strategy

The system prompt tells Claude:
- It is a support bot for BuyTree, a campus marketplace in Nigeria
- It has access to the buyer's recent orders (injected as JSON)
- It should answer only BuyTree-related questions
- Currency is Naira (₦)
- Minimum order is ₦4,000
- Delivery statuses: Paid → Ready for Pickup → In Transit → Delivered
- Payout to sellers happens T+1 after delivery confirmation
- For unresolvable issues, direct buyer to file a dispute via their order detail page

---

## Feature 2: Description Writer

### What It Does

On the seller product creation form, a **"Generate Description"** button appears next to the description field. The seller enters:
- Product name
- Price
- Category

Claude generates a concise, persuasive product description (2–3 sentences). The seller can accept it, edit it, or ignore it.

### Architecture

```
Seller fills in name + price + category
  → clicks "Generate Description"
  → POST /api/ai/generate-description
  → aiController.generateDescription()
  → aiService.generateDescription({ name, price, category, shopName })
    → call Claude with structured prompt
  → return { description: string }
```

This is a **one-shot** generation — no conversation history needed. The request is synchronous (Haiku is fast enough, Sonnet is used here for quality).

### Frontend

- Modify: `frontend/src/pages/` (seller product creation page — exact file TBD from codebase)
- Add a "Generate with AI" button next to the description textarea
- On click: disable button, show spinner, call API, populate textarea with result
- Seller can freely edit the result before saving

### Database

No changes. The generated description is just text saved into the existing `products.description` column.

### API

```
POST /api/ai/generate-description
Auth: required (seller)
Body: { name: string, price: number, category: string }
Response: { description: string }
```

### Prompt Strategy

Claude is told to write a product listing description for a student campus marketplace. It should:
- Be 2–3 sentences, direct and punchy
- Mention the key benefit to a student buyer
- Avoid marketing fluff ("amazing", "must-have")
- Not mention the price (already shown separately)

---

## Feature 3: Auto-Categorization

### What It Does

When a seller types a product name (and optionally a description), Claude suggests the best-fit category from BuyTree's fixed list. The suggestion appears as a highlighted chip the seller can click to accept.

This reduces miscategorization and friction during product creation.

### Available Categories

The fixed category list is sourced from `seller_categories` in the database. Claude is always given the exact list — it never invents categories.

### Architecture

```
Seller types product name (debounced, 600ms)
  → POST /api/ai/suggest-category
  → aiController.suggestCategory()
  → aiService.suggestCategory({ name, description })
    → fetch allowed categories from DB (or pass as static list)
    → call Claude with structured prompt
  → return { category: string, confidence: 'high'|'medium'|'low' }
```

The debounce lives in the React component — no server-side throttle needed beyond the existing rate limiter.

### Frontend

- Modify: seller product creation page
- After product name input (on blur or 600ms debounce): call the API
- Display result as a tappable chip: "Suggested category: Food & Snacks — accept?"
- Only show if `confidence` is `high` or `medium`

### Database

No schema changes. The accepted category is saved into the existing `products.category` column.

### API

```
POST /api/ai/suggest-category
Auth: required (seller)
Body: { name: string, description?: string }
Response: { category: string, confidence: 'high'|'medium'|'low' }
```

### Prompt Strategy

Claude is given the exact list of valid categories and asked to return only one from the list plus a confidence level. Response is forced to JSON via the prompt instruction (no markdown, no explanation — just `{"category":"...", "confidence":"..."}`).

---

## Feature 4: Review Authenticity Detection

### What It Does

Every time a review is submitted, it is asynchronously scored by Claude for authenticity signals. Suspicious reviews are flagged for admin review — they are **not** hidden from buyers automatically, only flagged internally.

Signals Claude looks for:
- Extremely short or generic content ("great product", "good")
- Mismatch between rating and sentiment of the text
- Promotional language (reads like an ad)
- Excessive use of the seller's name or shop name
- Patterns typical of coordinated fake reviews

### Architecture

```
Buyer submits review
  → existing POST /api/reviews creates the review in DB
  → AFTER saving, fire-and-forget: aiService.analyzeReview(reviewData)
    → call Claude with review text, rating, product name
    → return { authentic: boolean, confidence: number, flags: string[] }
  → UPDATE reviews SET ai_authenticity_score, ai_flags, ai_reviewed_at
```

This is **async and non-blocking** — the review is saved and returned to the user immediately. The AI analysis runs in the background and updates the row. The buyer never waits for AI.

### Frontend

- Admin dashboard: add "AI Flags" column to the reviews table
- Flagged reviews show a warning badge with the flag reasons
- No buyer-facing changes

### Database (new columns on `reviews` table)

```sql
ALTER TABLE reviews
  ADD COLUMN ai_authenticity_score  NUMERIC(3,2),  -- 0.00–1.00 (1 = likely authentic)
  ADD COLUMN ai_flags               TEXT[],         -- e.g. ['generic_text', 'rating_mismatch']
  ADD COLUMN ai_reviewed_at         TIMESTAMPTZ;
```

### API

No new public endpoint. The analysis is triggered internally from the review controller after saving.

### Admin UI

- `AdminDashboard.jsx` or a new `AdminReviews.jsx` page
- Filter reviews by `ai_authenticity_score < 0.5`
- Show flags as readable labels
- Admin can dismiss flag or remove review

### Prompt Strategy

Claude is given the review text, numeric rating, and product category. It is asked to return structured JSON:
```json
{
  "authentic": true,
  "confidence": 0.82,
  "flags": []
}
```
Possible flags: `generic_text`, `rating_mismatch`, `promotional_language`, `bot_pattern`, `seller_mention_abuse`.

---

## Feature 5: Bypass Detection

### What It Does

"Bypass" in BuyTree's context means sellers and buyers colluding to complete transactions off-platform to avoid the 5% platform fee. This deprives the platform of revenue and circumvents dispute protection.

The AI analyzes patterns across orders, seller notes, and order cancellations to detect likely bypass attempts and flags them for admin review.

Detection signals:
- Order created → cancelled immediately → same buyer re-orders same items shortly after (reset pattern)
- Seller adds notes with phone numbers, WhatsApp links, or external payment references
- Seller frequently cancels orders from repeat buyers
- High cancellation rate on orders from the same buyer-seller pair
- Orders cancelled within minutes of creation (before buyer can see the product)

### Architecture

This runs as a **background job** — not in response to a single event, but on a schedule.

```
node-cron job runs every 6 hours (backend/src/jobs/bypassDetection.js)
  → aiService.detectBypass()
    → query DB for suspicious patterns (last 24 hours):
        - cancellation rate by seller
        - repeat buyer-seller pairs with cancellations
        - seller notes containing contact patterns (regex pre-filter)
    → call Claude with structured pattern summary
    → Claude scores each flagged seller/pair: { risk: 'high'|'medium'|'low', reason: string }
  → INSERT or UPDATE bypass_flags table
  → if risk = 'high': trigger email to admin via emailService
```

The **regex pre-filter** (phone numbers, "whatsapp", "transfer", external payment keywords in seller notes) reduces the data sent to Claude to only genuinely suspicious records.

### Database (new table)

```sql
CREATE TABLE bypass_flags (
  id                SERIAL PRIMARY KEY,
  seller_id         INTEGER REFERENCES sellers(id),
  buyer_id          INTEGER REFERENCES users(id),
  risk_level        TEXT NOT NULL CHECK (risk_level IN ('high','medium','low')),
  reason            TEXT,
  evidence          JSONB,          -- order IDs, note excerpts, pattern summary
  status            TEXT DEFAULT 'open' CHECK (status IN ('open','dismissed','actioned')),
  ai_analysed_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  resolved_by       INTEGER REFERENCES users(id)
);
```

### API (Admin)

```
GET /api/admin/bypass-flags          — list all flags, filter by risk/status
PUT /api/admin/bypass-flags/:id      — update status (dismiss or action)
```

### Admin UI

New section in `AdminDashboard.jsx` or new `AdminBypassFlags.jsx`:
- List of flagged seller/buyer pairs with risk level, reason, and evidence
- Admin can dismiss (false positive) or action (suspend seller, investigate)

### Prompt Strategy

Claude receives a structured summary object per suspicious pair:
```json
{
  "seller": { "id": 12, "name": "...", "cancellation_rate_7d": 0.4 },
  "buyer": { "id": 88 },
  "patterns": ["3 cancellations in 24h", "note contained phone number", "same items re-ordered"]
}
```
Claude returns risk level and plain-English reason. It is explicitly told it is an analysis tool for a Nigerian campus marketplace and to weight signals accordingly (e.g., phone numbers in notes are common but not alone sufficient for high risk).

---

## Feature 6: Automated Dispute Triage

### What It Does

When a buyer opens a dispute, Claude reads the full dispute context and produces a structured triage report for the admin. This report:
- Summarizes both sides of the dispute
- Identifies the most likely resolution
- Suggests a concrete action (full refund, partial refund, dismiss, investigate further)
- Assigns a confidence score to the suggestion
- Flags if this seller or buyer has a history of disputes

Admins still make the final decision — this reduces the cognitive load of reading raw dispute data and speeds up resolution time.

### Architecture

```
Buyer opens dispute
  → existing disputes table row created
  → POST /api/ai/triage-dispute (triggered from dispute creation controller)
  → aiController.triageDispute()
  → aiService.triageDispute(disputeId)
    → fetch from DB:
        - dispute record (description, evidence_urls)
        - order record + order items
        - order status history
        - seller's dispute history (count, outcomes)
        - buyer's dispute history (count, outcomes)
        - relevant reviews
    → call Claude with all context
    → return structured triage report
  → UPDATE disputes SET ai_triage, ai_triage_at
```

### Database (new columns on `disputes` table)

```sql
ALTER TABLE disputes
  ADD COLUMN ai_triage       JSONB,        -- full triage report
  ADD COLUMN ai_triage_at    TIMESTAMPTZ;
```

The `ai_triage` JSONB field stores:
```json
{
  "summary": "Buyer claims item was not received. Seller marked as delivered 3 days ago with no tracking evidence.",
  "likely_fault": "seller",
  "confidence": 0.74,
  "suggested_action": "full_refund",
  "suggested_refund_amount": 4500,
  "flags": ["seller_has_2_prior_disputes", "no_delivery_proof"],
  "escalate": false
}
```

### API

```
POST /api/ai/triage-dispute
Auth: internal (called from dispute controller, not directly by users)
Body: { disputeId: number }
Response: { triage: object }

GET /api/admin/disputes/:disputeId/triage   — fetch triage report for admin UI
```

### Admin UI

Modify the existing admin dispute detail view:
- Add an "AI Triage" card at the top of the dispute detail page
- Show: summary, suggested action (highlighted), confidence bar, flags
- Admin accepts or overrides the suggestion
- If admin accepts suggestion, pre-populate the resolution fields

### Prompt Strategy

Claude is given the full structured context object and asked to return valid JSON (no markdown). The system prompt states:
- Claude is an internal tool for a campus marketplace admin
- Its job is to be fair to both parties
- It should weight delivery confirmation evidence heavily
- Nigerian market context: cash-on-delivery expectations, platform fee structure
- It must flag if the buyer or seller has a pattern of disputes

---

## Implementation Order

1. **Shared infrastructure** — install SDK, add env var, create `aiService.js` skeleton, `aiController.js`, `ai.routes.js`, mount route in `app.js`
2. **Description Writer** — simplest, no DB changes, visible to sellers immediately
3. **Auto-Categorization** — builds on same endpoint structure
4. **Chatbot** — frontend-heavy, self-contained
5. **Review Authenticity Detection** — add DB columns, async hook into review controller
6. **Automated Dispute Triage** — add DB columns, hook into dispute controller
7. **Bypass Detection** — background job, new table, most complex

---

## File Structure (New Files)

```
backend/
  src/
    services/
      aiService.js              ← all Claude API calls
    controllers/
      aiController.js           ← HTTP handlers
    routes/
      ai.routes.js              ← /api/ai/* routes
    jobs/
      bypassDetection.js        ← cron job (every 6h)
    migrations/
      012_ai_features.sql       ← new table + columns

frontend/
  src/
    components/
      common/
        ChatWidget.jsx          ← floating chatbot UI
    services/
      aiService.js              ← frontend API calls for AI endpoints
```

### Modified Files

```
backend/
  src/
    app.js                      ← mount ai.routes
    controllers/
      reviewController.js       ← fire-and-forget after review save
      disputeController.js      ← call triage after dispute created
    jobs/                       ← register bypass detection cron
  .env                          ← add ANTHROPIC_API_KEY

frontend/
  src/
    pages/
      [SellerProductCreate].jsx ← add description + category AI buttons
    pages/admin/
      AdminDashboard.jsx        ← add bypass flags + flagged reviews sections
      [AdminDisputeDetail].jsx  ← add AI triage card
```

---

## Cost Estimate (Rough)

| Feature | Model | Est. tokens/call | Calls/day |
|---|---|---|---|
| Chatbot | Haiku | ~2,000 | ~50 |
| Description Writer | Sonnet | ~500 | ~20 |
| Auto-Categorization | Haiku | ~300 | ~30 |
| Review Detection | Haiku | ~600 | ~40 |
| Bypass Detection | Sonnet | ~3,000 | 4 (cron) |
| Dispute Triage | Sonnet | ~4,000 | ~5 |

At typical API pricing this remains well under $5/day at early-stage volume. Haiku is used for high-frequency, low-stakes tasks; Sonnet for analysis tasks where quality matters.

---

## Guardrails

- **Never block user actions on AI** — AI results are always async or optional. A Claude API failure must never prevent a seller from saving a product, a buyer from submitting a review, or a dispute from being opened.
- **Admin override always wins** — AI suggestions are advisory. Every AI output has a human review step before any consequential action (suspension, refund, removal).
- **Log all AI calls** — every call to `aiService` logs the feature name, input hash, and response via `logger.js`. No raw prompt/response logs in production (privacy).
- **Rate limit AI endpoints** — the `/api/ai/*` routes get their own stricter rate limiter (e.g., 10 req/min per user) to prevent abuse and runaway costs.
- **No PII in prompts** — user names, emails, and phone numbers are stripped before being sent to Claude. Only IDs, order numbers, and anonymized text are included.
