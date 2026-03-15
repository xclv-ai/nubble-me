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
