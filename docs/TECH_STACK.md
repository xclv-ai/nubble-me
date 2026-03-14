# Tech Stack: Current vs. Target

## Current State (Web Prototype)

### What the Reader Actually Uses

| Layer | Technology | Purpose |
|-------|-----------|----------|
| UI Framework | React 18 + TypeScript | Component rendering, state |
| Animations | Framer Motion | Swipe gestures, spring physics, transitions |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| Build | Vite | Dev server + bundler |
| Server | Express (dev only) | Static file serving |
| Fonts | Satoshi + Zodiak via Fontshare | Typography |

### What the Web Prototype Does NOT Have
- Real content loading (hardcoded article only)
- AI depth generation (depths pre-written)
- User accounts or persistence
- Backend API
- Database

---

## Target State (iOS App)

### Core Stack

| Layer | Technology | Replaces |
|-------|-----------|----------|
| UI Framework | SwiftUI + Swift 6 | React + TypeScript |
| Animations | SwiftUI animations + `matchedGeometryEffect` | Framer Motion |
| Gestures | SwiftUI `DragGesture` + `MagnifyGesture` | Framer Motion gesture handlers |
| Styling | SwiftUI modifiers + design tokens | Tailwind CSS |
| State | `@State`, `@StateObject`, `@Observable` | React `useState`, `useReducer` |
| Build | Xcode + Swift Package Manager | Vite |
| Fonts | Custom font registration via `Info.plist` | Fontshare CDN |

### Content Pipeline Stack

| Layer | Technology | Purpose |
|-------|-----------|----------|
| ePub parsing | `SwiftSoup` (HTML) + custom ZIP handler | Parse ePub chapter files |
| PDF extraction | `PDFKit` (native) | Extract text from PDF pages |
| OCR (scanned PDFs) | `Vision` framework (native) | Text recognition |
| HTML extraction | `SwiftSoup` or JS in `WKWebView` | Readability-style extraction |
| Chunking | Custom Swift | Semantic section splitting |
| AI (on-device) | Apple Foundation Models (iOS 26+) | Depth generation, private |
| AI (cloud fallback) | OpenAI GPT-4o-mini via REST | Older devices / offline fallback |

### Storage Stack

| Layer | Technology | Purpose |
|-------|-----------|----------|
| Local DB | SwiftData | Persist documents, chunks, depths |
| Sync | CloudKit (private DB) | Cross-device sync |
| Cache | `URLCache` | HTTP response caching |
| Files | FileManager + App Group | `.nubble` file import/export |

---

## Pattern Translation: React → SwiftUI

### State Management

**React:**
```typescript
const [globalDepth, setGlobalDepth] = useState(2);
const [chunkDepths, setChunkDepths] = useState<Record<string, number>>({});
```

**SwiftUI:**
```swift
@Observable class ReaderState {
    var globalDepth: Int = 2
    var chunkDepths: [UUID: Int] = [:]
}
```

---

### Gesture Handling

**React (Framer Motion):**
```typescript
<motion.div
  drag="x"
  onDragEnd={(_, info) => {
    if (info.offset.x < -50) increaseDepth();
    if (info.offset.x > 50) decreaseDepth();
  }}
/>
```

**SwiftUI:**
```swift
.gesture(
    DragGesture()
        .onEnded { value in
            if value.translation.width < -50 { increaseDepth() }
            if value.translation.width > 50 { decreaseDepth() }
        }
)
```

---

### Spring Animations

**React (Framer Motion):**
```typescript
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>
```

**SwiftUI:**
```swift
.animation(.spring(response: 0.3, dampingFraction: 0.7), value: depth)
```

---

### Conditional Rendering

**React:**
```typescript
{showOnboarding && <OnboardingOverlay onDismiss={() => setShowOnboarding(false)} />}
```

**SwiftUI:**
```swift
if showOnboarding {
    OnboardingOverlay(onDismiss: { showOnboarding = false })
}
```

---

### Theme / Dark Mode

**React (Tailwind):**
```typescript
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

**SwiftUI:**
```swift
.background(Color(.systemBackground))
.foregroundStyle(Color(.label))
// Automatically adapts to dark/light mode
```

---

## Dependency Assessment

### What carries over directly
- **Core logic**: All depth management, chunking algorithms, state machine → pure Swift functions, zero changes to logic
- **Design system**: Colors, spacing, typography scale → SwiftUI design tokens
- **UX patterns**: Swipe gestures, depth indicator, reading progress → direct SwiftUI equivalents

### What changes completely
- **Rendering**: React components → SwiftUI views (full rewrite, same structure)
- **Styling**: Tailwind classes → SwiftUI modifiers (mechanical translation)
- **Animations**: Framer Motion API → SwiftUI animation API (equivalent capability)

### What's new in iOS
- **Content pipeline**: Zero equivalent in web prototype (all new code)
- **SwiftData**: Persistence (web prototype has none)
- **CloudKit**: Sync (web prototype has none)
- **On-device AI**: Apple Foundation Models (web prototype uses pre-written depths)

---

## Third-Party Dependencies (iOS)

| Package | Purpose | Alternatives |
|---------|---------|---------------|
| `SwiftSoup` | HTML/XML parsing for ePub + web | Roll own parser (not worth it) |
| OpenAI Swift SDK (optional) | Cloud AI fallback | Direct URLSession REST calls |

**Goal: maximum 2 third-party dependencies.**

Everything else — gestures, animations, storage, sync, fonts, AI — is native Apple frameworks.

---

## Migration Path

### Step 1: SwiftUI Shell
Build the reader UI in SwiftUI with hardcoded content (matching current web prototype). Validate gestures, animations, and depth UI feel identical to web.

### Step 2: Content Pipeline
Build extraction + chunking for URL → nubble. No AI yet — use placeholder depths.

### Step 3: On-Device AI
Integrate Apple Foundation Models for depth generation. Test on iOS 26 devices.

### Step 4: Storage
Add SwiftData persistence. Reader remembers position and depth state.

### Step 5: ePub / PDF
Add file import pipeline. SwiftSoup for ePub, PDFKit for PDF.

### Step 6: CloudKit
Add sync. Documents + reading state follow user across devices.

---

## Portability Assessment

The web prototype was built with portability in mind. The core reading interaction — scroll vertically, swipe to change depth, spring animations, depth indicator — maps 1:1 to SwiftUI.

The main engineering work for iOS is the **content pipeline** (extraction, chunking, AI generation) and **persistence** (SwiftData + CloudKit), both of which have no equivalent in the web prototype but are well-defined problems with clear native solutions.

The UI rewrite from React → SwiftUI is mechanical: same component structure, same state model, same UX patterns. The data model, and UX patterns carry over completely.
