# Architecture: Loading Any Content into Nubble

## Overview

Nubble transforms any long-form content (ebook, PDF, article, URL) into a multi-depth reading experience. Each section exists at 4 depth levels — from a one-line summary to a fully expanded deep dive. The reader controls depth per-section via swipe gestures.

This document describes the full pipeline from raw content to rendered nubble.

---

## Pipeline

```
┌─────────────────────────────────────────────────┐
│  1. INPUT                                       │
│  ePub · PDF · HTML · URL · Pocket · RSS · .txt  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  2. EXTRACTION                                  │
│  Raw source → clean plain text + structure      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  3. CHUNKING                                    │
│  Full text → semantic sections (200-800 words)  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  4. DEPTH GENERATION                            │
│  Each section → 4 depth variants                │
│  (on-device AI or cloud fallback)               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  5. STORAGE                                     │
│  SQLite (local) + CloudKit (sync)               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  6. READER UI                                   │
│  NubbleReader (SwiftUI / React)                 │
└─────────────────────────────────────────────────┘
```

---

## Stage 1: Input

Nubble accepts:

| Format | Source | Notes |
|--------|--------|-------|
| ePub | File import / share sheet | Most structured — chapter/section hierarchy preserved |
| PDF | File import / share sheet | Flat text extraction; heading detection heuristic |
| HTML | URL / share sheet | Main content extraction (Readability-style) |
| URL | Paste / share sheet | Fetch → HTML extraction |
| .txt | File import | Paragraph-based chunking |
| Pocket / Instapaper | OAuth sync | Retrieve article text via their APIs |
| RSS | Feed URL | Fetch items → HTML extraction |

---

## Stage 2: Extraction

### ePub

ePub files are ZIP archives. Each chapter is an XHTML file.

```
ePub ZIP
├── META-INF/container.xml        → points to OPF file
├── OEBPS/content.opf             → spine order + metadata
├── OEBPS/chapter1.xhtml          → chapter content
├── OEBPS/chapter2.xhtml
└── ...
```

**Extraction steps:**
1. Unzip the ePub
2. Parse `content.opf` to get spine order
3. Parse each chapter XHTML → strip tags → plain text
4. Preserve heading hierarchy (`<h1>`, `<h2>`, `<h3>`) as section markers

**iOS implementation:**
- `ZipFoundation` or Apple's `Compression` framework to unzip
- `SwiftSoup` for HTML/XML parsing
- No third-party ePub library needed

---

### PDF

**iOS implementation:**
- `PDFKit` (native) for text extraction
- `PDFPage.string` gives plain text per page
- `Vision` framework for scanned PDFs (OCR)

```swift
func extractText(from pdf: PDFDocument) -> String {
    (0..<pdf.pageCount)
        .compactMap { pdf.page(at: $0)?.string }
        .joined(separator: "\n")
}
```

**Heading detection (heuristic):**
- Short lines (< 8 words) with no terminal punctuation → likely heading
- ALL CAPS lines → likely heading
- Font size larger than body average → heading (if PDF has font metadata)

---

### HTML / URL

**Main content extraction** (Readability algorithm):
1. Parse DOM
2. Score candidate elements by text density, tag type, class names
3. Extract highest-scoring content block
4. Strip ads, nav, footer, sidebar

**iOS implementation:**
- `WKWebView` with JavaScript injection OR
- Swift port of Mozilla Readability OR
- `SwiftSoup` for DOM parsing + custom scoring

---

## Stage 3: Chunking

Goal: split clean text into **semantic sections** of 200–800 words each.

### Chunking algorithm

```
1. Split on explicit headings (## Section Title)
   → each heading starts a new chunk

2. If a chunk is > 800 words:
   → split on paragraph boundaries, keeping chunks 400–800 words

3. If remaining text after all headings < 200 words:
   → merge with previous chunk

4. Assign each chunk:
   - id: UUID
   - title: heading text (if present) OR auto-generated summary
   - body: full text
   - position: index in document
```

### Chunk data model

```swift
struct Chunk {
    let id: UUID
    let position: Int
    let title: String          // heading or auto-generated
    let body: String           // full text of this section
    var depths: [Int: String]  // 0=summary, 1=condensed, 2=standard, 3=expanded
}
```

---

## Stage 4: Depth Generation

Each chunk needs 4 depth variants. The chunk's `body` is depth 2 (standard).

### Depth definitions

| Depth | Name | Length | Purpose |
|-------|------|--------|---------|
| 0 | Summary | 1 sentence | The single most important idea |
| 1 | Condensed | 1 short paragraph | Key points only |
| 2 | Standard | Original text | Normal reading |
| 3 | Expanded | Original + elaboration | Deep dive, examples, context |

### AI prompt templates

**Depth 0 — Summary:**
```
Summarize this section in exactly one sentence (max 20 words).
Capture the single most important idea.
Section: {body}
```

**Depth 1 — Condensed:**
```
Condense this section to 2-3 sentences.
Keep only the key points. Drop examples, qualifications, transitions.
Section: {body}
```

**Depth 3 — Expanded:**
```
Expand this section with:
- Concrete examples for each key point
- Brief explanation of why each point matters
- Any relevant context the reader might need
Keep the same structure. Add 50-100% more content.
Section: {body}
```

### On-device vs. cloud

| Condition | Model | Notes |
|-----------|-------|-------|
| iOS 26+, iPhone 16+ | Apple Foundation Models (on-device) | Private, fast, free |
| Older device / iOS | OpenAI GPT-4o-mini | Cloud fallback, ~$0.001/chunk |
| Offline | Pre-generated depths only | No new generation |

**On-device generation (iOS 26+):**
```swift
import FoundationModels

let session = LanguageModelSession()
let depth0 = try await session.respond(to: prompt_depth0)
```

**Batch processing:**
- Generate all depths for a document at import time
- Show progress: "Generating reading levels... 12/47 sections"
- Allow reading while generation continues (stream depths as ready)

---

## Stage 5: Storage

### Data model

```swift
// SwiftData
@Model class NubbleDocument {
    var id: UUID
    var title: String
    var sourceType: SourceType  // epub, pdf, url, text
    var sourceURL: URL?
    var importedAt: Date
    var chunks: [NubbleChunk]
    var metadata: DocumentMetadata
}

@Model class NubbleChunk {
    var id: UUID
    var position: Int
    var title: String
    var depths: [Int: String]   // 0-3
    var currentDepth: Int       // user's last depth for this chunk
    var document: NubbleDocument
}

struct DocumentMetadata: Codable {
    var author: String?
    var coverImageData: Data?
    var wordCount: Int
    var chunkCount: Int
    var language: String
}
```

### .nubble file format (export/share)

A `.nubble` file is a JSON document:

```json
{
  "version": 1,
  "document": {
    "id": "uuid",
    "title": "Book Title",
    "author": "Author Name",
    "sourceType": "epub",
    "importedAt": "2025-01-01T00:00:00Z"
  },
  "chunks": [
    {
      "id": "uuid",
      "position": 0,
      "title": "Introduction",
      "depths": {
        "0": "One sentence summary.",
        "1": "Short paragraph.",
        "2": "Original full text.",
        "3": "Expanded version with examples."
      }
    }
  ]
}
```

### CloudKit sync

- Documents + chunks sync via CloudKit private database
- `currentDepth` per chunk syncs (reading state follows you across devices)
- Conflict resolution: last-write-wins per chunk

---

## Stage 6: Reader UI

The reader receives an array of `NubbleChunk` objects and renders them.

### SwiftUI structure

```swift
struct NubbleReaderView: View {
    @State var chunks: [NubbleChunk]
    @State var globalDepth: Int = 2

    var body: some View {
        ScrollView(.vertical) {
            LazyVStack {
                ForEach(chunks) { chunk in
                    ChunkView(chunk: chunk, globalDepth: globalDepth)
                }
            }
        }
    }
}

struct ChunkView: View {
    @Bindable var chunk: NubbleChunk
    let globalDepth: Int

    var body: some View {
        Text(chunk.depths[effectiveDepth] ?? "")
            .gesture(depthSwipeGesture)
    }

    var effectiveDepth: Int {
        chunk.overrideDepth ?? globalDepth
    }
}
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| ePub parse fails | Show error + option to retry or import as plain text |
| PDF has no extractable text (scanned) | Trigger Vision OCR automatically |
| AI depth generation fails for a chunk | Use original text for all depths; show warning |
| CloudKit sync conflict | Last-write-wins; log conflict for review |
| Content too short (< 50 words) | Show as single section, all depths identical |
