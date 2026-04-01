-- Migration 013: Security fixes for Supabase advisor warnings
-- 1. Enable RLS on bypass_flags (created in 012 without RLS)
-- 2. Recreate seller_order_dashboard_summary without SECURITY DEFINER

-- ============================================================
-- FIX 1: RLS on bypass_flags
-- ============================================================
-- bypass_flags contains sensitive fraud-detection data.
-- The backend accesses it via the service_role key (bypasses RLS).
-- Direct PostgREST/anon access must be blocked entirely.

ALTER TABLE bypass_flags ENABLE ROW LEVEL SECURITY;

-- No direct access from any client — all reads/writes go through backend API
CREATE POLICY "No direct bypass_flags access" ON bypass_flags
  FOR ALL USING (false);

-- ============================================================
-- FIX 2: Recreate seller_order_dashboard_summary without SECURITY DEFINER
-- ============================================================
-- SECURITY DEFINER views run with the privileges of the view creator,
-- bypassing RLS on underlying tables. SECURITY INVOKER (the default)
-- runs with the querying user's privileges, respecting RLS.
-- Since our backend uses the service_role key it can still read everything.

DROP VIEW IF EXISTS seller_order_dashboard_summary;

CREATE VIEW seller_order_dashboard_summary
  WITH (security_invoker = true)
AS
SELECT
  s.id AS seller_id,

  -- Order counts by status
  COUNT(*) FILTER (WHERE o.status = 'pending')                                    AS pending_orders,
  COUNT(*) FILTER (WHERE o.status = 'processing')                                 AS processing_orders,
  COUNT(*) FILTER (WHERE o.status = 'ready_for_pickup')                           AS ready_for_pickup_orders,
  COUNT(*) FILTER (WHERE o.status = 'in_transit')                                 AS in_transit_orders,
  COUNT(*) FILTER (WHERE o.status = 'delivered')                                  AS delivered_orders,
  COUNT(*) FILTER (WHERE o.status = 'cancelled')                                  AS cancelled_orders,

  -- Recent activity
  COUNT(*) FILTER (WHERE o.created_at >= NOW() - INTERVAL '24 hours')             AS orders_last_24h,
  COUNT(*) FILTER (WHERE o.created_at >= NOW() - INTERVAL '7 days')               AS orders_last_7days,

  -- Revenue (last 30 days, paid orders only)
  COALESCE(
    SUM(o.seller_amount) FILTER (
      WHERE o.payment_status = 'paid'
        AND o.created_at >= NOW() - INTERVAL '30 days'
    ), 0
  )                                                                                AS revenue_last_30days,

  -- Payout tracking
  COALESCE(
    SUM(o.seller_amount) FILTER (WHERE o.payout_status = 'completed'), 0
  )                                                                                AS total_payouts_completed,

  COALESCE(
    SUM(o.seller_amount) FILTER (
      WHERE o.payout_status = 'pending'
        AND o.status = 'delivered'
        AND o.payment_status = 'paid'
    ), 0
  )                                                                                AS pending_payouts

FROM sellers s
LEFT JOIN orders o ON o.seller_id = s.id
GROUP BY s.id;

SELECT 'Security fixes applied successfully!' AS message;
