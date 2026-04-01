-- Migration 018: Fix regressions introduced in 017
--
-- ISSUE 1: Policies created in 017 used (SELECT auth.uid()::text) — the cast
--   inside the subquery confuses Supabase's advisor. The correct form per the
--   Supabase docs is (select auth.uid()) with the cast applied OUTSIDE:
--   user_id::text = (select auth.uid())::text
--
-- ISSUE 2: seller_categories "Sellers can manage own categories" was FOR ALL,
--   which implicitly includes SELECT, conflicting with the public SELECT policy.
--   Same fix as products in 017: split FOR ALL into explicit write policies.


-- ══════════════════════════════════════════════════════════════
-- TABLE: orders — fix auth.uid() wrapping
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    buyer_id::text  = (select auth.uid())::text
    OR seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );


-- ══════════════════════════════════════════════════════════════
-- TABLE: products — fix auth.uid() wrapping on all four policies
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Products are visible to public or owner" ON products;
DROP POLICY IF EXISTS "Sellers can write own products"          ON products;
DROP POLICY IF EXISTS "Sellers can update own products"         ON products;
DROP POLICY IF EXISTS "Sellers can delete own products"         ON products;

CREATE POLICY "Products are visible to public or owner" ON products
  FOR SELECT USING (
    (is_active = true AND deleted_at IS NULL)
    OR seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );

CREATE POLICY "Sellers can write own products" ON products
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );

CREATE POLICY "Sellers can update own products" ON products
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );

CREATE POLICY "Sellers can delete own products" ON products
  FOR DELETE USING (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );


-- ══════════════════════════════════════════════════════════════
-- TABLE: reviews — fix auth.uid() wrapping
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Buyers and sellers can update reviews" ON reviews;

CREATE POLICY "Buyers and sellers can update reviews" ON reviews
  FOR UPDATE USING (
    buyer_id::text = (select auth.uid())::text
    OR product_id IN (
      SELECT p.id FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id::text = (select auth.uid())::text
    )
  );


-- ══════════════════════════════════════════════════════════════
-- TABLE: seller_categories — fix multiple permissive SELECT policies
-- ══════════════════════════════════════════════════════════════
-- "Sellers can manage own categories" was FOR ALL, which produces a SELECT
-- policy that overlaps the public "Public can view seller categories".
-- Fix: keep the public SELECT, replace FOR ALL with explicit write policies.

DROP POLICY IF EXISTS "Sellers can manage own categories" ON seller_categories;

CREATE POLICY "Sellers can insert own categories" ON seller_categories
  FOR INSERT WITH CHECK (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );

CREATE POLICY "Sellers can update own categories" ON seller_categories
  FOR UPDATE USING (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );

CREATE POLICY "Sellers can delete own categories" ON seller_categories
  FOR DELETE USING (
    seller_id IN (
      SELECT id FROM sellers
      WHERE user_id::text = (select auth.uid())::text
    )
  );


-- ── Verification ──────────────────────────────────────────────
-- Should return 0 rows when all auth() calls are properly wrapped.
SELECT tablename, policyname, cmd, qual, with_check
FROM   pg_policies
WHERE  schemaname = 'public'
  AND  (
         (qual IS NOT NULL       AND qual       ~ 'auth\.(uid|role|jwt)\(\)' AND qual       !~ 'select auth\.')
      OR (with_check IS NOT NULL AND with_check ~ 'auth\.(uid|role|jwt)\(\)' AND with_check !~ 'select auth\.')
       )
ORDER BY tablename, policyname;
