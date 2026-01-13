-- Migration 011: Enable Row Level Security (RLS) for all tables
-- CRITICAL SECURITY FIX: All tables were publicly accessible without RLS
-- This migration enables RLS and creates appropriate policies

-- Note: Since this app uses a backend API with service role key,
-- RLS policies use auth.uid() for Supabase Auth or can be bypassed by service role.
-- The backend uses service_role key which bypasses RLS by default.
-- These policies protect against direct API access from malicious clients.

-- ============================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_seller_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: Create policies for each table
-- Since your backend uses service_role key (which bypasses RLS),
-- these policies block direct PostgREST/anon key access
-- ============================================================

-- ---------- USERS ----------
-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Block direct inserts (registration goes through backend)
CREATE POLICY "No direct user inserts" ON users
  FOR INSERT WITH CHECK (false);

-- Block direct deletes
CREATE POLICY "No direct user deletes" ON users
  FOR DELETE USING (false);

-- ---------- SELLERS ----------
-- Public can view active, verified sellers (for shop pages)
CREATE POLICY "Public can view active sellers" ON sellers
  FOR SELECT USING (is_active = true);

-- Sellers can update their own shop
CREATE POLICY "Sellers can update own shop" ON sellers
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Block direct inserts/deletes (goes through backend)
CREATE POLICY "No direct seller inserts" ON sellers
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct seller deletes" ON sellers
  FOR DELETE USING (false);

-- ---------- SELLER CATEGORIES ----------
CREATE POLICY "Public can view seller categories" ON seller_categories
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage own categories" ON seller_categories
  FOR ALL USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- ---------- SELLER VIOLATIONS ----------
-- Only admins and the seller can view violations
CREATE POLICY "Sellers can view own violations" ON seller_violations
  FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- Only backend/admin can insert violations
CREATE POLICY "No direct violation inserts" ON seller_violations
  FOR INSERT WITH CHECK (false);

-- ---------- PRODUCTS ----------
-- Public can view active products
CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);

-- Sellers can manage their own products
CREATE POLICY "Sellers can manage own products" ON products
  FOR ALL USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- ---------- PRODUCT ANALYTICS ----------
-- Sellers can view analytics for their products only
CREATE POLICY "Sellers can view own product analytics" ON product_analytics
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id::text = auth.uid()::text
    )
  );

-- Block direct inserts (analytics tracked by backend)
CREATE POLICY "No direct analytics inserts" ON product_analytics
  FOR INSERT WITH CHECK (false);

-- ---------- CARTS ----------
-- Users can only access their own cart
CREATE POLICY "Users can access own cart" ON carts
  FOR ALL USING (user_id::text = auth.uid()::text);

-- ---------- CART ITEMS ----------
-- Users can only access items in their own cart
CREATE POLICY "Users can access own cart items" ON cart_items
  FOR ALL USING (
    cart_id IN (SELECT id FROM carts WHERE user_id::text = auth.uid()::text)
  );

-- ---------- ORDERS ----------
-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders" ON orders
  FOR SELECT USING (buyer_id::text = auth.uid()::text);

-- Sellers can view orders for their shop
CREATE POLICY "Sellers can view shop orders" ON orders
  FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- Only backend can create/update orders
CREATE POLICY "No direct order inserts" ON orders
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct order updates" ON orders
  FOR UPDATE USING (false);

-- ---------- ORDER ITEMS ----------
-- Viewable if user can view the parent order
CREATE POLICY "Users can view order items for accessible orders" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id::text = auth.uid()::text
      OR seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
    )
  );

-- ---------- DISPUTES ----------
-- Parties can view disputes they're involved in
CREATE POLICY "Parties can view own disputes" ON disputes
  FOR SELECT USING (
    buyer_id::text = auth.uid()::text
    OR seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- Block direct inserts/updates (goes through backend)
CREATE POLICY "No direct dispute inserts" ON disputes
  FOR INSERT WITH CHECK (false);

-- ---------- SELLER BALANCES ----------
-- Sellers can view their own balance entries
CREATE POLICY "Sellers can view own balances" ON seller_balances
  FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- ---------- PRODUCT REVIEWS ----------
-- Public can view all reviews
CREATE POLICY "Public can view reviews" ON product_reviews
  FOR SELECT USING (true);

-- Buyers can insert reviews for products they purchased
CREATE POLICY "Buyers can insert own reviews" ON product_reviews
  FOR INSERT WITH CHECK (buyer_id::text = auth.uid()::text);

-- ---------- PASSWORD RESET TOKENS ----------
-- CRITICAL: No one should access this directly via API
CREATE POLICY "No direct token access" ON password_reset_tokens
  FOR ALL USING (false);

-- ---------- ADMIN ACTIONS ----------
-- Only viewable by admin via backend
CREATE POLICY "No direct admin actions access" ON admin_actions
  FOR ALL USING (false);

-- ---------- PLATFORM METRICS ----------
-- Only viewable by admin via backend
CREATE POLICY "No direct platform metrics access" ON platform_metrics
  FOR ALL USING (false);

-- ---------- REVIEWS ----------
-- Public can view all reviews
CREATE POLICY "Public can view reviews table" ON reviews
  FOR SELECT USING (true);

-- Buyers can insert their own reviews
CREATE POLICY "Buyers can insert reviews" ON reviews
  FOR INSERT WITH CHECK (buyer_id::text = auth.uid()::text);

-- Buyers can update their own reviews
CREATE POLICY "Buyers can update own reviews" ON reviews
  FOR UPDATE USING (buyer_id::text = auth.uid()::text);

-- Sellers can update seller_response on reviews for their products
CREATE POLICY "Sellers can respond to reviews" ON reviews
  FOR UPDATE USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id::text = auth.uid()::text
    )
  );

-- ---------- REVIEW HELPFUL ----------
-- Public can view
CREATE POLICY "Public can view review helpful" ON review_helpful
  FOR SELECT USING (true);

-- Users can mark reviews as helpful
CREATE POLICY "Users can mark helpful" ON review_helpful
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Users can remove their helpful mark
CREATE POLICY "Users can unmark helpful" ON review_helpful
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ---------- ORDER STATUS HISTORY ----------
-- Viewable by order parties
CREATE POLICY "Parties can view order history" ON order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id::text = auth.uid()::text
      OR seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
    )
  );

-- ---------- ORDER SELLER NOTES ----------
-- Only seller can view their notes
CREATE POLICY "Sellers can view own notes" ON order_seller_notes
  FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

CREATE POLICY "Sellers can insert notes" ON order_seller_notes
  FOR INSERT WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- ---------- SELLER NOTIFICATION PREFERENCES ----------
-- Sellers can manage their own preferences
CREATE POLICY "Sellers can manage own preferences" ON seller_notification_preferences
  FOR ALL USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
  );

-- ---------- ORDER CANCELLATIONS ----------
-- Viewable by order parties
CREATE POLICY "Parties can view cancellations" ON order_cancellations
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id::text = auth.uid()::text
      OR seller_id IN (SELECT id FROM sellers WHERE user_id::text = auth.uid()::text)
    )
  );

-- ---------- FAVORITES ----------
-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (user_id::text = auth.uid()::text);

-- ============================================================
-- STEP 3: Handle the migrations table (if exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations') THEN
    ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;

    -- No direct access to migrations table
    DROP POLICY IF EXISTS "No direct migrations access" ON migrations;
    CREATE POLICY "No direct migrations access" ON migrations
      FOR ALL USING (false);
  END IF;
END $$;

-- ============================================================
-- STEP 4: Add missing indexes for foreign keys (performance)
-- ============================================================

-- These are commonly needed indexes that may be missing
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_balances_order_id ON seller_balances(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_cancelled_by ON order_cancellations(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_by ON order_status_history(changed_by);

-- ============================================================
-- Verification
-- ============================================================
SELECT 'RLS enabled and policies created successfully!' AS message;
