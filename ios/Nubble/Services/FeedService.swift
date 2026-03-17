import Foundation

/// Fetches news feed from the nubble backend API.
struct FeedService: Sendable {

    let baseURL: URL

    init(baseURL: URL = URL(string: "http://localhost:5000")!) {
        self.baseURL = baseURL
    }

    // MARK: - API Response Types

    struct FeedResponse: Codable, Sendable {
        let articles: [ArticleDTO]
        let total: Int
        let lastRefreshedAt: String?
    }

    struct ArticleDTO: Codable, Sendable {
        let id: String
        let title: String
        let sourceName: String
        let sourceId: String
        let author: String?
        let publishedAt: String
        let articleUrl: String
        let imageUrl: String?
        let snippet: String
        let topics: [String]
        let wordCount: Int?
    }

    struct TopicDTO: Codable, Sendable {
        let id: String
        let label: String
        let emoji: String
        let isEnabled: Bool
        let sortOrder: Int
    }

    // MARK: - Fetch Feed

    func fetchFeed(topics: [String]? = nil, limit: Int = 50, offset: Int = 0) async throws -> ([NewsArticle], Date?) {
        guard var components = URLComponents(url: baseURL.appendingPathComponent("/api/feed"), resolvingAgainstBaseURL: false) else {
            throw FeedError.serverError
        }
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "offset", value: String(offset)),
        ]
        if let topics, !topics.isEmpty {
            queryItems.append(URLQueryItem(name: "topics", value: topics.joined(separator: ",")))
        }
        components.queryItems = queryItems

        guard let url = components.url else {
            throw FeedError.serverError
        }
        let (data, response) = try await URLSession.shared.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw FeedError.serverError
        }

        let decoder = JSONDecoder()
        let feedResponse = try decoder.decode(FeedResponse.self, from: data)

        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        let fallbackFormatter = ISO8601DateFormatter()
        fallbackFormatter.formatOptions = [.withInternetDateTime]

        let articles = feedResponse.articles.compactMap { dto -> NewsArticle? in
            guard let articleUrl = URL(string: dto.articleUrl) else { return nil }

            let publishedAt = isoFormatter.date(from: dto.publishedAt)
                ?? fallbackFormatter.date(from: dto.publishedAt)
                ?? Date()

            return NewsArticle(
                id: dto.id,
                title: dto.title,
                sourceName: dto.sourceName,
                sourceId: dto.sourceId,
                author: dto.author,
                publishedAt: publishedAt,
                articleUrl: articleUrl,
                imageUrl: dto.imageUrl.flatMap { URL(string: $0) },
                snippet: dto.snippet,
                topics: dto.topics,
                wordCount: dto.wordCount,
                processingState: .pending,
                document: nil,
                isSaved: false,
                isRead: false,
                readProgress: 0,
                lastReadAt: nil,
                processedAt: nil,
                errorMessage: nil,
                isPaywalled: false
            )
        }

        let lastRefreshed = feedResponse.lastRefreshedAt.flatMap { isoFormatter.date(from: $0) ?? fallbackFormatter.date(from: $0) }

        return (articles, lastRefreshed)
    }

    // MARK: - Fetch Topics

    func fetchTopics() async throws -> [NewsTopic] {
        let url = baseURL.appendingPathComponent("/api/feed/topics")
        let (data, _) = try await URLSession.shared.data(from: url)
        let dtos = try JSONDecoder().decode([TopicDTO].self, from: data)

        return dtos.map { dto in
            NewsTopic(
                id: dto.id,
                label: dto.label,
                emoji: dto.emoji,
                isEnabled: dto.isEnabled,
                sortOrder: dto.sortOrder
            )
        }
    }

    // MARK: - Trigger Refresh

    func triggerRefresh() async throws {
        let url = baseURL.appendingPathComponent("/api/feed/refresh")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw FeedError.serverError
        }
    }
}

enum FeedError: LocalizedError {
    case serverError
    case networkUnavailable

    var errorDescription: String? {
        switch self {
        case .serverError: "Unable to reach the feed server."
        case .networkUnavailable: "No network connection."
        }
    }
}
