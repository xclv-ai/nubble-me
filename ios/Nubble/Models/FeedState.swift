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
            // A changed product means new scores for every story (not when it's loaded at launch)
            if oldValue != nil {
                for i in articles.indices { articles[i].relevance = nil }
            }
            Task { await rank() }
        }
    }
    /// Competitors on the patient list: a story naming one is a code red.
    var watchlist: [String] = [] {
        didSet { persistPreferences() }
    }
    var prescriptions: [Prescription] = [] {
        didSet { Task { [prescriptions] in await FeedPersistence.shared.savePrescriptions(prescriptions) }; WidgetBridge.publish(self) }
    }
    /// yyyy-MM-dd of the last day the rounds were completed.
    var dischargedOn: String? {
        didSet { persistPreferences(); WidgetBridge.publish(self) }
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
    static let roundsCount = 3

    static var today: String { let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: Date()) }

    func codeRedName(for article: NewsArticle) -> String? {
        let hay = (article.title + " " + article.snippet).lowercased()
        return watchlist.first { !$0.isEmpty && hay.contains($0.lowercased()) }
    }

    /// Today's rounds: code reds first, then the stories closest to the product. Three.
    var rounds: [NewsArticle] {
        let fresh = articles.filter { $0.publishedAt >= Date(timeIntervalSinceNow: -3 * 86400) }
        let reds = fresh.filter { codeRedName(for: $0) != nil }.sorted { $0.publishedAt > $1.publishedAt }
        let rest = fresh.filter { codeRedName(for: $0) == nil && $0.relevance != nil }
            .sorted { ($0.relevance ?? 0, $0.publishedAt) > ($1.relevance ?? 0, $1.publishedAt) }
        return Array((reds + rest).prefix(Self.roundsCount))
    }

    var isDischargedToday: Bool { dischargedOn == Self.today }

    func prescribe(_ article: NewsArticle, text: String, status: Prescription.Status = .todo) {
        let red = codeRedName(for: article) != nil
        prescriptions.removeAll { $0.articleId == article.id }
        prescriptions.insert(Prescription(id: UUID().uuidString, articleId: article.id, text: text, createdAt: Date(), status: status, isCodeRed: red), at: 0)
        if status == .todo { Task { await RemindersBridge.add(text, codeRed: red) } }
    }

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
        prescriptions = await persistence.loadPrescriptions()
        if let prefs = await persistence.loadPreferences() {
            selectedTopics = Set(prefs.selectedTopics)
            lastRefreshedAt = prefs.lastRefreshedAt
            watchlist = prefs.watchlist ?? []
            dischargedOn = prefs.dischargedOn
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
        await rank()
        WidgetBridge.publish(self)
        Task { await writeSignals() }
    }

    /// Writes the levels for the High-relevance stories one by one while the app is open, so the
    /// product tab shows each story's signal (relevance + first move) without opening it.
    var writingSignalFor: String?
    private var isWritingSignals = false
    func writeSignals() async {
        guard let product, !isWritingSignals else { return }
        isWritingSignals = true
        defer { isWritingSignals = false; writingSignalFor = nil }
        while true {
            guard self.product == product else { return }
            let needs: (NewsArticle) -> Bool = { ($0.document == nil || $0.document?.productStamp != product.updatedAt) && $0.processingState != .failed }
            guard let next = rounds.first(where: needs)
                ?? articles.filter({ ($0.relevance ?? 0) >= 1 && needs($0) }).sorted(by: { $0.publishedAt > $1.publishedAt }).first else { return }
            writingSignalFor = next.id
            let pipeline = NewsConversionPipeline()
            if let doc = next.document {
                _ = await pipeline.refreshProductLevel(article: next, document: doc, feedState: self, product: product)
            } else if (try? await pipeline.convert(article: next, feedState: self, product: product, inBackground: true)) == nil {
                // The iPhone declined or rationed the model: stop, the next refresh continues
                return
            }
        }
    }

    /// Apple's on-device model scores the stories that have no score yet against the product.
    var isRanking = false
    func rank() async {
        guard let product else { return }
        while isRanking { try? await Task.sleep(for: .milliseconds(300)) }
        let unscored = articles.filter { $0.relevance == nil }
        guard !unscored.isEmpty else { return }
        isRanking = true
        defer { isRanking = false }
        let scores = await RelevanceRanker().score(unscored, against: product)
        guard self.product == product else { return }
        for i in articles.indices where articles[i].relevance == nil {
            articles[i].relevance = scores[articles[i].id]
        }
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
                    lastRefreshedAt: lastRefreshedAt,
                    watchlist: watchlist,
                    dischargedOn: dischargedOn
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
