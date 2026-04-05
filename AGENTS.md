# Texis-POS — Agent Instructions

## Monorepo Structure

| Directory | Stack | Entry Point |
|-----------|-------|-------------|
| `backend/` | Go 1.26.1 | `cmd/main.go` |
| `ui/` | Next.js 16.2.2 + React 19 + Tailwind 4 | `src/app/` (App Router) |
| `desktop/` | Tauri v2 + Vite + TypeScript | `desktop/src-tauri/` (Rust), `desktop/src/` (TS) |

## Commands

### Backend (Go)
```bash
cd backend
go mod tidy
go run cmd/main.go
```

### UI (Next.js)
```bash
cd ui
yarn dev          # dev server
yarn build        # production build
yarn lint         # eslint
```

### Desktop (Tauri)
```bash
cd desktop
yarn install
yarn tauri dev    # requires Rust toolchain (rustup)
```

## Key Constraints

- **Go path**: `go` is not in the default PATH. Always prepend `/usr/local/go/bin`.
- **npm cache**: `~/.npm` has permission issues. Prefer `yarn` over `npm`.
- **Next.js 16.2.2**: This is NOT the Next.js in your training data. Read `ui/AGENTS.md` and `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- **Tauri devUrl**: Points to `http://localhost:3000` (the Next.js dev server). The `desktop/` Vite dev server runs on port 1420 but the Tauri config expects the Next.js app for the actual desktop experience.
- **Rust**: Installed via rustup at `~/.cargo/bin`. Source `. "$HOME/.cargo/env"` before using `cargo`/`tauri`.

## Backend Dependencies

- `github.com/gorilla/websocket` — low-latency WebSocket connections
- `go.mau.fi/whatsmeow` — WhatsApp chatbot for order handling
- `github.com/supabase-community/supabase-go` — PostgreSQL via Supabase
- Module: `github.com/erickmx/texis-pos`

## UI Conventions

- TypeScript strict mode, `@/*` path alias → `src/*`
- App Router with `src/app/` directory
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Import alias: `@/*` maps to `./src/*`

## Desktop Conventions

- Vite serves on port 1420 (strict port, no fallback)
- Tauri build output: `desktop/dist/`
- Rust crate: `texis-pos-desktop`, Tauri v2, identifier `com.erickmx.texis-pos`
