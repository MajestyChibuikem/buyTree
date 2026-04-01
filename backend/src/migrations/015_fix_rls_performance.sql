-- Migration 015: Fix RLS policy performance — wrap auth.<function>() in (SELECT ...)
--
-- PROBLEM:
--   RLS policies that call auth.uid() directly re-evaluate the function for every
--   single row scanned. On a table with 10,000 rows, auth.uid() runs 10,000 times.
--
-- FIX:
--   Replace  auth.uid()          with  (SELECT auth.uid())
--   Replace  auth.role()         with  (SELECT auth.role())
--
--   The SELECT wrapper makes Postgres evaluate the expression once per query and
--   cache the result, giving it the same performance as a constant.
--   This is the official Supabase recommendation.
--
-- APPROACH:
--   DROP the old policy then CREATE the replacement.
--   DROP POLICY IF EXISTS is used so this migration is safe to re-run.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- USERS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile"   ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id::text = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id::text = (SELECT auth.uid()::text));


-- ──────────────────────────────────────────────────────────────
-- SELLERS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can update own shop" ON sellers;

CREATE POLICY "Sellers can update own shop" ON sellers
  FOR UPDATE USING (user_id::text = (SELECT auth.uid()::text));


-- ──────────────────────────────────────────────────────────────
-- SELLER CATEGORIES
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can manage own categories" ON seller_categories;

CREATE POLICY "Sellers can manage own categories" ON seller_categories
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- SELLER VIOLATIONS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can view own violations" ON seller_violations;

CREATE POLICY "Sellers can view own violations" ON seller_violations
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- PRODUCTS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can manage own products" ON products;

CREATE POLICY "Sellers can manage own products" ON products
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- PRODUCT ANALYTICS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can view own product analytics" ON product_analytics;

CREATE POLICY "Sellers can view own product analytics" ON product_analytics
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- CARTS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can access own cart" ON carts;

CREATE POLICY "Users can access own cart" ON carts
  FOR ALL USING (user_id::text = (SELECT auth.uid()::text));


-- ──────────────────────────────────────────────────────────────
-- CART ITEMS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can access own cart items" ON cart_items;

CREATE POLICY "Users can access own cart items" ON cart_items
  FOR ALL USING (
    cart_id IN (
      SELECT id FROM carts WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- ORDERS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Buyers can view own orders"    ON orders;
DROP POLICY IF EXISTS "Sellers can view shop orders"  ON orders;

CREATE POLICY "Buyers can view own orders" ON orders
  FOR SELECT USING (buyer_id::text = (SELECT auth.uid()::text));

CREATE POLICY "Sellers can view shop orders" ON orders
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- ORDER ITEMS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view order items for accessible orders" ON order_items;

CREATE POLICY "Users can view order items for accessible orders" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id::text = (SELECT auth.uid()::text)
         OR seller_id IN (
              SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
            )
    )
  );


-- ──────────────────────────────────────────────────────────────
-- DISPUTES
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Parties can view own disputes" ON disputes;

CREATE POLICY "Parties can view own disputes" ON disputes
  FOR SELECT USING (
    buyer_id::text = (SELECT auth.uid()::text)
    OR seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- SELLER BALANCES
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can view own balances" ON seller_balances;

CREATE POLICY "Sellers can view own balances" ON seller_balances
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- PRODUCT REVIEWS (legacy table)
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Buyers can insert own reviews" ON product_reviews;

CREATE POLICY "Buyers can insert own reviews" ON product_reviews
  FOR INSERT WITH CHECK (buyer_id::text = (SELECT auth.uid()::text));


-- ──────────────────────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Buyers can insert reviews"      ON reviews;
DROP POLICY IF EXISTS "Buyers can update own reviews"  ON reviews;
DROP POLICY IF EXISTS "Sellers can respond to reviews" ON reviews;

CREATE POLICY "Buyers can insert reviews" ON reviews
  FOR INSERT WITH CHECK (buyer_id::text = (SELECT auth.uid()::text));

CREATE POLICY "Buyers can update own reviews" ON reviews
  FOR UPDATE USING (buyer_id::text = (SELECT auth.uid()::text));

CREATE POLICY "Sellers can respond to reviews" ON reviews
  FOR UPDATE USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- REVIEW HELPFUL
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can mark helpful"   ON review_helpful;
DROP POLICY IF EXISTS "Users can unmark helpful" ON review_helpful;

CREATE POLICY "Users can mark helpful" ON review_helpful
  FOR INSERT WITH CHECK (user_id::text = (SELECT auth.uid()::text));

CREATE POLICY "Users can unmark helpful" ON review_helpful
  FOR DELETE USING (user_id::text = (SELECT auth.uid()::text));


-- ──────────────────────────────────────────────────────────────
-- ORDER STATUS HISTORY
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Parties can view order history" ON order_status_history;

CREATE POLICY "Parties can view order history" ON order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id::text = (SELECT auth.uid()::text)
         OR seller_id IN (
              SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
            )
    )
  );


-- ──────────────────────────────────────────────────────────────
-- ORDER SELLER NOTES
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can view own notes"   ON order_seller_notes;
DROP POLICY IF EXISTS "Sellers can insert notes"     ON order_seller_notes;

CREATE POLICY "Sellers can view own notes" ON order_seller_notes
  FOR SELECT USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Sellers can insert notes" ON order_seller_notes
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- SELLER NOTIFICATION PREFERENCES
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Sellers can manage own preferences" ON seller_notification_preferences;

CREATE POLICY "Sellers can manage own preferences" ON seller_notification_preferences
  FOR ALL USING (
    seller_id IN (
      SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ──────────────────────────────────────────────────────────────
-- ORDER CANCELLATIONS
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Parties can view cancellations" ON order_cancellations;

CREATE POLICY "Parties can view cancellations" ON order_cancellations
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE buyer_id::text = (SELECT auth.uid()::text)
         OR seller_id IN (
              SELECT id FROM sellers WHERE user_id::text = (SELECT auth.uid()::text)
            )
    )
  );


-- ──────────────────────────────────────────────────────────────
-- FAVORITES
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (user_id::text = (SELECT auth.uid()::text));


SELECT 'RLS performance fixes applied successfully!' AS message;
