-- Supabase Schema v3 — special_requests_details sync
--
-- The slice-1 migration (title, phase, progress_pct, completed_at) was applied
-- directly to the live database and never committed to the repository. This
-- file syncs the repo schema docs with the live state. Idempotent (IF NOT EXISTS).
--
-- Base table created in Supabase_Schema_v1.sql:
--   special_requests_details(order_id UUID PK -> orders.id, task_description,
--   deadline TIMESTAMPTZ, gasto_terceros DECIMAL(10,2) DEFAULT 0,
--   service_fee DECIMAL(10,2) DEFAULT 0, attachments TEXT[])

ALTER TABLE special_requests_details
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS progress_pct INTEGER,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- fiscal data lives on the base table from v1 (no change needed here):
--   gasto_terceros: non-taxable third-party passthrough
--   service_fee: taxable labor (IVA base)
-- total_amount on orders = gasto_terceros + service_fee + 16% * service_fee
-- (derived by the backend on PATCH /api/orders/:id/details).
