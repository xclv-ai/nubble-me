# nubble.me

2-axis reading interface: **swipe left/right** to control content depth per section, **scroll vertically** to read through all sections continuously.

## Concept

Every section of content exists at 4 depth levels:
- **Summary** (depth 0) — one-line essence
- **Condensed** (depth 1) — short paragraph
- **Standard** (depth 2) — normal reading
- **Expanded** (depth 3) — deep dive with full detail

Readers control depth globally or per-section via swipe gestures, keyboard arrows, or pinch-to-zoom.

## Features

- Swipe left/right on any section to change its depth
- Shift + arrow keys for global depth control
- Pinch-to-zoom gesture for depth on mobile
- Smooth spring animations and content transitions
- Depth indicator — morphing centered bar
- Section navigation rail with hover tooltips
- Reading time estimate that updates with depth
- Scroll progress bar
- Onboarding overlay for first-time users
- Boundary feedback (edge glow) at min/max depth
- Dark mode with smooth theme transitions
- Visual text density that varies by depth level

## Stack

- React 18 + TypeScript
- Framer Motion (gestures, springs, animations)
- Tailwind CSS 3
- Vite + Express (dev server)
- Fonts: Satoshi (body) + Zodiak (display) via Fontshare

## Getting Started

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Architecture

The reader is a single React component (`NubbleReader.tsx`, ~791 lines) that takes a `ContentDocument` — an array of sections, each with 4 depth-level text variants. Currently uses hardcoded sample content. Designed for future integration with on-device AI summarization for any ebook/PDF/article input.

## License

MIT