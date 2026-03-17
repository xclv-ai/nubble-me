import Foundation

enum ArticleProcessingState: String, Codable, Sendable {
    case pending
    case extracting
    case chunking
    case generating
    case ready
    case failed
}

struct NewsArticle: Identifiable, Sendable {
    let id: String
    let title: String
    let sourceName: String
    let sourceId: String
    let author: String?
    let publishedAt: Date
    let articleUrl: URL
    let imageUrl: URL?
    let snippet: String
    let topics: [String]
    let wordCount: Int?
    var processingState: ArticleProcessingState
    var document: ContentDocument?
    var isSaved: Bool
    var isRead: Bool
    var readProgress: Double
    var lastReadAt: Date?
    var processedAt: Date?
    var errorMessage: String?
    var isPaywalled: Bool

    var estimatedReadTime: Int {
        let words = wordCount ?? snippet.split(separator: " ").count
        return max(1, Int((Double(words) / 230).rounded()))
    }
}

extension NewsArticle: Equatable {
    static func == (lhs: NewsArticle, rhs: NewsArticle) -> Bool {
        lhs.id == rhs.id
    }
}

extension NewsArticle: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
