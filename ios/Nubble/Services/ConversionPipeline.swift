import Foundation

enum ConversionStage: String, Sendable {
    case opening = "Opening file..."
    case parsing = "Parsing content..."
    case extractingText = "Extracting text..."
    case chunking = "Splitting into sections..."
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
            extracted = ExtractedDocument(
                title: title,
                author: nil,
                chapters: [ExtractedChapter(title: title, body: text, position: 0)]
            )
        default:
            throw ExtractionError.unsupportedFormat(ext)
        }

        progress = 0.2

        // Step 2: Chunk all chapters into 200-800 word sections
        stage = .chunking
        var allChunks: [RawChunk] = []
        for (index, chapter) in extracted.chapters.enumerated() {
            let chunks = chunkingEngine.chunk(
                chapter.body,
                chapterTitle: chapter.title,
                startPosition: allChunks.count
            )
            allChunks.append(contentsOf: chunks)
            progress = 0.2 + (Double(index + 1) / Double(extracted.chapters.count)) * 0.1
        }

        totalSections = allChunks.count
        progress = 0.3

        // Step 3: Generate 4 depth levels per section
        stage = .generatingDepths
        let sections = await depthGenerator.generateDepths(for: allChunks)

        // Track progress from depth generator
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
