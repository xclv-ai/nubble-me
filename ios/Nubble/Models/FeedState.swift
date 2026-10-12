import SwiftUI

@Observable
@MainActor
final class FeedState {
    var articles: [NewsArticle] = [] {
        didSet { schedulePersist() }
    }
    var topics: [NewsTopic] = [] {
        didSet { persistTopics() }
    }
    var selectedTopics: Set<String> = [] {
        didSet { persistPreferences() }
    }
    var sources: [FeedSource] = FeedSource.defaults {
        didSet { persistSources() }
    }
    var product: ProductProfile? {
        didSet {
            guard product != oldValue else { return }
            Task { await FeedPersistence.shared.saveProduct(product) }
            rank()
        }
    }
    var isRefreshing: Bool = false
    var lastRefreshedAt: Date? {
        didSet { persistPreferences() }
    }
    var processingQueue: Set<String> = []
    var error: String?

    private var persistTask: Task<Void, Never>?

    var filteredArticles: [NewsArticle] {
        let byDate = articles.sorted { $0.publishedAt > $1.publishedAt }
        if selectedTopics.isEmpty { return byDate }
        return byDate.filter { article in
            article.topics.contains { selectedTopics.contains($0) }
        }
    }

    /// Stories closest to the user's product, best first (empty until a product is set).
    var mostRelevant: [NewsArticle] {
        guard product != nil else { return [] }
        return Array(filteredArticles
            .filter { $0.relevance != nil }
            .sorted { ($0.relevance ?? 0) > ($1.relevance ?? 0) }
            .prefix(Self.relevantCount))
    }

    /// Everything else, newest first.
    var latest: [NewsArticle] {
        let top = Set(mostRelevant.map(\.id))
        return filteredArticles.filter { !top.contains($0.id) }
    }

    static let relevantCount = 5

    var unreadCount: Int {
        articles.filter { !$0.isRead }.count
    }

    // MARK: - Persistence

    func loadFromDisk() async {
        let persistence = FeedPersistence.shared
        let cached = await persistence.loadArticles()
        if !cached.isEmpty {
            articles = cached
        }
        let savedTopics = await persistence.loadTopics() ?? []
        topics = savedTopics.isEmpty ? NewsTopic.defaults : savedTopics
        sources = await persistence.loadSources()
        product = await persistence.loadProduct()
        if let prefs = await persistence.loadPreferences() {
            selectedTopics = Set(prefs.selectedTopics)
            lastRefreshedAt = prefs.lastRefreshedAt
        }
    }

    private func schedulePersist() {
        persistTask?.cancel()
        persistTask = Task { [articles] in
            try? await Task.sleep(for: .seconds(1))
            guard !Task.isCancelled else { return }
            await FeedPersistence.shared.saveArticles(articles)
        }
    }

    private func persistSources() {
        Task { [sources] in
            await FeedPersistence.shared.saveSources(sources)
        }
    }

    // MARK: - Reading the sources

    /// Reads every active source on the phone, keeps what the user already did with each story.
    func refresh() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }

        let results = await LocalFeedService().fetchAll(sources: sources)
        let now = Date()
        for r in results {
            guard let i = sources.firstIndex(where: { $0.id == r.sourceId }) else { continue }
            sources[i].lastFetchedAt = now
            sources[i].lastError = r.error
        }

        let fetched = results.flatMap(\.articles)
        if fetched.isEmpty {
            error = results.compactMap(\.error).isEmpty ? "No stories in the last \(LocalFeedService.newsWindowDays) days." : "Couldn't read the sources. Check the internet connection."
            return
        }
        error = nil

        var byId = Dictionary(articles.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
        let detector = DuplicateDetector()
        var kept: [NewsArticle] = Array(byId.values)
        for article in fetched where byId[article.id] == nil {
            if detector.isDuplicate(article, existingArticles: kept) { continue }
            byId[article.id] = article
            kept.append(article)
        }
        let cutoff = Date(timeIntervalSinceNow: -Double(LocalFeedService.newsWindowDays) * 86400)
        articles = kept.filter { $0.isSaved || $0.publishedAt >= cutoff }
        lastRefreshedAt = now
        rank()
    }

    /// Scores every story against the product with Apple's on-device sentence embeddings.
    func rank() {
        guard let product else {
            for i in articles.indices { articles[i].relevance = nil }
            return
        }
        let scores = RelevanceRanker().score(articles, against: product)
        for i in articles.indices { articles[i].relevance = scores[articles[i].id] }
    }

    private func persistTopics() {
        Task {
            await FeedPersistence.shared.saveTopics(topics)
        }
    }

    private func persistPreferences() {
        Task {
            await FeedPersistence.shared.savePreferences(
                .init(
                    selectedTopics: Array(selectedTopics),
                    refreshInterval: 15,
                    lastRefreshedAt: lastRefreshedAt
                )
            )
        }
    }

    // MARK: - Actions

    func markAsRead(_ articleId: String) {
        guard let index = articles.firstIndex(where: { $0.id == articleId }) else { return }
        articles[index].isRead = true
        articles[index].lastReadAt = Date()
    }

    func toggleSaved(_ articleId: String) {
        guard let index = articles.firstIndex(where: { $0.id == articleId }) else { return }
        articles[index].isSaved.toggle()
    }

    func updateProcessingState(_ articleId: String, state: ArticleProcessingState) {
        guard let index = articles.firstIndex(where: { $0.id == articleId }) else { return }
        articles[index].processingState = state
    }

    func setDocument(_ articleId: String, document: ContentDocument) {
        guard let index = articles.firstIndex(where: { $0.id == articleId }) else { return }
        articles[index].document = document
        articles[index].processingState = .ready
        articles[index].processedAt = Date()
        // Persist the document separately (larger data)
        Task {
            await FeedPersistence.shared.saveDocument(articleId: articleId, document: document)
        }
    }

    func setError(_ articleId: String, message: String) {
        guard let index = articles.firstIndex(where: { $0.id == articleId }) else { return }
        articles[index].processingState = .failed
        articles[index].errorMessage = message
    }
}
