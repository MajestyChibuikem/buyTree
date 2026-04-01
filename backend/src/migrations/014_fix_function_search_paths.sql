-- Migration 014: Fix mutable search_path on all trigger/utility functions
--
-- A function without a pinned search_path is vulnerable to search_path injection:
-- a malicious user who can create objects in any schema on the search_path could
-- shadow system functions and have them run with elevated privileges.
--
-- Fix: ALTER FUNCTION ... SET search_path = public
-- This pins every function to the public schema, which is where all our tables live.
-- The service_role key the backend uses is unaffected.
--
-- All six functions below are trigger functions (return TRIGGER) that were
-- created directly in Supabase and are missing the search_path pin.

ALTER FUNCTION public.set_cancellation_deadline()
  SET search_path = public;

ALTER FUNCTION public.track_order_status_change()
  SET search_path = public;

ALTER FUNCTION public.update_order_status_timestamp()
  SET search_path = public;

ALTER FUNCTION public.update_product_favorites_count()
  SET search_path = public;

ALTER FUNCTION public.update_product_rating_stats()
  SET search_path = public;

ALTER FUNCTION public.update_review_helpful_count()
  SET search_path = public;

SELECT 'Function search_path fixes applied successfully!' AS message;
