-- AI Features Migration
-- Adds AI columns to reviews and disputes tables, creates bypass_flags table

-- ── reviews: authenticity detection columns ───────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS ai_authenticity_score NUMERIC(3,2),  -- 0.00–1.00 (1 = likely authentic)
  ADD COLUMN IF NOT EXISTS ai_flags              TEXT[],         -- e.g. ['generic_text', 'rating_mismatch']
  ADD COLUMN IF NOT EXISTS ai_reviewed_at        TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reviews_ai_score ON reviews(ai_authenticity_score)
  WHERE ai_authenticity_score IS NOT NULL;

-- ── disputes: AI triage columns ───────────────────────────────────────────────
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS ai_triage    JSONB,
  ADD COLUMN IF NOT EXISTS ai_triage_at TIMESTAMPTZ;

-- ── bypass_flags: new table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bypass_flags (
  id             SERIAL PRIMARY KEY,
  seller_id      INTEGER REFERENCES sellers(id),
  buyer_id       INTEGER REFERENCES users(id),
  risk_level     TEXT NOT NULL CHECK (risk_level IN ('high', 'medium', 'low')),
  reason         TEXT,
  evidence       JSONB,
  status         TEXT DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'actioned')),
  ai_analysed_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  resolved_by    INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_bypass_flags_seller_id  ON bypass_flags(seller_id);
CREATE INDEX IF NOT EXISTS idx_bypass_flags_risk_level ON bypass_flags(risk_level);
CREATE INDEX IF NOT EXISTS idx_bypass_flags_status     ON bypass_flags(status);
