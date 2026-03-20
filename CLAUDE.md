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
  pages/home.tsx                # Homepage with category selector cards
  pages/ai-digest.tsx           # AI News feed → NubbleReader (fetches /data/feed/ai-news/latest.json)
  pages/ai-branding.tsx         # AI & Branding feed → NubbleReader (fetches /data/feed/ai-branding/latest.json)
  pages/digest.tsx              # Legacy redirect → /ai-digest
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
1. Creates notebook → runs deep research (~5-10min, finds 150-200 sources)
2. Imports top 25 most relevant sources (via `--indices` flag)
3. Queries for top 10 stories ranked by importance
4. Generates 3 depth levels per story (summary/condensed/expanded) + standard
5. Generates podcast audio + infographics
6. Saves to `client/public/data/feed/{category}/{YYYY-MM-DD}.json` + `latest.json`
7. Notebooks kept for 1 week review (NOT deleted)

### Feed Routes
- `GET /api/nubble-feed` — latest feed
- `GET /api/nubble-feed/:date` — specific date
- `GET /api/nubble-feed/dates` — available dates
- `POST /api/nubble-feed/generate` — trigger pipeline (async)

### iOS RSS Feed Routes (from `server/feed.ts`)
- `GET /api/feed` — aggregated RSS articles (supports `?topics=`, `?limit=`, `?offset=`)
- `POST /api/feed/refresh` — manually trigger RSS refresh
- `GET /api/feed/sources` — list feed sources
- `GET /api/feed/topics` — list available topics

### Feed UI
- `/` — homepage with category selector cards ("AI News Nubs", "AI and Strategic Branding Nubs")
- `/ai-digest` — AI News weekly digest in NubbleReader (fetches from `/data/feed/ai-news/latest.json`)
- `/ai-branding` — AI & Strategic Branding digest in NubbleReader (fetches from `/data/feed/ai-branding/latest.json`)
- `/feed` — card grid: featured (rank 1), grid (2-4), list (5-10)
- `/read-feed/:id` — story in NubbleReader with back button
- `/digest` — redirects to `/ai-digest` (legacy)

### Feed Categories
- `ai-news` — general AI news, LLM releases, breakthroughs
- `ai-branding` — AI adoption at branding agencies (WPP, Landor, FutureBrand), AI marketing tools, M&A
- `a16z-portfolio` — latest from a16z-backed AI startups (Replit, Lio, Reducto, etc.)

### Feed Data Structure
- `client/public/data/feed/ai-news/` — AI news JSON files + latest.json
- `client/public/data/feed/ai-branding/` — AI branding JSON files + latest.json
- `client/public/data/feed/ai-ecommerce/` — AI ecommerce JSON files + latest.json
- `server/data/feed/ai-news/` — server-side mirror
- `server/data/feed/ai-branding/` — server-side mirror
- `server/data/feed/ai-ecommerce/` — server-side mirror

### Supabase Storage
- Table: `nubble_feed` on pokpok project (iyyuxilkacylpbweulsa)
- Columns: date, category, story_rank, title, source, source_url, why_it_matters, summary, condensed, standard, expanded
- Pipeline upserts to Supabase after saving JSON (requires SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local)

### Weekly Automation
- Script: `server/feed-nightly.sh` — runs all 4 categories sequentially, commits + pushes to trigger Vercel deploy
- Schedule: macOS launchd **Monday at 06:00 AM** (`~/Library/LaunchAgents/com.nubble.feed-nightly.plist`)
- Logs: `server/data/feed/nightly-YYYY-MM-DD.log`
- Mac must be on/awake at 6 AM Monday (launchd catches up on missed jobs when Mac wakes)
- Each category takes ~12 min (research + top 25 import + queries), total ~50 min for all 4

#### Commands
```bash
# Run weekly feed manually (all 4 categories)
npm run feed:nightly

# Run single category
npx tsx server/feed-pipeline.ts --category ai-news
npx tsx server/feed-pipeline.ts --category ai-branding
npx tsx server/feed-pipeline.ts --category ai-ecommerce

# Check launchd schedule
launchctl list | grep nubble

# Reload launchd (after editing plist)
launchctl unload ~/Library/LaunchAgents/com.nubble.feed-nightly.plist
launchctl load ~/Library/LaunchAgents/com.nubble.feed-nightly.plist

# Check latest log
cat server/data/feed/nightly-$(date +%Y-%m-%d).log
```

#### What the nightly script does
1. Runs NotebookLM pipeline for ai-news, ai-branding, ai-ecommerce
2. Each run: create notebook → deep research (~5min, 40-80 sources) → import → rank top 10 → generate 4 depths → save JSON + upsert Supabase
3. Commits feed files + pushes to GitHub → triggers Vercel deploy
4. Cleans up NotebookLM notebooks after each run

### Key Files
- `server/feed-pipeline.ts` — standalone pipeline script
- `server/feed-routes.ts` — Express routes
- `client/src/pages/feed.tsx` — feed card UI
- `client/src/pages/read-feed.tsx` — story reader
- `server/data/feed/` — JSON output directory
- NLM CLI: `/Users/v.konovalov/.local/bin/nlm`
