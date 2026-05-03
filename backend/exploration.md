## Exploration: Inventory API & Image Storage

### Current State
- Backend is an empty Go 1.26.1 project with `go.mod` initialized.
- `Supabase_Schema_v1.sql` provides the `products` table with `image_url`.
- `AGENTS.md` specifies `github.com/supabase-community/supabase-go` as the client.

### Affected Areas
- `backend/internal/inventory/` — Product CRUD handlers and logic.
- `backend/internal/storage/` — Image storage logic (Supabase Storage).
- `backend/internal/auth/` — Mocked role validation.
- `backend/cmd/main.go` — API entry point and router setup.

### Approaches
1. **Modular Monolith (Screaming Architecture)** — Keep inventory and storage logic independent as requested.
   - Pros: Clean separation, easy to test, scales well.
   - Cons: Slightly more boilerplate.
   - Effort: Medium

2. **Simple Layered (MVC-ish)** — Controllers, Services, Models.
   - Pros: Faster to implement initially.
   - Cons: Can become a "big ball of mud" if not careful.
   - Effort: Low

### Recommendation
Use **Screaming Architecture** with a clear separation between `inventory` and `storage`. Use `chi` for routing (lightweight, standard-compatible).

### Risks
- **Storage Consistency:** Ensuring images in Supabase Storage match the `image_url` in the database.
- **Supabase-go Maturity:** Ensuring the library supports all required storage operations.

### Ready for Proposal
No — I need to clarify a few things before generating the PRD.
