# Texis-POS

Texis stationery store Point of Sale application. A monorepo with:

- **Backend**: Golang with WebSocket support, WhatsApp chatbot (whatsmeow), and Supabase integration
- **UI**: Next.js 16.2.2 + React 19 web application
- **Desktop**: Tauri v2 desktop application

## Project Structure

```
Texis-POS/
├── backend/          # Go backend (Go 1.26.1)
│   ├── cmd/          # Application entrypoints
│   ├── internal/     # Private application code
│   └── pkg/          # Public library code
├── ui/               # Next.js web application
├── desktop/          # Tauri v2 desktop application
│   ├── src/          # Frontend source
│   └── src-tauri/    # Rust/Tauri backend
├── .gitignore
├── LICENSE
└── README.md
```

## Prerequisites

- **Go** 1.26.1+
- **Node.js** 24.14.1
- **Yarn** 1.22+
- **Rust** 1.70+ (for Tauri)

## Getting Started

### Backend

```bash
cd backend
go mod tidy
go run cmd/main.go
```

### UI (Web)

```bash
cd ui
yarn install
yarn dev
```

#### Desktop (Tauri)

The desktop app connects to the Next.js frontend (`ui`) and the Go backend (`backend`).

#### Development Mode

To run and test the desktop application in development mode:

1. **Start the Backend Go Server**:
   ```bash
   cd backend
   go run cmd/main.go
   ```
2. **Start the Next.js Frontend Dev Server**:
   Tauri's dev configuration relies on the running Next.js dev server on port `3000`.
   ```bash
   cd ui
   yarn dev
   ```
3. **Run the Tauri App**:
   In another terminal, start the Tauri dev environment:
   ```bash
   cd desktop
   yarn tauri dev
   ```

#### Production Mode (Static Compilation & Installation Bundles)

Tauri v2 requires the Next.js frontend to be statically exported (`output: 'export'`) because the desktop app loads static HTML/CSS/JS files directly without a Next.js server.

You can automate the build using the provided release script:
```powershell
# In PowerShell (Windows / macOS / Linux)
cd desktop
./scripts/build-release.ps1
```

Or you can compile manually in two steps:

1. **Build and statically export the Next.js UI** (using the `TAURI_BUILD=true` flag):
   ```bash
   cd ui
   TAURI_BUILD=true yarn build
   ```
   This generates the static files in `ui/out/`.
2. **Build and bundle the Tauri App**:
   ```bash
   cd desktop
   yarn tauri build
   ```
   The compiled executables and installers (MSI / EXE for Windows, DMG / APP for macOS) will be generated in `desktop/src-tauri/target/release/bundle/`.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Go, gorilla/websocket, whatsmeow, supabase-go |
| Web UI | Next.js 16.2.2, React 19, Tailwind CSS |
| Desktop | Tauri v2, TypeScript, Vite |
| Database | PostgreSQL (via Supabase) |
