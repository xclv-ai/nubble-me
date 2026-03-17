# nubble.me — Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added
- Project management structure: TODO.md, CHANGELOG.md, docs/ reorg
- **AI News Feed Pipeline** — automated content discovery via NotebookLM research
  - `server/feed-pipeline.ts` — standalone script: research → curate → depth gen → JSON
  - `server/feed-routes.ts` — API endpoints: `/api/feed`, `/api/feed/:date`, `/api/feed/dates`, `POST /api/feed/generate`
  - `client/src/pages/feed.tsx` — Perplexity Discover-style card UI (featured/grid/list layout)
  - `client/src/pages/read-feed.tsx` — story reader with NubbleReader + back navigation
  - `npm run feed:generate` script for manual pipeline runs
  - Nubble skill (`~/.claude/skills/nubble/SKILL.md`) for automated daily feed generation
  - First feed: 2026-03-17, 10 AI stories, 4 depth levels each, $0 API cost
- **Digest page** (`/digest`) — all daily stories as one NubbleReader document
  - One section per story, sorted by rank, with full depth control
  - Newspaper icon in NubbleReader header now links to `/digest`

---

## [0.1.0] — 2026-03-15

### Added
- **Web prototype** — 2-axis reader with swipe depth control
  - 4 depth levels per section (summary → condensed → standard → expanded)
  - Horizontal swipe gestures (Framer Motion)
  - Global + per-section depth control
  - Pinch-to-zoom for mobile global depth
  - Keyboard shortcuts (arrow keys, Shift+arrows)
  - Dark mode with smooth transitions
  - Reading time estimate (updates with depth)
  - Depth indicator bar
  - Section navigation rail with tooltips
  - Scroll progress bar
  - Onboarding overlay for first-time users
  - Boundary feedback (edge glow) at min/max depth
- **iOS app (SwiftUI)** — reader shell + content pipeline
  - Full reader with identical gestures to web
  - ePub, PDF, TXT, MD, JSON file import
  - Chunking engine (heading detection, 200-800 word sections)
  - On-device AI depth generation (Foundation Models, iOS 26+)
  - Passthrough fallback for older devices/simulator
  - Haptic feedback, typography system, color themes
- Sample content: "The Paradox of Choice" (6 sections × 4 depths)
- Documentation: Architecture, Product Plan, Tech Stack, iOS Migration Plan
