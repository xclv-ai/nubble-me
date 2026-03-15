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

## Phase 4: ePub + PDF Import & Conversion (Week 7-9)

### Goal
Open any ePub or PDF file and convert it into a fully nubbled, multi-depth document. This is the core differentiator — turning static books/documents into interactive depth-controlled reading experiences.

### 4.1 File Opening & Import Entry Points

Users can open ePub/PDF files from multiple sources:

```swift
// 1. Document picker (browse Files app)
struct FileImportView: View {
    @State private var showPicker = false

    var body: some View {
        Button("Import Book or PDF") { showPicker = true }
        .fileImporter(
            isPresented: $showPicker,
            allowedContentTypes: [.epub, .pdf],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                Task { await importFile(url) }
            case .failure(let error):
                // Show error alert
            }
        }
    }
}

// 2. Share sheet extension (receive from Safari, Mail, other apps)
// ShareExtension/ShareViewController.swift
class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachment = item.attachments?.first else { return }

        if attachment.hasItemConformingToTypeIdentifier(UTType.epub.identifier) {
            attachment.loadFileRepresentation(forTypeIdentifier: UTType.epub.identifier) { url, error in
                // Copy to app group container, open main app
            }
        } else if attachment.hasItemConformingToTypeIdentifier(UTType.pdf.identifier) {
            attachment.loadFileRepresentation(forTypeIdentifier: UTType.pdf.identifier) { url, error in
                // Copy to app group container, open main app
            }
        }
    }
}

// 3. Drag & drop on iPad
.onDrop(of: [.epub, .pdf], isTargeted: nil) { providers in
    guard let provider = providers.first else { return false }
    // Load and import
    return true
}

// 4. Open In / UTType registration (Info.plist)
// Register app as handler for .epub and .pdf files
// Users can "Open In Nubble" from any app
```

**Info.plist UTType registration:**
```xml
<key>CFBundleDocumentTypes</key>
<array>
    <dict>
        <key>CFBundleTypeName</key>
        <string>ePub Document</string>
        <key>LSHandlerRank</key>
        <string>Alternate</string>
        <key>LSItemContentTypes</key>
        <array>
            <string>org.idpf.epub-container</string>
        </array>
    </dict>
    <dict>
        <key>CFBundleTypeName</key>
        <string>PDF Document</string>
        <key>LSHandlerRank</key>
        <string>Alternate</string>
        <key>LSItemContentTypes</key>
        <array>
            <string>com.adobe.pdf</string>
        </array>
    </dict>
</array>
```

### 4.2 ePub Parser — Full Implementation

ePub files are ZIP archives containing XHTML chapters, metadata, and assets.

```swift
import SwiftSoup

struct EPubParser {

    struct EPubBook {
        let title: String
        let author: String?
        let language: String?
        let coverImageData: Data?
        let chapters: [EPubChapter]
    }

    struct EPubChapter {
        let title: String?
        let htmlContent: String
        let position: Int
    }

    /// Main entry: .epub file URL → structured book
    func parse(fileURL: URL) throws -> EPubBook {
        // 1. Unzip ePub
        let epubDir = try unzipEPub(fileURL)

        // 2. Find OPF file via META-INF/container.xml
        let containerURL = epubDir.appendingPathComponent("META-INF/container.xml")
        let containerXML = try String(contentsOf: containerURL)
        let containerDoc = try SwiftSoup.parse(containerXML)
        let opfPath = try containerDoc.select("rootfile").first()?.attr("full-path") ?? ""

        // 3. Parse OPF for metadata + spine order
        let opfURL = epubDir.appendingPathComponent(opfPath)
        let opfDir = opfURL.deletingLastPathComponent()
        let opfXML = try String(contentsOf: opfURL)
        let opfDoc = try SwiftSoup.parse(opfXML)

        let title = try opfDoc.select("dc\\:title, title").first()?.text() ?? "Untitled"
        let author = try opfDoc.select("dc\\:creator, creator").first()?.text()
        let language = try opfDoc.select("dc\\:language, language").first()?.text()

        // 4. Get spine order (reading order of chapters)
        let spineItems = try opfDoc.select("spine itemref")
        let manifest = try opfDoc.select("manifest item")

        var idToHref: [String: String] = [:]
        for item in manifest {
            let id = try item.attr("id")
            let href = try item.attr("href")
            idToHref[id] = href
        }

        // 5. Parse each chapter in spine order
        var chapters: [EPubChapter] = []
        for (index, itemRef) in spineItems.enumerated() {
            let idref = try itemRef.attr("idref")
            guard let href = idToHref[idref] else { continue }

            let chapterURL = opfDir.appendingPathComponent(href)
            guard FileManager.default.fileExists(atPath: chapterURL.path) else { continue }

            let chapterHTML = try String(contentsOf: chapterURL)
            let chapterDoc = try SwiftSoup.parse(chapterHTML)

            // Extract chapter title from first heading
            let chapterTitle = try chapterDoc.select("h1, h2, h3").first()?.text()

            // Get body text, strip navigation/TOC elements
            try chapterDoc.select("nav, .toc, #toc").remove()
            let bodyHTML = try chapterDoc.body()?.html() ?? ""

            // Skip empty chapters (cover pages, copyright, etc.)
            let plainText = try chapterDoc.body()?.text() ?? ""
            guard plainText.split(separator: " ").count > 30 else { continue }

            chapters.append(EPubChapter(
                title: chapterTitle,
                htmlContent: bodyHTML,
                position: index
            ))
        }

        // 6. Extract cover image
        let coverImageData = try extractCoverImage(opfDoc: opfDoc, opfDir: opfDir)

        // 7. Cleanup temp directory
        try? FileManager.default.removeItem(at: epubDir)

        return EPubBook(
            title: title,
            author: author,
            language: language,
            coverImageData: coverImageData,
            chapters: chapters
        )
    }

    private func unzipEPub(_ fileURL: URL) throws -> URL {
        let tempDir = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
        // Use Apple's Compression framework or ZipFoundation
        // Unzip contents to tempDir
        try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        // ... unzip implementation ...
        return tempDir
    }

    private func extractCoverImage(opfDoc: Document, opfDir: URL) throws -> Data? {
        // Look for cover in metadata or manifest
        if let coverId = try opfDoc.select("meta[name=cover]").first()?.attr("content"),
           let coverHref = try opfDoc.select("manifest item#\(coverId)").first()?.attr("href") {
            let coverURL = opfDir.appendingPathComponent(coverHref)
            return try? Data(contentsOf: coverURL)
        }
        return nil
    }
}
```

**ePub → plain text conversion (per chapter):**
```swift
extension EPubParser {
    /// Convert chapter HTML to structured plain text preserving headings
    func htmlToStructuredText(_ html: String) throws -> String {
        let doc = try SwiftSoup.parse(html)

        var result = ""
        let body = doc.body() ?? doc

        for element in body.children() {
            let tag = element.tagName().lowercased()
            let text = try element.text().trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else { continue }

            switch tag {
            case "h1": result += "\n# \(text)\n\n"
            case "h2": result += "\n## \(text)\n\n"
            case "h3": result += "\n### \(text)\n\n"
            case "blockquote": result += "> \(text)\n\n"
            case "ul", "ol":
                for li in try element.select("li") {
                    result += "• \(try li.text())\n"
                }
                result += "\n"
            default: result += "\(text)\n\n"  // p, div, etc.
            }
        }
        return result
    }
}
```

### 4.3 PDF Extractor — Full Implementation

```swift
import PDFKit
import Vision

struct PDFExtractor {

    struct ExtractedPDF {
        let title: String
        let pageCount: Int
        let chapters: [PDFChapter]
        let isScanned: Bool   // was OCR used?
    }

    struct PDFChapter {
        let title: String
        let body: String
        let startPage: Int
        let position: Int
    }

    /// Main entry: .pdf file URL → structured document
    func extract(fileURL: URL) async throws -> ExtractedPDF {
        guard let pdf = PDFDocument(url: fileURL) else {
            throw PDFExtractionError.cannotOpen
        }

        // 1. Extract text from all pages
        var pageTexts: [(page: Int, text: String)] = []
        var isScanned = false

        for i in 0..<pdf.pageCount {
            guard let page = pdf.page(at: i) else { continue }

            if let text = page.string, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                // Native text PDF
                pageTexts.append((i, text))
            } else {
                // Scanned page — use Vision OCR
                isScanned = true
                let ocrText = try await performOCR(on: page)
                if !ocrText.isEmpty {
                    pageTexts.append((i, ocrText))
                }
            }
        }

        // 2. Combine all page text
        let fullText = pageTexts.map(\.text).joined(separator: "\n\n")

        // 3. Detect headings and split into chapters
        let chapters = detectChapters(pageTexts: pageTexts)

        // 4. Extract title from PDF metadata or first heading
        let title = pdf.documentAttributes?[PDFDocumentAttribute.titleAttribute] as? String
            ?? chapters.first?.title
            ?? fileURL.deletingPathExtension().lastPathComponent

        return ExtractedPDF(
            title: title,
            pageCount: pdf.pageCount,
            chapters: chapters,
            isScanned: isScanned
        )
    }

    /// OCR for scanned PDF pages using Vision framework
    private func performOCR(on page: PDFPage) async throws -> String {
        // Render page to image
        let pageRect = page.bounds(for: .mediaBox)
        let scale: CGFloat = 2.0  // 2x for better OCR accuracy
        let imageSize = CGSize(width: pageRect.width * scale, height: pageRect.height * scale)

        let renderer = UIGraphicsImageRenderer(size: imageSize)
        let image = renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: imageSize))
            ctx.cgContext.translateBy(x: 0, y: imageSize.height)
            ctx.cgContext.scaleBy(x: scale, y: -scale)
            page.draw(with: .mediaBox, to: ctx.cgContext)
        }

        guard let cgImage = image.cgImage else { return "" }

        // Run Vision text recognition
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        try handler.perform([request])

        let observations = request.results ?? []
        return observations
            .compactMap { $0.topCandidates(1).first?.string }
            .joined(separator: "\n")
    }

    /// Detect chapter boundaries using heading heuristics
    private func detectChapters(pageTexts: [(page: Int, text: String)]) -> [PDFChapter] {
        var chapters: [PDFChapter] = []
        var currentTitle = "Introduction"
        var currentBody = ""
        var currentStartPage = 0
        var position = 0

        for (pageNum, text) in pageTexts {
            let lines = text.components(separatedBy: .newlines)

            for line in lines {
                let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { continue }

                if isLikelyHeading(trimmed) {
                    // Save previous chapter if it has content
                    if !currentBody.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                        let wordCount = currentBody.split(separator: " ").count
                        if wordCount > 30 {  // Skip tiny sections
                            chapters.append(PDFChapter(
                                title: currentTitle,
                                body: currentBody.trimmingCharacters(in: .whitespacesAndNewlines),
                                startPage: currentStartPage,
                                position: position
                            ))
                            position += 1
                        }
                    }
                    currentTitle = trimmed
                    currentBody = ""
                    currentStartPage = pageNum
                } else {
                    currentBody += trimmed + "\n"
                }
            }
        }

        // Don't forget the last chapter
        if !currentBody.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            chapters.append(PDFChapter(
                title: currentTitle,
                body: currentBody.trimmingCharacters(in: .whitespacesAndNewlines),
                startPage: currentStartPage,
                position: position
            ))
        }

        return chapters
    }

    /// Heuristic: is this line a heading?
    private func isLikelyHeading(_ line: String) -> Bool {
        let words = line.split(separator: " ")

        // Too long for a heading
        if words.count > 10 { return false }

        // ALL CAPS (and more than one word)
        if words.count >= 2 && line == line.uppercased() && line != line.lowercased() {
            return true
        }

        // Short line with no terminal punctuation
        if words.count <= 8 {
            let lastChar = line.last
            if lastChar != "." && lastChar != "," && lastChar != ";" && lastChar != ":" && lastChar != "?" && lastChar != "!" {
                // Check for common chapter patterns
                let lowered = line.lowercased()
                if lowered.hasPrefix("chapter") || lowered.hasPrefix("part") ||
                   lowered.hasPrefix("section") || lowered.hasPrefix("introduction") ||
                   lowered.hasPrefix("conclusion") || lowered.hasPrefix("epilogue") ||
                   lowered.hasPrefix("prologue") || lowered.hasPrefix("appendix") {
                    return true
                }
                // Numbered heading: "1.", "1.1", "I.", "IV."
                if let first = words.first,
                   first.last == "." && (first.dropLast().allSatisfy({ $0.isNumber }) ||
                   first.dropLast().allSatisfy({ "IVXLCDM".contains($0) })) {
                    return true
                }
            }
        }

        return false
    }
}

enum PDFExtractionError: Error, LocalizedError {
    case cannotOpen
    case noTextContent
    case ocrFailed

    var errorDescription: String? {
        switch self {
        case .cannotOpen: return "Could not open PDF file"
        case .noTextContent: return "No readable text found in PDF"
        case .ocrFailed: return "Text recognition (OCR) failed"
        }
    }
}
```

### 4.4 Conversion Pipeline: File → Nubbled Document

The full end-to-end conversion from opening a file to a nubbled document:

```swift
class FileConversionPipeline: ObservableObject {
    enum ConversionStage: String {
        case opening = "Opening file..."
        case parsing = "Parsing content..."
        case extractingText = "Extracting text..."
        case runningOCR = "Running text recognition (OCR)..."
        case chunking = "Splitting into sections..."
        case generatingDepths = "Generating reading depths..."
        case saving = "Saving to library..."
        case done = "Done!"
    }

    @Published var stage: ConversionStage = .opening
    @Published var progress: Double = 0.0       // 0-1
    @Published var depthsCompleted: Int = 0     // sections with depths generated
    @Published var totalSections: Int = 0

    private let epubParser = EPubParser()
    private let pdfExtractor = PDFExtractor()
    private let chunkingEngine = ChunkingEngine()
    private let depthGenerator = DepthGenerator()

    /// Convert any supported file to a NubbleDocument
    func convert(fileURL: URL) async throws -> NubbleDocument {
        let ext = fileURL.pathExtension.lowercased()

        // Step 1: Parse file into raw chapters
        stage = .parsing
        let rawChapters: [(title: String?, body: String)]
        let docTitle: String
        let docAuthor: String?
        var coverData: Data? = nil

        switch ext {
        case "epub":
            let book = try epubParser.parse(fileURL: fileURL)
            docTitle = book.title
            docAuthor = book.author
            coverData = book.coverImageData
            rawChapters = try book.chapters.map { chapter in
                let text = try epubParser.htmlToStructuredText(chapter.htmlContent)
                return (title: chapter.title, body: text)
            }

        case "pdf":
            stage = .extractingText
            let pdf = try await pdfExtractor.extract(fileURL: fileURL)
            if pdf.isScanned { stage = .runningOCR }
            docTitle = pdf.title
            docAuthor = nil
            rawChapters = pdf.chapters.map { (title: $0.title, body: $0.body) }

        default:
            throw ConversionError.unsupportedFormat(ext)
        }

        // Step 2: Chunk each chapter into 200-800 word sections
        stage = .chunking
        var allChunks: [RawChunk] = []
        for (chapterIndex, chapter) in rawChapters.enumerated() {
            let chunks = chunkingEngine.chunk(
                chapter.body,
                chapterTitle: chapter.title,
                startPosition: allChunks.count
            )
            allChunks.append(contentsOf: chunks)
            progress = Double(chapterIndex + 1) / Double(rawChapters.count) * 0.3
        }

        totalSections = allChunks.count

        // Step 3: Generate 4 depth levels for each section via AI
        stage = .generatingDepths
        var sections: [NubbleSection] = []

        for (index, chunk) in allChunks.enumerated() {
            let depths = try await depthGenerator.generateDepths(for: chunk)

            let section = NubbleSection(
                id: UUID(),
                position: index,
                title: chunk.title,
                summary: depths.summary,
                condensed: depths.condensed,
                standard: depths.standard,
                expanded: depths.expanded,
                currentDepth: 2  // default to standard
            )
            sections.append(section)

            depthsCompleted = index + 1
            progress = 0.3 + (Double(index + 1) / Double(allChunks.count)) * 0.65
        }

        // Step 4: Save to SwiftData
        stage = .saving
        let document = NubbleDocument(
            id: UUID(),
            title: docTitle,
            author: docAuthor,
            sourceType: ext == "epub" ? .epub : .pdf,
            sourceURL: fileURL.absoluteString,
            importedAt: Date(),
            sections: sections
        )
        progress = 1.0
        stage = .done

        return document
    }
}

enum ConversionError: Error, LocalizedError {
    case unsupportedFormat(String)
    case emptyDocument
    case parsingFailed(String)

    var errorDescription: String? {
        switch self {
        case .unsupportedFormat(let ext): return "Unsupported file format: .\(ext)"
        case .emptyDocument: return "Document contains no readable text"
        case .parsingFailed(let reason): return "Failed to parse: \(reason)"
        }
    }
}
```

### 4.5 Conversion Progress UI

```swift
struct ConversionProgressView: View {
    @ObservedObject var pipeline: FileConversionPipeline

    var body: some View {
        VStack(spacing: 24) {
            // Animated book icon
            Image(systemName: "book.pages")
                .font(.system(size: 48))
                .symbolEffect(.pulse)

            // Stage label
            Text(pipeline.stage.rawValue)
                .font(.headline)

            // Progress bar
            ProgressView(value: pipeline.progress)
                .progressViewStyle(.linear)
                .frame(maxWidth: 280)

            // Section counter (during depth generation)
            if pipeline.stage == .generatingDepths {
                Text("\(pipeline.depthsCompleted) / \(pipeline.totalSections) sections")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(40)
    }
}
```

### 4.6 DRM & Error Handling

| Scenario | Detection | User-facing behavior |
|----------|-----------|---------------------|
| DRM-protected ePub | `encryption.xml` present in ZIP | Alert: "This book has DRM protection. Nubble can only open DRM-free books." |
| Scanned PDF (no text layer) | `PDFPage.string` returns empty | Auto-trigger Vision OCR, show "Running text recognition..." |
| Corrupt/invalid ePub | ZIP extraction or OPF parse fails | Alert: "Couldn't open this file. It may be damaged." + option to retry |
| Very large PDF (500+ pages) | Page count check | Warning: "This is a long document. Generation may take a few minutes." + process in background |
| Mixed scanned/digital PDF | Per-page text check | Use native text where available, OCR only for scanned pages |
| Password-protected PDF | `PDFDocument.isLocked` | Prompt for password, retry with `unlock(withPassword:)` |
| Content too short (< 50 words total) | Word count after extraction | Show as single section, all depths identical |

### 4.7 Supported File Types Summary

| Format | Parser | Text Extraction | Heading Detection | Cover Image | Chapter Structure |
|--------|--------|----------------|-------------------|-------------|-------------------|
| ePub (.epub) | `SwiftSoup` + ZIP | HTML → plain text | `<h1>`/`<h2>`/`<h3>` tags | OPF metadata | Spine order |
| PDF (.pdf) | `PDFKit` | `PDFPage.string` | Heuristic (caps, short lines, patterns) | N/A | Page-based splitting |
| Scanned PDF | `PDFKit` + `Vision` | OCR (`VNRecognizeTextRequest`) | Same heuristic on OCR output | N/A | Page-based splitting |

### Deliverable
Full file import pipeline: open any DRM-free ePub or PDF from Files, share sheet, drag & drop, or "Open In" → parse → chunk → AI depth generation → nubbled document in library, ready to read.

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
│   ├── ChunkingEngine.swift            # Raw text → semantic sections (200-800 words)
│   ├── DepthGenerator.swift            # Sections → 4-depth variants (Foundation Models / GPT-4o-mini)
│   ├── EPubParser.swift                # ePub ZIP → chapters (SwiftSoup HTML parsing)
│   ├── PDFExtractor.swift              # PDF → text (PDFKit + Vision OCR for scanned pages)
│   └── FileConversionPipeline.swift    # End-to-end: file open → parse → chunk → AI depths → save
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
