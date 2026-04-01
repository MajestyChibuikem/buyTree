-- Migration 017: Merge multiple permissive policies + drop duplicate index
--
-- PROBLEM A — Multiple permissive policies on same table/action/role:
--   Postgres evaluates ALL permissive policies for a given action and ORs the
--   results. Having two SELECT policies costs two scans instead of one.
--   Fix: merge into a single policy with an OR condition.
--
-- PROBLEM B — Duplicate index:
--   idx_reviews_seller and idx_reviews_product_id both index reviews(product_id).
--   One is redundant. Drop idx_reviews_seller (the misnamed duplicate added in 011).


-- ══════════════════════════════════════════════════════════════
-- TABLE: orders — merge two SELECT policies into one
-- ══════════════════════════════════════════════════════════════
-- Before: "Buyers can view own orders"  → buyer_id = auth.uid()
--         "Sellers can view shop orders" → seller_id IN (...)
-- After:  single policy covers both with OR

DROP POLICY IF EXISTS "Buyers can view own orders"   ON orders;
DROP POLICY IF EXISTS "Sellers can view shop orders" ON orders;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    buyer_id::text = (SELECT auth.uid()::text)
    OR seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ══════════════════════════════════════════════════════════════
-- TABLE: products — split FOR ALL into SELECT + write operations
-- ══════════════════════════════════════════════════════════════
-- Before: "Public can view active products"   FOR SELECT  (active only)
--         "Sellers can manage own products"   FOR ALL     (own products)
-- The FOR ALL implicitly creates a SELECT policy, causing two SELECT policies.
--
-- After:  one merged SELECT policy (public active OR own)
--         separate INSERT/UPDATE/DELETE policy for sellers only

DROP POLICY IF EXISTS "Public can view active products"  ON products;
DROP POLICY IF EXISTS "Sellers can manage own products"  ON products;

-- Merged SELECT: public sees active products, sellers see all their own
CREATE POLICY "Products are visible to public or owner" ON products
  FOR SELECT USING (
    (is_active = true AND deleted_at IS NULL)
    OR seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );

-- Sellers can write (insert/update/delete) their own products
CREATE POLICY "Sellers can write own products" ON products
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Sellers can update own products" ON products
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Sellers can delete own products" ON products
  FOR DELETE USING (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ══════════════════════════════════════════════════════════════
-- TABLE: reviews — merge two UPDATE policies into one
-- ══════════════════════════════════════════════════════════════
-- Before: "Buyers can update own reviews"   → buyer_id = auth.uid()
--         "Sellers can respond to reviews"  → product belongs to seller
-- After:  single UPDATE policy covers both with OR

DROP POLICY IF EXISTS "Buyers can update own reviews"  ON reviews;
DROP POLICY IF EXISTS "Sellers can respond to reviews" ON reviews;

CREATE POLICY "Buyers and sellers can update reviews" ON reviews
  FOR UPDATE USING (
    buyer_id::text = (SELECT auth.uid()::text)
    OR product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id::text = (SELECT auth.uid()::text)
    )
  );


-- ══════════════════════════════════════════════════════════════
-- Duplicate index on reviews(product_id)
-- ══════════════════════════════════════════════════════════════
-- idx_reviews_product_id — created with the reviews table (correct name)
-- idx_reviews_seller     — added in migration 011, also on (product_id), wrong name
-- Drop the redundant one.

DROP INDEX IF EXISTS public.idx_reviews_seller;


SELECT 'Multiple permissive policy fixes and duplicate index drop applied!' AS message;
