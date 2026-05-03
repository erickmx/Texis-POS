## Exploration: Backend Security and Fiber v3 Migration

### Current State
The backend uses Go Fiber v2.52.13. Security is minimal, only using `logger` and `recover` middlewares. Authentication is mocked with a basic `IsAdmin` middleware. There is no CORS configuration, rate limiting, or security headers (Helmet).

### Affected Areas
- `backend/go.mod` — Needs to upgrade to `github.com/gofiber/fiber/v3`.
- `backend/cmd/main.go` — App initialization and middleware setup.
- `backend/internal/auth/middleware.go` — Middleware signature update.
- `backend/internal/inventory/handler.go` — Handler signature and BodyParser update.
- `backend/internal/storage/handler.go` — Handler signature update.

### Approaches
1. **Manual Migration and Security Implementation** — Update Fiber to v3 manually, refactor handlers to use `fiber.Ctx` (value type) and `c.Bind().Body()`, and add security middlewares.
   - Pros: Precise control, ensures everything is updated according to project standards.
   - Cons: More turn-intensive.
   - Effort: Medium

### Recommendation
Proceed with manual migration. This allows for surgical updates and ensures the new security policies (CORS whitelist, low rate limit) are correctly applied using environment variables.

### Risks
- **Breaking Changes**: Fiber v3 has significant changes (Ctx as interface, ListenConfig, etc.).
- **Dependency Conflicts**: Other supabase-go or storage-go packages might have compatibility issues (though unlikely for these specific ones).

### Ready for Proposal
Yes. I have a clear path for upgrading to Fiber v3 and implementing the requested security features.
