-- Migration 016: Dynamic scan-and-fix for ALL remaining RLS auth() performance issues
--
-- Migration 015 covered policies defined in our migration files.
-- This migration scans pg_policies directly and fixes EVERY remaining policy
-- in the public schema that still calls auth.uid() / auth.role() / auth.jwt()
-- without the (SELECT ...) wrapper.
--
-- Idempotent — safe to re-run. Skips already-fixed policies.
-- Catches all policies regardless of how or when they were created.

DO $$
DECLARE
  r       RECORD;
  fq      TEXT;    -- fixed USING expression
  fc      TEXT;    -- fixed WITH CHECK expression
  cmd_str TEXT;
  stmt    TEXT;
  cnt     INTEGER := 0;
  err_cnt INTEGER := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
    FROM   pg_policies
    WHERE  schemaname = 'public'
      AND  (
              -- qual has an unwrapped auth call
              (qual IS NOT NULL
               AND qual ~ 'auth\.(uid|role|jwt)\(\)'
               AND qual !~ 'SELECT auth\.')
           OR
              -- with_check has an unwrapped auth call
              (with_check IS NOT NULL
               AND with_check ~ 'auth\.(uid|role|jwt)\(\)'
               AND with_check !~ 'SELECT auth\.')
           )
    ORDER BY tablename, policyname
  LOOP
    fq := r.qual;
    fc := r.with_check;

    -- Wrap each auth function call in (SELECT ...) to prevent per-row re-evaluation
    IF fq IS NOT NULL THEN
      fq := regexp_replace(fq, 'auth\.uid\(\)',  '(SELECT auth.uid())',  'g');
      fq := regexp_replace(fq, 'auth\.role\(\)', '(SELECT auth.role())', 'g');
      fq := regexp_replace(fq, 'auth\.jwt\(\)',  '(SELECT auth.jwt())',  'g');
    END IF;
    IF fc IS NOT NULL THEN
      fc := regexp_replace(fc, 'auth\.uid\(\)',  '(SELECT auth.uid())',  'g');
      fc := regexp_replace(fc, 'auth\.role\(\)', '(SELECT auth.role())', 'g');
      fc := regexp_replace(fc, 'auth\.jwt\(\)',  '(SELECT auth.jwt())',  'g');
    END IF;

    cmd_str := CASE r.cmd
      WHEN 'SELECT' THEN 'FOR SELECT'
      WHEN 'INSERT' THEN 'FOR INSERT'
      WHEN 'UPDATE' THEN 'FOR UPDATE'
      WHEN 'DELETE' THEN 'FOR DELETE'
      ELSE               'FOR ALL'
    END;

    -- Each policy is fixed atomically; failures skip that policy without aborting
    BEGIN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        r.policyname, r.tablename
      );

      stmt := format(
        'CREATE POLICY %I ON public.%I AS %s %s',
        r.policyname, r.tablename, r.permissive, cmd_str
      );

      -- Only add USING clause if it exists (not present on INSERT-only policies)
      IF fq IS NOT NULL THEN
        stmt := stmt || ' USING (' || fq || ')';
      END IF;

      -- Only add WITH CHECK clause if it exists
      IF fc IS NOT NULL THEN
        stmt := stmt || ' WITH CHECK (' || fc || ')';
      END IF;

      EXECUTE stmt;

      cnt := cnt + 1;
      RAISE NOTICE 'Fixed: "%" on table "%"', r.policyname, r.tablename;

    EXCEPTION WHEN OTHERS THEN
      err_cnt := err_cnt + 1;
      RAISE WARNING 'Could not fix "%" on "%": %', r.policyname, r.tablename, SQLERRM;
    END;

  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Done: % policies fixed, % errors ===', cnt, err_cnt;
END $$;


-- ── Verification query ────────────────────────────────────────────────────────
-- Run this after the DO block to confirm zero remaining issues.
-- Should return 0 rows if all policies are fixed.

SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM   pg_policies
WHERE  schemaname = 'public'
  AND  (
          (qual IS NOT NULL
           AND qual ~ 'auth\.(uid|role|jwt)\(\)'
           AND qual !~ 'SELECT auth\.')
       OR (with_check IS NOT NULL
           AND with_check ~ 'auth\.(uid|role|jwt)\(\)'
           AND with_check !~ 'SELECT auth\.')
       )
ORDER BY tablename, policyname;
