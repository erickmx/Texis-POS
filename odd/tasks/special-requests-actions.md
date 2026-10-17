# Checkpoint: special-requests-actions (Slice 3) — HANDOFF

> Status: SEED CHECKPOINT saved 2026-09-05 at the end of slice 2b. Slice 3 is NOT yet
> authorized, scoped, or planned — this document hands off state so the next session
> resumes cleanly under the gentle-ai 4.0.0 ODD workflow (and subagents once the
> opencode-go quota resets). Replace/rebuild this file through ODD planning when slice 3
> is authorized; do not treat it as an approved task list.

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

## Slice 3 scope (candidate — needs authorization + question round)

Make the inert `ActionsSeam` real (2a design decision 7 built it as a single replaceable
component): **WhatsApp / CFDI / Print** actions on special orders.

Known anchors (verified through 2b):
- `ui/src/components/special-requests/drawer/ActionsSeam.tsx` — three disabled buttons, i18n keys exist (`specialRequests.drawer.actions.*` + `comingSoon`).
- `customer_wa` is exposed end-to-end since 2a (orders table → GET /special → drawer header) → WhatsApp deep-link (`https://wa.me/<phone>`) is nearly free client-side.
- Backend already depends on `go.mau.fi/whatsmeow` (AGENTS.md) — a backend-sent message flow is possible but much larger.
- `orders.fiscal_uuid` column exists (v1 schema, unused so far) → CFDI action has a natural anchor; real CFDI issuance likely needs an external PAC service — product decision required.
- Print: browser print view vs PDF generation — product decision required.

Open product questions for the proposal round: per-action behavior (deep link vs backend
send; CFDI issue vs view vs link; print scope), roles allowed, audit/persistence needs.

## Follow-ups to fold in or track separately (from #150/#151/#152)

1. W5/W2: live smoke test vs dev backend — attachment lifecycle roundtrip + seller-JWT create + delete idempotency on a real absent object (also validates 2a W1: PATCH/GET special).
2. W1: create-mode X/Escape close assertion (~6 lines, `RequestDrawer.test.tsx`).
3. W3: production `yarn build` never run for 2a/2b.
4. Lint debt: 8 pre-existing errors in untouched files (login page/test ×3, Navbar set-state-in-effect, ImageDropZone, ProductForm.test, i18n client/server ×2).
5. RLS UPDATE/DELETE policies on orders + special_requests_details (defense-in-depth; service-role bypasses) — open since slice 1.
6. CLOSED in 2b (do not redo): orders auth middleware gap; storage `file`/`image` field bug; png rejection bug.

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
4. Probe subagent quota with one cheap delegation; fall back inline if blocked.
5. Run the new ODD flow for slice 3: authorize → explore (delta over #142; anchors above) → question round (product decisions above) → plan (`odd/tasks/` per new contract) → implement per task with work-unit commits → review via `gentle_review` RDD lifecycle on committed candidates → close.
