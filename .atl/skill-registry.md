# Skill Registry — texis-pos

## Project Standards

### UI Conventions (from AGENTS.md, GEMINI.md, DESIGN.md)
- Stack: Next.js 16.2.2 + React 19 + Tailwind 4
- Design: "The Curated Folio"
- No 1px solid borders. Use background shifts (`surface_container_low` #f3f3f3) or white space.
- White space: min 24px between groups, 16px between items.
- Glassmorphism: 85% opacity + 24px blur for overlays.
- Roundedness: `xl` (0.75rem) for cards, `sm` (0.125rem) for small elements.
- Typography: Plus Jakarta Sans (headlines), Work Sans (body).
- Colors: Talavera Blue (#0055a4), Cempasúchil Orange (#fd9000).

### Backend Conventions
- Stack: Go 1.26.1
- Modules: gorilla/websocket, whatsmeow, supabase-go.

## User Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| caveman | /caveman, "talk like caveman" | .agents/skills/caveman/SKILL.md |
| caveman-commit | staging changes, "write a commit" | .agents/skills/caveman-commit/SKILL.md |
| caveman-compress | "compress memory file" | .agents/skills/caveman-compress/SKILL.md |
| caveman-help | "caveman help", /caveman-help | .agents/skills/caveman-help/SKILL.md |
| caveman-review | PR review, "review code" | .agents/skills/caveman-review/SKILL.md |
| golang-pro | Go files, concurrency, gRPC | .agents/skills/golang-pro/SKILL.md |
| rust-engineer | Rust files, Cargo, async Rust | .agents/skills/rust-engineer/SKILL.md |
| tauri-v2 | tauri.conf.json, src-tauri, invoke | .agents/skills/tauri-v2/SKILL.md |
| vercel-composition-patterns | React components, compound components | .agents/skills/vercel-composition-patterns/SKILL.md |
| vercel-react-best-practices | React/Next.js performance, hooks | .agents/skills/vercel-react-best-practices/SKILL.md |

## Compact Rules

### vercel-react-best-practices
- Avoid boolean prop proliferation; use composition.
- Use explicit variants for component states.
- Follow React 19 patterns (no forwardRef needed for refs as props).

### vercel-composition-patterns
- Prefer children over render props where possible.
- Use context for compound component state.
- Lift state to the nearest common ancestor.

### tauri-v2
- Use `invoke` for Rust commands.
- Configure capabilities in `capabilities/*.json`.
