# Checkpoint: special-requests-actions (Slice 3) — HANDOFF

> Status: SLICE 3 DEFERRED 2026-10-17. An ODD session on 2026-10-17 authorized slice 3,
> ran the question round, and the user deferred ALL THREE actions (WhatsApp, CFDI, Print)
> as placeholders pending dedicated research and planning. No code changes resulted: the
> drawer already renders all three as disabled placeholders (`comingSoon`). See
> "Slice 3 scope — DEFERRED" below for the explore findings the future session needs.
> The follow-ups list further down remains live and is the candidate pool for next work.

## Where the project stands

| Slice | Change | Status | Engram lineage (topic keys `sdd/<change>/*`) |
|---|---|---|---|
| 1 | special-requests-board (kanban) | CLOSED, committed (`8fa3ec3`..`b5b28c4`) | #115–#129 era |
| 2a | special-requests-drawer (view/edit + fiscal) | CLOSED, **UNCOMMITTED** | explore #130, proposal #131, spec #132, design #134, tasks #136, apply #137, verify #138, sync #139, archive #140 |
| 2b | special-requests-create-upload (create form + upload/delete + seller auth) | CLOSED, **UNCOMMITTED** | explore #142, proposal #143, spec #144, design #145, tasks #146, apply #149, verify #150, sync #151, archive #152 |

- Session summary of the 2b cycle: engram #153. Verdicts: both slices PASS WITH WARNINGS, 0 blockers.
- 2a+2b are **COMMITTED** on branch `feat/special-requests-dashboard-drawer-form-part-1` as 3 work units (backend / ui / docs-checkpoint); **push + review are user-owned and pending**.
- Gates green at 2b verify: backend build/vet/test 8/8 packages; UI jest 23 suites 123/123; tsc clean; eslint 8 errors ALL pre-existing in untouched files (baseline improved 9→8).

## FIRST decision for the next session (before slice 3 code)

**DONE — 2a+2b committed as work units.** Remaining user-owned step: push the branch and
review. Slice-3 native review candidates (gentle_review / RDD) = these commits or the
slice-3 work-unit commits on top. Excluded from the commits deliberately: `.atl/*` cache,
`opencode.json` expansion, `.gentle-ai-default-agent.json`, root `package.json`/
`package-lock.json`/`node_modules` (tooling artifacts — the root pair previously hijacked
Turbopack root inference; `ui/next.config.ts` pins turbopack.root since slice 1).

## Slice 3 scope — DEFERRED (question round of 2026-10-17)

User decision, verbatim: "better lets leave just a place holder, this task will be tackled
later with better planning and reasearch, like all the CFDI and mexican tickets
generation". WhatsApp backend send, CFDI, and Print are ALL deferred. Answers given
then superseded by the deferral: WhatsApp = backend send via whatsmeow; roles =
sellers+admins + audit log (the role-guard + audit requirement still stands for whenever
the actions return).

### Explore delta findings (subagent mvd2c64i-2-49db, 2026-10-17)

- **whatsmeow is greenfield**: NOT in `go.mod` despite AGENTS.md listing it as a
  dependency; zero imports in `backend/`; no session store (whatsmeow `sqlstore` needs a
  sqlite or postgres driver; PostgREST cannot host it), no pairing flow, no bootstrap in
  `cmd/main.go`. AGENTS.md's dependency list should be corrected when this work resumes.
- Roles are JWT-only: `auth.RequireRole`/`IsAdmin`/`IsSeller`
  (`backend/internal/auth/middleware.go:47-73`); handlers read `c.Locals("user_role")`;
  no user id in claims — check what JWT `sub` holds before specing the audit "who".
- Route anchor for a future send action: `POST /api/orders/special/:id/whatsapp` in the
  orders group (`backend/internal/orders/handler.go:29-37`); insert pattern
  `backend/internal/infrastructure/db/supabase_order_repo.go:195-262`.
- Schema = flat hand-applied `backend/Supabase_Schema_vN.sql`; no audit table exists;
  service-role key bypasses RLS server-side.
- UI: `ActionsSeam.tsx` receives only `lng` — the order must be threaded as a prop;
  i18n keys already exist; drawer tests `jest.mock("@/lib/api/specialRequests")`, so a
  future `sendWhatsApp` fn slots into that mock block.

### What the future planning session must answer

1. whatsmeow session store: sqlite file (`modernc.org/sqlite`, pure Go) vs direct
   Postgres connection to Supabase for the device store.
2. Pairing: CLI QR at setup vs admin-UI QR page vs pair-code by phone number.
3. Message template: fixed vs template + seller note vs fully custom.
4. CFDI: PAC selection and Mexican ticket-generation requirements.

## Follow-ups to fold in or track separately (from #150/#151/#152)

1. W5/W2: live smoke test vs dev backend — attachment lifecycle roundtrip + seller-JWT create + delete idempotency on a real absent object (also validates 2a W1: PATCH/GET special). STILL OPEN — needs a live dev backend.
2. DONE 2026-10-17 — W1: create-mode X/Escape close assertion added (`RequestDrawer.test.tsx`, "closes create mode on X and Escape."); jest 124/124.
3. DONE 2026-10-17 — W3: production `yarn build` green (exit 0, all routes prerendered).
4. DONE 2026-10-17 — lint debt cleared: 8 errors → 0 (login page/test, Navbar set-state-in-effect, ImageDropZone memoization, ProductForm.test, i18n client/server); tsc clean; three unused-catch-binding warnings removed as a side effect. Navbar keeps a scoped eslint-disable with justification (mount-time auth read is the hydration-safe pattern).
5. DONE 2026-10-17 — RLS posture DECIDED (user): mutations stay backend-only. `backend/Supabase_Schema_v4.sql` documents the decision, adds no policies, and idempotently re-asserts ENABLE RLS on orders + special_requests_details. Hand-applying to the live DB is user-owned.
6. CLOSED in 2b (do not redo): orders auth middleware gap; storage `file`/`image` field bug; png rejection bug.

Commit evidence (2026-10-17 session): `56a83c0` test(ui) W1 · `2e77cb4` fix(ui) lint debt · the RLS posture + this ledger ride in the same docs commit as `Supabase_Schema_v4.sql`.

## Environment facts for the next session

- **gentle-ai is 4.0.0** (Homebrew + gentle-pi package assets consistent). The old SDD CLI
  surfaces (`sdd-attempt`, `sdd-status`, `sdd-continue`) are GONE. Do not call them; do not
  build a local attempt mirror. The new session's injected contract (ODD + `gentle_review`
  RDD lifecycle) is authoritative.
- **Subagents**: full roster exists (`subagent_list_agents`: sdd-*/gentle-ai-*/jd-*/review-*),
  all on `opencode-go/*` models. At 2b time the provider was quota-blocked ("provider auth
  error" at sdd-tasks launch, monthly limit per user). Test with one cheap delegation early;
  if it fails, run inline and say so.
- **Preflight preferences (persisted by usage, reconfirm in-session)**: interactive pace,
  artifact store = engram (user deferred hybrid migration), delivery = single-pr with
  size:exception accepted twice (2a: 1789 lines; 2b: ~2850 diff-churned).
- Artifact store note: all SDD lineage lives in engram only (no `openspec/` dir). Engram
  MCP works from pi and OpenCode; it does NOT work from tools without the engram MCP.

## Conventions & hard-won lessons (apply to slice 3 code)

- Go: `/usr/local/go/bin/go` (not on PATH); UI: `yarn` (npm cache broken); Fiber v3 (`c.Bind().Body`, group middleware `app.Group(prefix, handlers...)`).
- PostgREST: single-line select strings (PGRST100), existence-SELECT before UPDATE (zero-row success quirk), to-one embed tolerated by `SpecialRequestDetails.UnmarshalJSON`, `Insert(value, upsert, onConflict, returning, count)` with `returning="representation"` to get id+folio.
- RHF+zod: plain `register` + `z.preprocess` for numeric fields — NEVER override a registered field's onChange with setValue (breaks error rendering); unregistered controlled fields (DateTimeInput) use watch+setValue; zod messages are i18n keys via `getErrorMessage → t(key)`; schema factories parameterized by key tree (`specialRequest.ts`).
- `react-hooks/set-state-in-effect` is error-tier: reset state in event handlers, timers scheduled from handlers.
- Tri-state nulls: `NullableTime`/`NullableInt` (Set flag) distinguish absent vs explicit JSON null.
- Fiscal rule (both sides, integer cents): IVA = 16% × service_fee ONLY; total = gasto + service + IVA; vector 1200/450 → 72/1722. Go `orders/fiscal.go` ↔ TS `lib/special-requests/fiscal.ts` must stay mirrored.
- DESIGN.md: glassmorphism 85% opacity + 24px blur, gradient dark-blue headers, NO 1px borders, `secondary_container` orange only for urgency.
- Tests: Go table-driven with testify; real signed JWTs for auth tests (never mock the middleware being verified); RTL jest with `mock`-prefixed out-of-scope variables in `jest.mock` factories; re-query inputs after form remounts (stale-node trap); jest 30 flag is `--testPathPatterns`.
- i18n: keys under `specialRequests.*` in `ui/public/locales/{es,en}/common.json`; verify completeness with the scripted key-extraction check used in 2a/2b verify.

## Resume recipe (next session)

1. `mem_context` → `mem_search "special-requests checkpoint"` → this checkpoint + #153.
2. Read this file (`odd/tasks/special-requests-actions.md`).
3. Confirm the branch was pushed/reviewed; slice-3 work-unit commits stack on top.
4. Subagent quota CONFIRMED RESET 2026-10-17 (gentle-ai-explore probe returned ok);
   roster usable: gentle-ai-explore/worker/verify + review-* + jd-*.
5. Slice 3 is DEFERRED — do not plan or implement it without the research answers in
   "What the future planning session must answer". Next work = the follow-ups list below,
   or revive the deferred scope once whatsmeow/CFDI research exists.
