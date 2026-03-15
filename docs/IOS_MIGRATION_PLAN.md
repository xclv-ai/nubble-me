# iOS Migration Plan: Web Prototype → Native SwiftUI App

## Executive Summary

Migrate nubble.me from a React/Framer Motion web prototype to a native iOS app using SwiftUI, Swift 6, and Apple Foundation Models. The web prototype validates the core UX — vertical scroll + horizontal swipe depth control — and all interaction patterns map 1:1 to SwiftUI equivalents.

**Target:** iOS 26+, iPhone 16+ (for on-device AI). Cloud fallback for older devices.

---

## Phase 1: Xcode Project & SwiftUI Shell (Week 1-2)

### Goal
Replicate the current web prototype experience with hardcoded content. No backend, no AI — just the reader.

### 1.1 Project Setup
- Create Xcode project: `Nubble` (iOS App, SwiftUI lifecycle)
- Swift 6, minimum deployment iOS 26
- Swift Package Manager dependencies:
  - `SwiftSoup` (HTML parsing, needed in Phase 2)
  - No other third-party deps
- Configure custom fonts: Satoshi (sans) + Zodiak (serif) via `Info.plist`
- Set up asset catalog: app icon, accent color, dark/light color tokens

### 1.2 Data Model (In-Memory First)

Port directly from `client/src/lib/sample-content.ts`:

```swift
struct ContentSection: Identifiable {
    let id: String
    let title: String
    let summary: String      // depth 0
    let condensed: String    // depth 1
    let standard: String     // depth 2
    let expanded: String     // depth 3

    func text(at depth: Int) -> String {
        switch depth {
        case 0: return summary
        case 1: return condensed
        case 3: return expanded
        default: return standard
        }
    }
}

struct ContentDocument {
    let title: String
    let author: String
    let sections: [ContentSection]
}
```

### 1.3 Reader State

Port from `NubbleReader.tsx` state model:

```swift
@Observable class ReaderState {
    var globalDepth: Int = 2                    // 0-3
    var sectionOverrides: [String: Int] = [:]   // per-section depth
    var activeSectionId: String = ""            // currently visible
    var scrollProgress: Double = 0.0            // 0-1
    var hasSwipedOnce: Bool = false             // onboarding flag

    func effectiveDepth(for sectionId: String) -> Int {
        sectionOverrides[sectionId] ?? globalDepth
    }

    func changeGlobalDepth(by delta: Int) {
        let newDepth = max(0, min(3, globalDepth + delta))
        guard newDepth != globalDepth else { return }
        globalDepth = newDepth
        sectionOverrides.removeAll()  // reset overrides on global change
    }

    func changeSectionDepth(id: String, by delta: Int) {
        let current = effectiveDepth(for: id)
        let newDepth = max(0, min(3, current + delta))
        guard newDepth != current else { return }
        sectionOverrides[id] = newDepth
    }
}
```

### 1.4 Core Views

#### NubbleReaderView (main container)
- `ScrollViewReader` + `LazyVStack` for vertical section scrolling
- Scroll position tracking via `GeometryReader` or `ScrollView` coordinateSpace
- Reading progress bar in toolbar
- Global depth indicator

#### SectionView (per-section)
- Display section title + depth-appropriate text
- `DragGesture()` for horizontal swipe → depth change
  - Threshold: 50pt translation OR 180pt/s velocity (matching web)
  - `dragConstraints` equivalent: snap back with spring animation
- Visual depth indicator (dots or bar)
- `matchedGeometryEffect` for smooth text transitions between depths

#### DepthIndicator
- 4-dot indicator showing current depth
- Animate active dot on depth change
- Show "min"/"max" boundary flash (matching web's `boundaryFlash` state)

### 1.5 Gesture System

Port all three gesture types from `NubbleReader.tsx`:

| Web (Framer Motion) | iOS (SwiftUI) | Notes |
|---------------------|---------------|-------|
| `drag="x"` on section | `DragGesture()` on section | Same 50px/180px/s threshold |
| `Shift+Arrow` (global) | `MagnifyGesture()` (pinch) | Pinch to change global depth |
| Keyboard arrows | External keyboard support | Same logic, `onKeyPress` modifier |

**Swipe gesture detail:**
```swift
.gesture(
    DragGesture()
        .onChanged { value in
            // Live feedback: slight horizontal offset
            dragOffset = value.translation.width * 0.15
        }
        .onEnded { value in
            let threshold: CGFloat = 50
            let velocityThreshold: CGFloat = 180
            if value.translation.width < -threshold ||
               value.predictedEndTranslation.width < -threshold {
                changeSectionDepth(id: section.id, by: 1)
            } else if value.translation.width > threshold ||
                      value.predictedEndTranslation.width > threshold {
                changeSectionDepth(id: section.id, by: -1)
            }
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                dragOffset = 0
            }
        }
)
```

### 1.6 Animations

Port the three spring presets from web:

| Web Preset | SwiftUI Equivalent |
|------------|-------------------|
| `SPRING_SNAPPY` (stiffness: 400, damping: 30) | `.spring(response: 0.25, dampingFraction: 0.75)` |
| `SPRING_GENTLE` (stiffness: 200, damping: 25) | `.spring(response: 0.35, dampingFraction: 0.65)` |
| `SPRING_REVEAL` (stiffness: 80, damping: 20) | `.spring(response: 0.55, dampingFraction: 0.55)` |

Content depth transitions:
- Text opacity fade: 0.35s ease-out
- Height animation: use `matchedGeometryEffect` or `.animation(.spring)` on text container
- No blur transition needed (simpler on iOS; focus on smooth height + fade)

### 1.7 Visual Design

- **Typography:** Zodiak (serif) for body text, Satoshi (sans) for UI
- **Depth text styles** (matching V4 web implementation):
  - Depth 0: `font-medium`, full opacity (bold summary)
  - Depth 1: regular weight, 85% opacity
  - Depth 2: regular weight, 80% opacity
  - Depth 3: regular weight, 75% opacity
- **Dark mode:** Automatic via SwiftUI `@Environment(\.colorScheme)` — no manual toggle needed, system handles it
- **Colors:** Use semantic colors (`Color(.label)`, `Color(.systemBackground)`) for auto dark/light
- **Section separator:** Subtle divider between sections

### 1.8 Hardcoded Content

Port the "Paradox of Choice" sample from `sample-content.ts` verbatim. All 6 sections, all 4 depths. This is the test fixture for validating gesture/animation parity with web.

### Deliverable
A working SwiftUI reader that feels identical to the web prototype. No networking, no persistence, no AI. Pure reader.

---

## Phase 2: Content Pipeline — URL → Nubble (Week 3-5)

### Goal
Paste a URL → get a nubbled article in < 30 seconds.

### 2.1 URL Input View
- Simple paste field or share sheet extension
- URL validation
- Loading state with progress ("Fetching... Extracting... Generating depths...")

### 2.2 HTML Extraction
- Fetch URL content via `URLSession`
- Parse with `SwiftSoup` (Readability-style content extraction)
- Extract: title, author, main body text
- Strip: nav, footer, sidebar, ads, scripts

```swift
func extractArticle(from url: URL) async throws -> RawArticle {
    let (data, _) = try await URLSession.shared.data(from: url)
    let html = String(data: data, encoding: .utf8) ?? ""
    let doc = try SwiftSoup.parse(html)

    // Readability-style scoring
    let title = try doc.title()
    let body = try extractMainContent(doc)
    return RawArticle(title: title, body: body, sourceURL: url)
}
```

### 2.3 Chunking Engine

Port the chunking algorithm from `ARCHITECTURE.md`:

```swift
struct ChunkingEngine {
    let minWords = 200
    let maxWords = 800

    func chunk(_ text: String) -> [RawChunk] {
        // 1. Split on headings (##, bold lines, short non-punctuated lines)
        // 2. If chunk > 800 words → split on paragraph boundaries
        // 3. If trailing chunk < 200 words → merge with previous
        // 4. Assign position index + auto-title if no heading
    }
}
```

### 2.4 On-Device AI Depth Generation (iOS 26+)

```swift
import FoundationModels

class DepthGenerator {
    private let session = LanguageModelSession()

    func generateDepths(for chunk: RawChunk) async throws -> DepthSet {
        let summary = try await session.respond(to:
            "Summarize in exactly one sentence (max 20 words): \(chunk.body)")
        let condensed = try await session.respond(to:
            "Condense to 2-3 sentences, key points only: \(chunk.body)")
        let expanded = try await session.respond(to:
            "Expand with concrete examples and context (+50-100%): \(chunk.body)")

        return DepthSet(
            summary: summary.content,
            condensed: condensed.content,
            standard: chunk.body,
            expanded: expanded.content
        )
    }
}
```

### 2.5 Cloud AI Fallback (Older Devices)
- Direct `URLSession` REST calls to OpenAI GPT-4o-mini
- Same prompt templates
- Cost: ~$0.001 per chunk
- User provides their own API key (settings screen) OR freemium credit system

### 2.6 Processing Pipeline
- Show real-time progress: "Generating depths... 4/12 sections"
- Allow reading immediately when first section is ready (stream results)
- Background generation continues while user reads

### Deliverable
End-to-end: paste URL → reading nubbled article with AI-generated depths.

---

## Phase 3: Persistence — SwiftData (Week 5-6)

### Goal
Documents persist locally. Reader remembers position and depth state.

### 3.1 SwiftData Models

```swift
@Model class NubbleDocument {
    @Attribute(.unique) var id: UUID
    var title: String
    var author: String?
    var sourceType: SourceType  // .url, .epub, .pdf, .text
    var sourceURL: String?
    var importedAt: Date
    var lastReadAt: Date?
    var readingProgress: Double  // 0-1
    @Relationship(deleteRule: .cascade) var sections: [NubbleSection]
}

@Model class NubbleSection {
    @Attribute(.unique) var id: UUID
    var position: Int
    var title: String
    var summary: String
    var condensed: String
    var standard: String
    var expanded: String
    var currentDepth: Int  // user's last depth for this section
    var document: NubbleDocument?
}

enum SourceType: String, Codable {
    case url, epub, pdf, text
}
```

### 3.2 Library View
- Grid or list of imported documents
- Show: title, author, import date, reading progress, section count
- Swipe to delete
- Sort by: recent, title, progress

### 3.3 Reading State Persistence
- Save `currentDepth` per section on change
- Save `readingProgress` and `lastReadAt` on scroll
- Resume reading from last position on reopen

### Deliverable
Full local persistence. Library of nubbled documents. Reading state survives app restarts.

---

## Phase 4: ePub + PDF Import (Week 7-9)

### Goal
Import books and PDFs, not just URLs.

### 4.1 ePub Parser
- Unzip ePub (Apple's `Compression` framework)
- Parse `content.opf` for spine order + metadata
- Parse chapter XHTML with `SwiftSoup`
- Preserve heading hierarchy for section markers
- Extract cover image from metadata

### 4.2 PDF Extractor
- `PDFKit` for text extraction (`PDFPage.string`)
- `Vision` framework OCR for scanned PDFs (automatic detection)
- Heading detection heuristic: short lines, no punctuation, ALL CAPS

### 4.3 File Import UI
- Document picker (`UIDocumentPickerViewController` via SwiftUI)
- Share sheet extension (receive ePub/PDF from Files, email, etc.)
- Drag & drop on iPad

### 4.4 Processing
- Same chunking engine as URL pipeline
- Same depth generation (on-device AI)
- Progress UI: "Importing... Parsing chapters... Generating depths..."
- Book-specific: preserve chapter structure as section groups

### Deliverable
Import any ePub or PDF → fully nubbled document in library.

---

## Phase 5: CloudKit Sync (Week 9-10)

### Goal
Documents and reading state sync across iPhone + iPad.

### 5.1 CloudKit Setup
- Private database (user's own iCloud)
- `CKRecord` types: `NubbleDocument`, `NubbleSection`
- Automatic sync via SwiftData + CloudKit integration

### 5.2 Sync Behavior
- Documents + all depths sync
- Reading state (`currentDepth`, `readingProgress`) syncs
- Conflict resolution: last-write-wins per section
- Offline support: full local copy, sync when connected

### 5.3 .nubble File Format
- Export: JSON format (as defined in `ARCHITECTURE.md`)
- Import: parse `.nubble` files shared by other users
- Share sheet: "Share as .nubble" option

### Deliverable
Seamless cross-device sync via iCloud. No account creation needed.

---

## Phase 6: Polish & App Store (Week 10-12)

### Goal
Ship to App Store.

### 6.1 Onboarding
- 3-screen intro: what nubble does → swipe gesture demo → first article
- Interactive gesture tutorial (like web prototype's `SwipeOnboarding`)
- Skip option for returning users

### 6.2 Settings
- Default depth preference
- AI model preference (on-device vs. cloud)
- Cloud API key (for fallback)
- iCloud sync toggle
- Reading font size adjustment
- Haptic feedback toggle

### 6.3 Freemium
- Free: 10 nubbles/month, URL only
- Reader ($4.99/mo): unlimited nubbles, ePub/PDF, sync
- Power ($9.99/mo): everything + highlights export, API access
- StoreKit 2 for subscriptions

### 6.4 App Store Submission
- App Store screenshots (6.7", 6.1", iPad)
- App Store description + keywords (ASO)
- Privacy policy (on-device AI = strong privacy story)
- Review guidelines compliance

### Deliverable
Published on App Store with freemium model.

---

## File Structure (Xcode Project)

```
Nubble/
├── NubbleApp.swift                     # App entry point, SwiftData container
├── Models/
│   ├── ContentSection.swift            # Section data model (in-memory)
│   ├── NubbleDocument.swift            # SwiftData document model
│   ├── NubbleSection.swift             # SwiftData section model
│   └── ReaderState.swift               # @Observable reader state
├── Views/
│   ├── Reader/
│   │   ├── NubbleReaderView.swift      # Main reader (ScrollView + sections)
│   │   ├── SectionView.swift           # Per-section: text + swipe gesture
│   │   ├── DepthIndicator.swift        # 4-dot depth indicator
│   │   ├── ReadingProgressBar.swift    # Top progress bar
│   │   └── SwipeOnboarding.swift       # First-use gesture tutorial
│   ├── Library/
│   │   ├── LibraryView.swift           # Document grid/list
│   │   └── DocumentCard.swift          # Library item card
│   ├── Import/
│   │   ├── URLImportView.swift         # Paste URL flow
│   │   └── FileImportView.swift        # ePub/PDF picker
│   ├── Settings/
│   │   └── SettingsView.swift          # App settings
│   └── Onboarding/
│       └── OnboardingFlow.swift        # First-launch tutorial
├── Services/
│   ├── ContentExtractor.swift          # URL → raw text (SwiftSoup)
│   ├── ChunkingEngine.swift            # Raw text → sections
│   ├── DepthGenerator.swift            # Sections → 4-depth variants (AI)
│   ├── EPubParser.swift                # ePub file → raw text
│   └── PDFExtractor.swift              # PDF file → raw text
├── Utilities/
│   ├── Springs.swift                   # Animation spring presets
│   └── ReadingTime.swift               # Word count → reading time
├── Extensions/
│   └── View+Gestures.swift             # Shared gesture modifiers
├── Resources/
│   ├── Assets.xcassets                 # Colors, icons, app icon
│   ├── Fonts/                          # Satoshi, Zodiak
│   └── SampleContent.swift             # Hardcoded "Paradox of Choice"
└── ShareExtension/
    └── ShareViewController.swift       # Share sheet extension
```

---

## Key References (Apple Official)

| Resource | URL | Purpose |
|----------|-----|---------|
| SwiftUI Tutorials | [apple-sample-code/SwiftUI-Tutorials](https://github.com/apple-sample-code/SwiftUI-Tutorials) | Gestures, state, animations |
| Food Truck Sample | [apple/sample-food-truck](https://github.com/apple/sample-food-truck) | Full SwiftUI app architecture |
| Swift Collections | [apple/swift-collections](https://github.com/apple/swift-collections) | OrderedDictionary for section state |
| Swift Algorithms | [apple/swift-algorithms](https://github.com/apple/swift-algorithms) | Content processing utilities |
| Foundation Models | [developer.apple.com](https://developer.apple.com/documentation/foundationmodels) | On-device AI (iOS 26+) |
| SwiftData | [developer.apple.com](https://developer.apple.com/documentation/swiftdata) | Local persistence |
| CloudKit | [developer.apple.com](https://developer.apple.com/documentation/cloudkit) | Cross-device sync |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Foundation Models quality too low for depth generation | Medium | Cloud fallback (GPT-4o-mini). Test early in Phase 2. |
| ePub parsing edge cases (DRM, complex layouts) | High | Start with DRM-free. Handle gracefully: show error + plain text fallback. |
| SwiftUI scroll performance with many sections | Low | `LazyVStack` + limit rendered sections. Profile early. |
| App Store rejection (content transformation IP concerns) | Low | User provides their own content. No redistribution. Privacy-first messaging. |
| CloudKit sync conflicts on rapid depth changes | Medium | Debounce depth saves (500ms). Last-write-wins per section. |

---

## Success Criteria

| Phase | Metric | Target |
|-------|--------|--------|
| Phase 1 | Gesture parity with web | Feels identical to web prototype |
| Phase 2 | URL → nubble time | < 30 seconds for average article |
| Phase 3 | Data survival | 100% documents survive app restart |
| Phase 4 | ePub success rate | > 90% of DRM-free ePubs parse correctly |
| Phase 5 | Sync latency | < 5 seconds cross-device |
| Phase 6 | App Store launch | Published + 1,000 downloads month 1 |
