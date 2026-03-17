import SwiftUI

@Observable
@MainActor
final class FeedState {
    var articles: [NewsArticle] = []
    var topics: [NewsTopic] = []
    var selectedTopics: Set<String> = []
    var isRefreshing: Bool = false
    var lastRefreshedAt: Date?
    var processingQueue: Set<String> = []
    var error: String?

    var filteredArticles: [NewsArticle] {
        if selectedTopics.isEmpty { return articles }
        return articles.filter { article in
            article.topics.contains { selectedTopics.contains($0) }
        }
    }

    var unreadCount: Int {
        articles.filter { !$0.isRead }.count
    }

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
    }

    func setError(_ articleId: String, message: String) {
        guard let index = articles.firstIndex(where: { $0.id == articleId }) else { return }
        articles[index].processingState = .failed
        articles[index].errorMessage = message
    }
}
