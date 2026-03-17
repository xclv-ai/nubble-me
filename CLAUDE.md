# CLAUDE.md

## Project Overview

**nubble.me** is a 2-axis reading interface. Readers **scroll vertically** through sections and **swipe left/right** to control content depth per section. Every section exists at 4 depth levels:

- **Depth 0 (Summary):** 1 sentence, ~20 words
- **Depth 1 (Condensed):** 2-3 sentences, key points
- **Depth 2 (Standard):** Original text, normal reading
- **Depth 3 (Expanded):** Deep dive with examples, +50-100% content

Current state: **web prototype** with hardcoded sample content ("The Paradox of Choice"). Target: native iOS app using SwiftUI + on-device AI.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Framer Motion (gestures/animations), Tailwind CSS 3
- **Backend:** Express 5 + Node, Drizzle ORM (PostgreSQL), Passport (auth skeleton)
- **Build:** Vite (client) + esbuild (server), custom `script/build.ts`
- **Routing:** wouter (hash-based SPA routing)
- **UI primitives:** Radix UI components in `client/src/components/ui/`

## Project Structure

```
client/src/
  components/NubbleReader.tsx   # Core reader: gestures, state, animations (790 lines)
  components/ui/                # 45 Radix UI primitive components (shadcn/ui)
  pages/home.tsx                # Renders NubbleReader with sample document
  lib/sample-content.ts         # ContentSection/ContentDocument types + sample data
  App.tsx                       # Router setup
server/
  index.ts                      # Express app, middleware, logging
  routes.ts                     # API routes (placeholder)
  storage.ts                    # IStorage interface + MemStorage
  vite.ts                       # Vite dev server middleware
shared/
  schema.ts                     # Drizzle ORM schema (users table), Zod validation
docs/
  ARCHITECTURE.md               # Content pipeline: extraction → chunking → AI depth generation
  PRODUCT_PLAN.md               # Vision, roadmap, freemium model
  TECH_STACK.md                 # React → SwiftUI migration patterns
ads/                            # Marketing copy and manifestos
script/build.ts                 # Custom build: Vite + esbuild bundling
```

## Commands

- `npm run dev` — Start dev server (Express + Vite HMR, port 5000)
- `npm run build` — Production build (client → dist/public, server → dist/index.cjs)
- `npm run start` — Run production build
- `npm run check` — TypeScript type checking (`tsc --noEmit`)
- `npm run db:push` — Push Drizzle schema to database

## Path Aliases

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

## Key Architecture Details

- **NubbleReader.tsx** is the heart of the app — all gesture handling, depth state, animations, scroll tracking, and section rendering live here
- **Content model:** `ContentSection` has fields `summary`, `condensed`, `standard`, `expanded` mapping to depths 0-3
- **State:** Global depth (0-3) + per-section overrides stored as `Map<string, number>`
- **Gestures:** Framer Motion `drag` for swipe, pinch-to-zoom for mobile global depth, keyboard arrows
- **Dark mode:** Class-based toggle on `<html>`, persisted in component state
- **No tests currently** — prototype stage

## Code Style

- TypeScript strict mode
- Functional React components with hooks
- Tailwind for styling (no CSS modules)
- `cn()` utility from `lib/utils.ts` for merging Tailwind classes
- ESM (`"type": "module"` in package.json)

## Project Management

### File Roles
| File | Purpose | When to update |
|------|---------|----------------|
| `CLAUDE.md` | **Brain** — project context, rules, architecture for Claude Code | When tech stack, structure, or conventions change |
| `TODO.md` | **Tasks** — active sprint, bugs, feature requests, backlog | Every new task/bug/feature request. Move done items to CHANGELOG |
| `CHANGELOG.md` | **History** — what shipped and when | When completing work from TODO.md |
| `docs/PRODUCT_PLAN.md` | Vision, target users, phases, business model | When product direction changes |
| `docs/ARCHITECTURE.md` | Content pipeline, data model, .nubble format | When architecture decisions are made |
| `docs/TECH_STACK.md` | Web vs iOS stack, migration patterns | When stack changes |
| `docs/IMPLEMENTATION_STATUS.md` | iOS build status per phase/component | After iOS development sessions |

### Workflow Rules
- **Every new task/bug**: Add to `TODO.md` first, then work on it
- **Every completed item**: Move from `TODO.md` → `CHANGELOG.md` under `[Unreleased]`
- **Feature requests**: Add to `TODO.md` under Feature Requests, tagged `[web]`, `[ios]`, or `[both]`
- **Bug reports**: Add to `TODO.md` under Bugs with priority `[P0]` (blocker), `[P1]` (important), `[P2]` (nice to fix)
- **Before starting work**: Check `TODO.md` Active Sprint for current priorities
- **Web vs iOS**: This conversation focuses on **web version** (`client/`, `server/`, `shared/`). iOS code lives in `ios/`

### Platforms
- **Web** (current focus): React + Vite + Express, deployed on Vercel
- **iOS**: SwiftUI + Foundation Models, see `docs/IMPLEMENTATION_STATUS.md`

## AI News Feed

### Pipeline (`npm run feed:generate`)
NotebookLM-powered, $0/month:
1. Creates notebook → runs deep research (~5min, finds 40-80 sources)
2. Imports sources → queries for top 10 stories ranked by importance
3. Generates 3 depth levels per story (summary/condensed/expanded) + standard
4. Saves to `server/data/feed/{YYYY-MM-DD}.json`
5. Cleans up notebook

### Feed Routes
- `GET /api/feed` — latest feed
- `GET /api/feed/:date` — specific date
- `GET /api/feed/dates` — available dates
- `POST /api/feed/generate` — trigger pipeline (async)

### Feed UI
- `/feed` — card grid: featured (rank 1), grid (2-4), list (5-10)
- `/read-feed/:id` — story in NubbleReader with back button

### Key Files
- `server/feed-pipeline.ts` — standalone pipeline script
- `server/feed-routes.ts` — Express routes
- `client/src/pages/feed.tsx` — feed card UI
- `client/src/pages/read-feed.tsx` — story reader
- `server/data/feed/` — JSON output directory
- NLM CLI: `/Users/v.konovalov/.local/bin/nlm`
