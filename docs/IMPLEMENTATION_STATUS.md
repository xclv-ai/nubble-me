# Nubble iOS — Implementation Status

**Last updated:** 2026-03-15

---

## Phase 1: SwiftUI Reader Shell — COMPLETE

Full reader with hardcoded "Paradox of Choice" content.

| Component | File | Status |
|-----------|------|--------|
| App entry point | `NubbleApp.swift` | Done — launches reader with sample content, import via sheet |
| Content models | `Models/ContentDocument.swift`, `ContentSection.swift` | Done |
| Reader state | `Models/ReaderState.swift` | Done — global depth, per-section overrides, boundary flash |
| Reader view | `Views/Reader/NubbleReaderView.swift` | Done — centered depth control, import button in header |
| Section view | `Views/Reader/SectionView.swift` | Done — swipe gestures, depth switching |
| Depth indicator | `Views/Reader/DepthIndicator.swift` | Done — 4-dot indicator |
| Progress bar | `Views/Reader/ReadingProgressBar.swift` | Done |
| Swipe onboarding | `Views/Reader/SwipeOnboarding.swift` | Done |
| Boundary flash | `Views/Reader/BoundaryFlash.swift` | Done |
| Logo | `Views/Components/NubbleLogo.swift` | Done |
| Typography | `Design/Typography.swift` | Done — Zodiak serif + Satoshi sans |
| Colors | `Design/NubbleColors.swift` | Done — light/dark mode |
| Springs | `Design/Springs.swift` | Done — snappy, gentle, reveal |
| Haptics | `Utilities/Haptics.swift` | Done |
| Reading time | `Utilities/ReadingTime.swift` | Done |
| Sample content | `Resources/SampleContent.swift` | Done — 6 sections, 4 depths each |

**Gestures:** horizontal swipe (section depth), pinch-to-zoom (global depth), keyboard arrows, section nav rail.

---

## Phase 2-4: Content Pipeline — COMPLETE (built, needs on-device testing)

Import ePub/PDF/TXT/MD/JSON files, chunk into sections, generate depth variants.

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Chunking engine | `Services/ChunkingEngine.swift` | 168 | Done — splits on headings, paragraph boundaries, 200-800 words |
| PDF extractor | `Services/PDFExtractor.swift` | 167 | Done — PDFKit + Vision OCR for scanned pages |
| ePub parser | `Services/EPubParser.swift` | 140 | Done — ZIPFoundation unzip + SwiftSoup HTML parsing |
| Depth generator | `Services/DepthGenerator.swift` | 110 | Done — Foundation Models with passthrough fallback |
| Conversion pipeline | `Services/ConversionPipeline.swift` | 80 | Done — orchestrates file → extract → chunk → AI → ContentDocument |
| Import UI | `Views/Import/ImportView.swift` | 160 | Done — file picker sheet, progress view, cancel |

### Supported file formats

| Format | Parser | Heading detection |
|--------|--------|-------------------|
| ePub (.epub) | SwiftSoup + ZIPFoundation | `<h1>`/`<h2>`/`<h3>` tags |
| PDF (.pdf) | PDFKit + Vision OCR | Heuristic (ALL CAPS, short lines, chapter patterns) |
| Plain text (.txt) | Direct read | Markdown headings (#, ##, ###) |
| Markdown (.md) | Direct read | Native heading markers |
| JSON (.json) | Direct read | Chunking engine headings |

### AI Depth Generation

| Device | Behavior |
|--------|----------|
| iPhone 15 Pro / 16+ (iOS 26, Apple Intelligence ON) | On-device Foundation Models — 3 AI calls per section (summary, condensed, expanded) |
| Simulator / older devices | Passthrough fallback — first sentence as summary, first 3 sentences as condensed, original as standard+expanded |

### Info.plist registrations
- `CFBundleDocumentTypes` for ePub, PDF, plain text, JSON, Markdown
- `LSSupportsOpeningDocumentsInPlace: true`

### SPM Dependencies
- `SwiftSoup` 2.7+ (HTML/XML parsing)
- `ZIPFoundation` 0.9.19+ (ePub unzipping)

---

## Phases Not Yet Started

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 3 | SwiftData persistence — library view, reading state survives restarts | Not started |
| Phase 5 | CloudKit sync — cross-device document + reading state sync | Not started |
| Phase 6 | Polish — onboarding, settings, freemium (StoreKit 2), App Store submission | Not started |

---

## Project Stats

- **Total Swift files:** 23
- **Services layer:** 5 files, 665 lines
- **Import UI:** 1 file, 160 lines
- **Build target:** iOS 26.0, Swift 6.2
- **Bundle ID:** me.nubble.app

---

## Known Issues / Next Steps

1. **On-device AI untested** — Foundation Models fails in simulator (error -1), should work on physical iPhone 15 Pro+ with Apple Intelligence enabled
2. **No persistence** — imported documents are lost on app restart (Phase 3)
3. **No library view** — can only read one document at a time
4. **ePub DRM** — no detection yet, DRM-protected ePubs will fail silently
5. **Large PDFs** — no background processing or progress streaming yet for 500+ page documents
