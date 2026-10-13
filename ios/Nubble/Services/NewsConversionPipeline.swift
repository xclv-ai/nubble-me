import Foundation

enum NewsConversionStage: String, Sendable {
    case fetching = "Fetching article…"
    case readingArticle = "Reading the article…"
    case brief = "Writing summary and condensed…"
    case expanded = "Writing the expanded story…"
    case product = "Writing what this means for your product…"
    case done = "Ready!"
}

@Observable
@MainActor
final class NewsConversionPipeline {
    var stage: NewsConversionStage = .fetching
    var progress: Double = 0
    private(set) var lastFactSheet = ""
    private(set) var lastArticleText = ""

    private let articleExtractor = ArticleExtractor()

    /// Turns one news story into 5 levels written on the iPhone:
    /// 0 Summary · 1 Condensed · 2 Standard (the article's own text) · 3 Expanded · 4 My product.
    /// `inBackground`: a model error (e.g. the iPhone rationing Apple Intelligence on battery) is thrown
    /// instead of stored, so the story is written again later rather than saved with an error.
    func convert(article: NewsArticle, feedState: FeedState, product: ProductProfile?, inBackground: Bool = false) async throws -> ContentDocument {
        stage = .fetching
        progress = 0.05
        feedState.updateProcessingState(article.id, state: .extracting)

        // 1. The article's own text; when the site blocks reading, the text the feed itself carried.
        var title = article.title
        var author = article.author ?? article.sourceName
        var text = article.snippet
        if let extracted = try? await articleExtractor.extract(from: article.articleUrl),
           extracted.wordCount > article.snippet.split(whereSeparator: \.isWhitespace).count {
            text = extracted.bodyText
            if !extracted.title.isEmpty { title = extracted.title }
            if let a = extracted.author { author = a }
            if extracted.isPaywalled, let idx = feedState.articles.firstIndex(where: { $0.id == article.id }) {
                feedState.articles[idx].isPaywalled = true
            }
        }

        // 2. Levels from Apple's on-device model
        feedState.updateProcessingState(article.id, state: .generating)
        let writer = NewsDepthWriter()
        writer.onStep = { [weak self] step in
            guard let self else { return }
            switch step {
            case .readingArticle: stage = .readingArticle; progress = 0.2
            case .brief: stage = .brief; progress = 0.45
            case .expanded: stage = .expanded; progress = 0.65
            case .product: stage = .product; progress = 0.85
            }
        }

        var section: ContentSection
        do {
            lastArticleText = text
            let levels = try await writer.write(title: title, articleText: text, product: product)
            lastFactSheet = writer.lastFactSheet
            section = ContentSection(
                id: article.id + "-s1",
                title: title,
                summary: levels.summary,
                condensed: levels.condensed,
                standard: text,
                expanded: levels.expanded,
                forProduct: levels.forProduct ?? Self.noProductText
            )
            if let product, let level = levels.forProduct {
                stage = .product
                await Self.fillHaos(&section, title: title, level: level, product: product, writer: writer)
            }
        } catch {
            if inBackground { feedState.updateProcessingState(article.id, state: .pending); throw error }
            // Show the reason on every AI level; Standard still carries the article itself.
            let reason = "**ON-DEVICE AI** \(error.localizedDescription)"
            section = ContentSection(
                id: article.id + "-s1", title: title,
                summary: reason, condensed: reason, standard: text, expanded: reason,
                forProduct: product == nil ? Self.noProductText : reason
            )
            if case WriterError.unavailable = error {} else {
                feedState.setError(article.id, message: error.localizedDescription)
            }
        }

        progress = 1.0
        stage = .done
        let document = ContentDocument(
            title: title,
            author: author,
            sections: [section],
            productStamp: product?.updatedAt,
            writerVersion: NewsDepthWriter.version
        )
        feedState.setDocument(article.id, document: document)
        return document
    }

    /// Rewrites only the "My product" level when the product description changed after the story was written.
    func refreshProductLevel(article: NewsArticle, document: ContentDocument, feedState: FeedState, product: ProductProfile) async -> ContentDocument {
        guard let section = document.sections.first else { return document }
        stage = .product
        progress = 0.5
        let writer = NewsDepthWriter()
        var updated = document
        var s = section
        do {
            s.forProduct = try await writer.writeProductLevel(title: section.title, articleText: section.standard, product: product)
            updated.productStamp = product.updatedAt
            updated.writerVersion = NewsDepthWriter.version
            await Self.fillHaos(&s, title: section.title, level: s.forProduct ?? "", product: product, writer: writer)
        } catch {
            s.forProduct = "**ON-DEVICE AI** \(error.localizedDescription)"
        }
        updated.sections = [s]
        progress = 1
        stage = .done
        feedState.setDocument(article.id, document: updated)
        return updated
    }

    /// Dr HAOS's four lines; a failure leaves the line empty rather than stopping the story.
    static func fillHaos(_ section: inout ContentSection, title: String, level: String, product: ProductProfile, writer: NewsDepthWriter) async {
        if let p = try? await writer.punchLines(title: title, summary: section.summary, productLevel: level, product: product) {
            section.headline = p.headline; section.action = p.action
        }
        if let h = try? await writer.haosLines(title: title, summary: section.summary, productLevel: level, product: product) {
            section.verdict = h.verdict; section.rx = h.rx
        }
    }

    static let noProductText = "**MY PRODUCT** Add your product's web address in Settings → My product, and this level will explain how each story hits your product."
}
