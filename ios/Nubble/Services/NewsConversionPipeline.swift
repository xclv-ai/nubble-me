import Foundation

enum NewsConversionStage: String, Sendable {
    case fetching = "Fetching article..."
    case extracting = "Extracting content..."
    case chunking = "Analyzing structure..."
    case generatingDepths = "Generating reading depths..."
    case done = "Ready!"
}

@Observable
@MainActor
final class NewsConversionPipeline {
    var stage: NewsConversionStage = .fetching
    var progress: Double = 0
    var sectionsCompleted: Int = 0
    var totalSections: Int = 0

    private let articleExtractor = ArticleExtractor()
    private let depthGenerator = DepthGenerator()

    /// Convert a news article URL into a ContentDocument with 4 depth levels.
    func convert(article: NewsArticle, feedState: FeedState) async throws -> ContentDocument {
        stage = .fetching
        progress = 0
        feedState.updateProcessingState(article.id, state: .extracting)

        // 1. Extract article content
        stage = .extracting
        let extracted = try await articleExtractor.extract(from: article.articleUrl)
        progress = 0.25

        // Update paywall status
        if extracted.isPaywalled {
            if let idx = feedState.articles.firstIndex(where: { $0.id == article.id }) {
                feedState.articles[idx].isPaywalled = true
            }
        }

        feedState.updateProcessingState(article.id, state: .chunking)

        // 2. Chunk with news-tuned parameters
        stage = .chunking
        let chunkingEngine = ChunkingEngine(minWords: 100, maxWords: 500, splitTarget: 300)
        let chunks = chunkingEngine.chunk(extracted.bodyText, chapterTitle: extracted.title)

        // For very short articles, use the whole text as one chunk
        let finalChunks: [RawChunk]
        if chunks.isEmpty {
            finalChunks = [RawChunk(
                id: UUID().uuidString,
                position: 0,
                title: extracted.title,
                body: extracted.bodyText
            )]
        } else {
            finalChunks = chunks
        }

        totalSections = finalChunks.count
        progress = 0.35
        feedState.updateProcessingState(article.id, state: .generating)

        // 3. Generate 4 depth levels
        stage = .generatingDepths
        let sections = await depthGenerator.generateDepths(for: finalChunks, style: .news)

        sectionsCompleted = depthGenerator.sectionsCompleted
        progress = 1.0
        stage = .done

        let document = ContentDocument(
            title: extracted.title,
            author: extracted.author ?? article.sourceName,
            sections: sections
        )

        feedState.setDocument(article.id, document: document)

        return document
    }
}
