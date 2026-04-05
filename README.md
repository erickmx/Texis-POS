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

### Desktop

```bash
cd desktop
yarn install
yarn tauri dev
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Go, gorilla/websocket, whatsmeow, supabase-go |
| Web UI | Next.js 16.2.2, React 19, Tailwind CSS |
| Desktop | Tauri v2, TypeScript, Vite |
| Database | PostgreSQL (via Supabase) |
