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
    var isRefreshing: Bool = false
    var lastRefreshedAt: Date? {
        didSet { persistPreferences() }
    }
    var processingQueue: Set<String> = []
    var error: String?

    private var persistTask: Task<Void, Never>?

    var filteredArticles: [NewsArticle] {
        if selectedTopics.isEmpty { return articles }
        return articles.filter { article in
            article.topics.contains { selectedTopics.contains($0) }
        }
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
        if let savedTopics = await persistence.loadTopics() {
            topics = savedTopics
        }
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
