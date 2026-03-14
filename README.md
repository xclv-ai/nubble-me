# nubble.me

2-axis reading interface: **swipe left/right** to control content depth per section, **scroll vertically** to read through all sections continuously.

## Concept

Every section of content exists at 4 depth levels:
- **Summary** (depth 0) — one-line essence
- **Condensed** (depth 1) — short paragraph
- **Standard** (depth 2) — normal reading
- **Expanded** (depth 3) — deep dive with full detail

Readers control depth globally or per-section via swipe gestures, keyboard arrows, or pinch-to-zoom.

## Live Demo

[nubble.me](https://www.perplexity.ai/computer/a/nubble-me-myE1HJBdQIaiTVJCKGuYFg)

## Features

- Swipe left/right on any section to change its depth
- Shift + arrow keys for global depth control
- Pinch-to-zoom gesture for depth on mobile
- Smooth spring animations and content transitions
- Depth indicator — morphing centered bar showing current zoom level
- Section navigation rail with hover tooltips
- Reading time estimate that updates with depth
- Scroll progress bar
- Onboarding overlay for first-time users
- Boundary feedback (edge glow) at min/max depth
- Dark mode with smooth theme transitions
- Visual text density that varies by depth level

## Documentation

| Document | Description |
|----------|-------------|
| **[Architecture](docs/ARCHITECTURE.md)** | Content loading pipeline — how any ePub, PDF, or URL becomes a nubble. Extraction, chunking, on-device AI depth generation, data model, .nubble file format. |
| **[Product Plan](docs/PRODUCT_PLAN.md)** | Vision, target users, phased roadmap (web prototype → iOS MVP → ePub/PDF → App Store), business model, competitive landscape, key metrics. |
| **[Tech Stack](docs/TECH_STACK.md)** | Current web stack vs. target iOS stack. SwiftUI equivalents for every React pattern. Portability assessment. Migration path. |

## Current Stack (Web Prototype)

- React 18 + TypeScript
- Framer Motion (gestures, springs, animations)
- Tailwind CSS 3
- Vite + Express (dev server)
- Fonts: Satoshi (body) + Zodiak (display) via Fontshare

## Target Stack (iOS App)

- SwiftUI + Swift 6
- Apple Foundation Models (on-device AI, iOS 26+)
- PDFKit + Vision (content extraction)
- SwiftData + CloudKit (storage + sync)
- Zero third-party UI dependencies

## Getting Started


added 2 packages, and audited 221 packages in 1s

48 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

## Build & Deploy



## Project Structure



## License

MIT
