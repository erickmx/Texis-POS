-- Supabase Schema v4 — RLS mutation posture for orders + special_requests_details
--
-- Decision (2026-10-17, follow-up from slice 1): direct PostgREST mutations stay
-- BACKEND-ONLY. This file documents that decision and guards the gate; it adds NO
-- new policies and REVOKEs nothing. Idempotent: safe to re-apply.
--
-- Current posture (from Supabase_Schema_v1.sql):
--   orders                    : SELECT + INSERT for auth.role() = 'authenticated'
--   special_requests_details  : SELECT + INSERT for auth.role() = 'authenticated'
--   (order_items shares the same SELECT + INSERT-only posture)
--
-- UPDATE and DELETE policies are INTENTIONALLY ABSENT on both tables. With RLS
-- enabled, an absent policy is an implicit deny for the anon/authenticated roles,
-- so no client can mutate or delete rows through PostgREST directly.
--
-- Why: all writes flow through the Go backend (service-role key, which bypasses
-- RLS). Business invariants live there and MUST NOT be bypassable:
--   - fiscal totals derivation (total = gasto + service_fee + 16% * service_fee)
--     on PATCH /api/orders/:id/details
--   - order status transitions on PATCH /api/orders/:id/status
--   - attachment lifecycle (storage object + attachments[] array kept in sync)
--
-- If a future client needs direct PostgREST writes, add explicit UPDATE/DELETE
-- policies here AFTER deciding which invariants may be bypassed — never copy the
-- products/categories CRUD pattern onto these tables by default.

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_requests_details ENABLE ROW LEVEL SECURITY;

-- Verification (run by hand after applying; expect SELECT+INSERT policies only):
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('orders', 'special_requests_details')
--   ORDER BY tablename, cmd;
