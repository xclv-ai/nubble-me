import Foundation

/// Persists feed state (articles, topic preferences, settings) to the Documents directory as JSON.
/// Lightweight alternative to SwiftData — can be upgraded later without changing the API.
actor FeedPersistence {
    static let shared = FeedPersistence()

    private let fileManager = FileManager.default

    private var cacheDir: URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("FeedCache", isDirectory: true)
    }

    private var articlesFile: URL { cacheDir.appendingPathComponent("articles.json") }
    private var topicsFile: URL { cacheDir.appendingPathComponent("topics.json") }
    private var preferencesFile: URL { cacheDir.appendingPathComponent("preferences.json") }
    private var documentsDir: URL { cacheDir.appendingPathComponent("documents", isDirectory: true) }

    private init() {
        try? fileManager.createDirectory(at: cacheDir, withIntermediateDirectories: true)
        try? fileManager.createDirectory(at: documentsDir, withIntermediateDirectories: true)
    }

    // MARK: - Codable DTOs

    struct PersistedArticle: Codable {
        let id: String
        let title: String
        let sourceName: String
        let sourceId: String
        let author: String?
        let publishedAt: Date
        let articleUrl: String
        let imageUrl: String?
        let snippet: String
        let topics: [String]
        let wordCount: Int?
        let isSaved: Bool
        let isRead: Bool
        let readProgress: Double
        let lastReadAt: Date?
        let processedAt: Date?
        let isPaywalled: Bool
        let hasDocument: Bool
    }

    struct PersistedPreferences: Codable {
        var selectedTopics: [String]
        var refreshInterval: Int
        var lastRefreshedAt: Date?
    }

    // MARK: - Articles

    func saveArticles(_ articles: [NewsArticle]) {
        let persisted = articles.map { a in
            PersistedArticle(
                id: a.id,
                title: a.title,
                sourceName: a.sourceName,
                sourceId: a.sourceId,
                author: a.author,
                publishedAt: a.publishedAt,
                articleUrl: a.articleUrl.absoluteString,
                imageUrl: a.imageUrl?.absoluteString,
                snippet: a.snippet,
                topics: a.topics,
                wordCount: a.wordCount,
                isSaved: a.isSaved,
                isRead: a.isRead,
                readProgress: a.readProgress,
                lastReadAt: a.lastReadAt,
                processedAt: a.processedAt,
                isPaywalled: a.isPaywalled,
                hasDocument: a.document != nil
            )
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let data = try? encoder.encode(persisted) else { return }
        try? data.write(to: articlesFile, options: .atomic)
    }

    func loadArticles() -> [NewsArticle] {
        guard let data = try? Data(contentsOf: articlesFile) else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let persisted = try? decoder.decode([PersistedArticle].self, from: data) else { return [] }

        return persisted.compactMap { p in
            guard let url = URL(string: p.articleUrl) else { return nil }
            let doc = loadDocument(articleId: p.id)
            return NewsArticle(
                id: p.id,
                title: p.title,
                sourceName: p.sourceName,
                sourceId: p.sourceId,
                author: p.author,
                publishedAt: p.publishedAt,
                articleUrl: url,
                imageUrl: p.imageUrl.flatMap { URL(string: $0) },
                snippet: p.snippet,
                topics: p.topics,
                wordCount: p.wordCount,
                processingState: doc != nil ? .ready : .pending,
                document: doc,
                isSaved: p.isSaved,
                isRead: p.isRead,
                readProgress: p.readProgress,
                lastReadAt: p.lastReadAt,
                processedAt: p.processedAt,
                errorMessage: nil,
                isPaywalled: p.isPaywalled
            )
        }
    }

    // MARK: - ContentDocuments

    func saveDocument(articleId: String, document: ContentDocument) {
        let dto = PersistedDocument(
            title: document.title,
            author: document.author,
            sections: document.sections.map { s in
                PersistedSection(
                    id: s.id, title: s.title,
                    summary: s.summary, condensed: s.condensed,
                    standard: s.standard, expanded: s.expanded
                )
            }
        )
        guard let data = try? JSONEncoder().encode(dto) else { return }
        let file = documentsDir.appendingPathComponent("\(articleId).json")
        try? data.write(to: file, options: .atomic)
    }

    func loadDocument(articleId: String) -> ContentDocument? {
        let file = documentsDir.appendingPathComponent("\(articleId).json")
        guard let data = try? Data(contentsOf: file) else { return nil }
        guard let dto = try? JSONDecoder().decode(PersistedDocument.self, from: data) else { return nil }
        return ContentDocument(
            title: dto.title,
            author: dto.author,
            sections: dto.sections.map { s in
                ContentSection(
                    id: s.id, title: s.title,
                    summary: s.summary, condensed: s.condensed,
                    standard: s.standard, expanded: s.expanded
                )
            }
        )
    }

    func deleteDocument(articleId: String) {
        let file = documentsDir.appendingPathComponent("\(articleId).json")
        try? fileManager.removeItem(at: file)
    }

    // MARK: - Topics

    func saveTopics(_ topics: [NewsTopic]) {
        guard let data = try? JSONEncoder().encode(topics) else { return }
        try? data.write(to: topicsFile, options: .atomic)
    }

    func loadTopics() -> [NewsTopic]? {
        guard let data = try? Data(contentsOf: topicsFile) else { return nil }
        return try? JSONDecoder().decode([NewsTopic].self, from: data)
    }

    // MARK: - Preferences

    func savePreferences(_ prefs: PersistedPreferences) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let data = try? encoder.encode(prefs) else { return }
        try? data.write(to: preferencesFile, options: .atomic)
    }

    func loadPreferences() -> PersistedPreferences? {
        guard let data = try? Data(contentsOf: preferencesFile) else { return nil }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try? decoder.decode(PersistedPreferences.self, from: data)
    }

    // MARK: - Pruning

    func pruneOldArticles(olderThan days: Int = 30) {
        let cutoff = Date(timeIntervalSinceNow: -Double(days * 86400))
        var articles = loadArticles()
        let before = articles.count
        articles.removeAll { !$0.isSaved && $0.publishedAt < cutoff }
        if articles.count < before {
            // Clean up orphaned documents
            let kept = Set(articles.map(\.id))
            if let files = try? fileManager.contentsOfDirectory(at: documentsDir, includingPropertiesForKeys: nil) {
                for file in files {
                    let articleId = file.deletingPathExtension().lastPathComponent
                    if !kept.contains(articleId) {
                        try? fileManager.removeItem(at: file)
                    }
                }
            }
        }
    }

    // MARK: - Document DTOs

    private struct PersistedDocument: Codable {
        let title: String
        let author: String
        let sections: [PersistedSection]
    }

    private struct PersistedSection: Codable {
        let id: String
        let title: String
        let summary: String
        let condensed: String
        let standard: String
        let expanded: String
    }
}
