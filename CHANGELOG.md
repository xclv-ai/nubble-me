# nubble.me — Changelog

All notable changes to this project. Format: [Keep a Changelog](https://keepachangelog.com/).

---

## [iOS 1.2.0 (3) — 2026-10-13] — Dr HAOS's rounds

### Added
- **Rounds tab** — Dr HAOS's daily rounds for the founder's product in POKPOK's design system (Instrument Serif + JetBrains Mono, colour rhythm, 4 px notch, squares, tickers, the cat): patient chart, the noise grid (one square per story), the scan list, three signals then discharge.
- **Signal pages** — headline in Instrument Serif, the story's number as the hero (money / % / magnitude words only), Dr HAOS's verdict, the ℞ in yellow with "Prescribe → my list" (also a Reminder in the "Dr HAOS ℞" list) and "Why?".
- **Code red** — any story naming a competitor from Settings → Watchlist is pinned first, red, with Symptom / Diagnosis / Seen / Threat.
- **Why? sheet** — the five depth levels (Summary · Condensed · Article · Expanded · For you) as an evidence sheet; Uncomfortable Truth on pink.
- **Discharged** — today's prescriptions (tap a square = done), weekly vitals, watchlist.
- **Widget** (Lock Screen rectangular/inline, Home small) — next ℞ and a red mark when a competitor moved.
- Dr HAOS's lines written on-device after the levels (headline, action, verdict, ℞), with one cold rewrite when the model reaches for hype; ranking "High = the founder must act this week"; writer version forces rewrites after prompt changes.

### Fixed
- Page pushed off the left edge (grid minimum widths), footer under the tab bar, truncated headlines, double top inset.

## [iOS 1.1.0 (2) — 2026-10-12]

### Fixed
- **iOS build shipped without the news feed** — `Nubble.xcodeproj` listed only the pre-feed files, so `NewsFeedView`, `SettingsView` and background refresh never compiled. Project is now regenerated from `ios/project.yml` (`xcodegen generate`).
- **iOS feed pointed at `http://localhost:5000`** — replaced by reading sources on the phone.

### Added (iOS)
- **News straight from sources on the iPhone** — `RSSParser` (Foundation `XMLParser`, RSS + Atom), `LocalFeedService`; 15 starting sources (AI + commerce + marketing), last 14 days, editable in Settings → Sources; add any site by address (finds its feed).
- **All levels written on-device by Apple Intelligence** (`NewsDepthWriter`, Foundation Models, no paid API): fact sheet first (one session per part, Apple TN3193 4,096-token window), then Summary + Condensed, Expanded (WHAT'S GOING ON / WHY THIS IS A BIG DEAL / UNCOMFORTABLE TRUTH / SO WHAT), each in its own session with guided generation so every block is present.
- **Level 4 "My product"** — HOW THIS HITS ‹PRODUCT› / MOVES TO CONSIDER / THE RISK OF SITTING THIS OUT, same format as the web pokpok.ai personalized feed; product described on-device from the URL the user gives (Settings → My product, editable).
- **Relevance ranking** — `NaturalLanguage` sentence embeddings vs the product description; "Most relevant to ‹product›" at the top of the feed.
- **Background** — hourly source refresh; while charging, levels for the most relevant stories are written and a notification says they're ready.
- **Share extension** — Share → Nubble from Safari saves the page (App Group `group.me.nubble.app`).

## [Unreleased]

### Fixed
- **Dirty feed data** — `nlm notebook query` returns JSON wrapper `{value:{answer:"..."}}` even without `--json` flag. `runNLM` now extracts `parsed.value.answer` for query responses
- **Nightly pipeline broken** — `nlm research status` was blocking for 5min inside a 30s timeout, killing every run. Added `--max-wait 0` so pipeline's own polling loop handles retries
- **Import timeout** — increased from 120s → 300s to handle concurrent pipelines and large source sets
- **Re-generated all 4 feeds** with clean text — no `[1]` citations, no `\u2014` escaped unicode, no `conversation_id` metadata leaks

### Changed
- **Source import: top 25 only** — pipeline imports top 25 sources via `--indices` flag instead of all 150-200 (eliminates timeouts, reduces noise)
- **Notebook retention** — pipeline no longer deletes notebooks after runs; kept for 1 week review
- **Research timeout** — increased from 10min to 15min for branding/ecommerce deep research
- **Schedule: Mon+Thu at 06:00** — changed from daily to every 3 days to avoid NLM overuse and improve output stability

### Added
- **4th feed category: a16z AI Portfolio** — tracks latest from a16z-backed AI startups (Replit, Lio, Reducto, Temporal, etc.)
- `server/feed-continue.ts` — resume pipeline from existing notebook (skip create+research+import)
- Nightly automation now runs all 4 categories (was 3)
- Generated 2026-03-19 feeds: 40 stories across 4 categories, all with audio + infographic
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
