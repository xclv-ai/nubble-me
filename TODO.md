# nubble.me — TODO

> Single source of truth for all tasks, bugs, and feature requests.
> Mark `- [x]` when done, move to CHANGELOG.md with date.

---

## 🔥 Active Sprint

<!-- Current focus. Max 3-5 items. -->

- [ ] User testing with 20+ people (Phase 1 validation)
- [ ] Shareable link to specific section+depth

---

## Bugs

<!-- Format: `- [ ] [P0/P1/P2] Description — where/how to reproduce` -->

- [ ] [P1] On-device AI untested — Foundation Models fails in simulator, needs physical device
- [ ] [P2] ePub DRM — no detection, DRM-protected ePubs fail silently
- [ ] [P2] Large PDFs — no background processing for 500+ page documents

---

## Feature Requests

<!-- Format: `- [ ] [web|ios|both] Description — context/why` -->

### Web
- [ ] [web] URL paste → nubbled article (content pipeline for web)
- [ ] [web] Share sheet / bookmarklet for browser
- [ ] [web] User accounts + saved library

### iOS
- [ ] [ios] SwiftData persistence — library view, survive restarts (Phase 3)
- [ ] [ios] CloudKit sync — cross-device documents + reading state (Phase 5)
- [ ] [ios] Settings + freemium via StoreKit 2 (Phase 6)
- [ ] [ios] Share sheet extension (share from Safari)

### Both Platforms
- [ ] [both] Highlights + notes
- [ ] [both] .nubble file format (shareable nubbled documents)
- [ ] [both] Reading position sync across platforms
- [ ] [both] Pocket / Instapaper import
- [ ] [both] RSS feed support

---

## Backlog

<!-- Lower priority ideas. Review monthly. -->

- [ ] "Reading DNA" — depth profile across all content
- [ ] Shared nubbles (send to a friend)
- [ ] Highlights export to Readwise
- [ ] Android app
- [ ] API access (Power tier)
- [ ] News feed: topic customization (custom research queries)
- [ ] News feed: daily cron automation (Vercel cron or local launchd)
- [ ] News feed: date picker / archive navigation

---

## Done

<!-- Move completed items here with date. Format: `- [x] [2026-03-17] Description` -->

- [x] [2026-03-15] Phase 1 web prototype — reader with gestures, depth, dark mode
- [x] [2026-03-15] Phase 2-4 iOS content pipeline — ePub/PDF/TXT/MD/JSON import + chunking + AI depth
- [x] [2026-03-15] iOS SwiftUI reader shell — full parity with web gestures
- [x] [2026-03-17] Web news feed pipeline — NotebookLM research → depth gen → JSON → API → UI
- [x] [2026-03-17] Nubble skill created — `/nubble` triggers daily feed automation
- [x] [2026-03-17] Feed UI — card grid (featured/grid/list), `/feed` and `/read-feed/:id` routes
- [x] [2026-03-17] First feed generated — 2026-03-17.json, 10 stories, all 4 depth levels
- [x] [2026-03-17] Digest page — `/digest` renders all 10 stories in NubbleReader as one document
- [x] [2026-03-18] Homepage category selector — 3 pill buttons below NUBBLE header (AI News, Branding, Ecommerce)
- [x] [2026-03-18] Route restructure — `/ai-digest`, `/ai-branding`, `/ai-ecommerce`, redirect `/digest`
- [x] [2026-03-18] Feed pipeline: support `--category` and `--query` flags, category-specific prompts
- [x] [2026-03-18] Generated 2026-03-18 AI News feed (10 stories, 78 sources, Feynman-style depths)
- [x] [2026-03-18] Generated 2026-03-18 AI & Strategic Branding feed (10 stories, 68 sources)
- [x] [2026-03-18] Generated 2026-03-18 AI Ecommerce feed (10 stories, 63 sources)
- [x] [2026-03-18] NUBBLE logo clickable → navigates to homepage
- [x] [2026-03-18] Category pills centered below header
- [x] [2026-03-18] NubbleReader subHeader prop for injecting content below header
