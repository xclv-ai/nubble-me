import Foundation

enum ConversionStage: String, Sendable {
    case opening = "Opening file..."
    case parsing = "Parsing content..."
    case extractingText = "Extracting text..."
    case generatingDepths = "Generating reading depths..."
    case done = "Done!"
}

@Observable
@MainActor
final class ConversionPipeline {
    var stage: ConversionStage = .opening
    var progress: Double = 0
    var sectionsCompleted: Int = 0
    var totalSections: Int = 0

    private let epubParser = EPubParser()
    private let pdfExtractor = PDFExtractor()
    private let chunkingEngine = ChunkingEngine()
    private let depthGenerator = DepthGenerator()

    /// Convert an ePub or PDF file URL into a ContentDocument ready for the reader.
    ///
    /// Chapters are preserved as sections (not split into arbitrary chunks).
    /// Only plain text files without headings get chunked, since they have no natural structure.
    func convert(fileURL: URL) async throws -> ContentDocument {
        stage = .opening
        progress = 0

        // Detect format
        let ext = fileURL.pathExtension.lowercased()

        // Step 1: Extract structured text
        stage = .parsing
        let extracted: ExtractedDocument

        switch ext {
        case "epub":
            extracted = try epubParser.parse(fileURL: fileURL)
        case "pdf":
            stage = .extractingText
            extracted = try await pdfExtractor.extract(fileURL: fileURL)
        case "txt", "md", "markdown", "json":
            let text = try String(contentsOf: fileURL, encoding: .utf8)
            let title = fileURL.deletingPathExtension().lastPathComponent
            // For plain text: use chunking engine to split on headings
            let chunks = chunkingEngine.chunk(text, chapterTitle: title)
            extracted = ExtractedDocument(
                title: title,
                author: nil,
                chapters: chunks.map { ExtractedChapter(title: $0.title, body: $0.body, position: $0.position) }
            )
        default:
            throw ExtractionError.unsupportedFormat(ext)
        }

        progress = 0.3

        // Step 2: Convert chapters directly to RawChunks (preserve chapter = section)
        let chunks = extracted.chapters.enumerated().map { index, chapter in
            RawChunk(
                id: UUID().uuidString,
                position: index,
                title: chapter.title,
                body: chapter.body
            )
        }

        totalSections = chunks.count
        progress = 0.3

        // Step 3: Generate 4 depth levels per chapter/section
        stage = .generatingDepths
        let sections = await depthGenerator.generateDepths(for: chunks)

        sectionsCompleted = depthGenerator.sectionsCompleted
        progress = 1.0
        stage = .done

        return ContentDocument(
            title: extracted.title,
            author: extracted.author ?? "Unknown Author",
            sections: sections
        )
    }
}
