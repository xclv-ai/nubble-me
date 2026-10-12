import CryptoKit
import Foundation
import SwiftSoup

/// Reads every active source straight from the phone — no nubble server in between.
struct LocalFeedService: Sendable {
    /// News = items published in the last 14 days, newest 30 per source.
    static let newsWindowDays = 14
    static let itemsPerSource = 30

    struct SourceResult: Sendable {
        let sourceId: String
        let articles: [NewsArticle]
        let error: String?
    }

    func fetchAll(sources: [FeedSource]) async -> [SourceResult] {
        await withTaskGroup(of: SourceResult.self) { group in
            for source in sources where source.isActive {
                group.addTask { await fetch(source) }
            }
            var results: [SourceResult] = []
            for await r in group { results.append(r) }
            return results
        }
    }

    func fetch(_ source: FeedSource) async -> SourceResult {
        do {
            var request = URLRequest(url: source.url)
            request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) Nubble/1.1", forHTTPHeaderField: "User-Agent")
            request.timeoutInterval = 20
            let (data, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                return SourceResult(sourceId: source.id, articles: [], error: "HTTP \(http.statusCode)")
            }
            let parsed = RSSParser.parse(data)
            if parsed.items.isEmpty {
                return SourceResult(sourceId: source.id, articles: [], error: "No stories found in this feed")
            }
            let cutoff = Date(timeIntervalSinceNow: -Double(Self.newsWindowDays) * 86400)
            let articles = parsed.items
                .compactMap { article(from: $0, source: source) }
                .filter { $0.publishedAt >= cutoff }
                .sorted { $0.publishedAt > $1.publishedAt }
                .prefix(Self.itemsPerSource)
            return SourceResult(sourceId: source.id, articles: Array(articles), error: nil)
        } catch {
            return SourceResult(sourceId: source.id, articles: [], error: error.localizedDescription)
        }
    }

    private func article(from item: RSSItem, source: FeedSource) -> NewsArticle? {
        guard let url = URL(string: item.link) else { return nil }
        let canonical = DuplicateDetector().canonicalUrl(url)
        let id = SHA256.hash(data: Data(canonical.utf8)).prefix(8).map { String(format: "%02x", $0) }.joined()
        let words = item.summary.split(whereSeparator: \.isWhitespace).count
        return NewsArticle(
            id: id,
            title: item.title,
            sourceName: source.name,
            sourceId: source.id,
            author: item.author,
            publishedAt: item.published ?? Date(),
            articleUrl: url,
            imageUrl: item.imageUrl.flatMap { URL(string: $0) },
            snippet: item.summary,
            topics: source.topicIds,
            wordCount: words > 150 ? words : nil,
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

    // MARK: - Add a site by its address

    enum DiscoveryError: LocalizedError {
        case noFeed
        var errorDescription: String? { "This site doesn't publish a news feed (RSS/Atom) that the phone can find." }
    }

    /// The user pastes any address: either the feed itself, or a site whose page links to its feed.
    func discoverSource(from input: String) async throws -> FeedSource {
        var text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.lowercased().hasPrefix("http") { text = "https://" + text }
        guard let url = URL(string: text) else { throw DiscoveryError.noFeed }

        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) Nubble/1.1", forHTTPHeaderField: "User-Agent")
        let (data, response) = try await URLSession.shared.data(for: request)
        let finalUrl = response.url ?? url

        // 1. The address is a feed
        let parsed = RSSParser.parse(data)
        if !parsed.items.isEmpty {
            return makeSource(name: parsed.title.isEmpty ? (finalUrl.host() ?? "Source") : parsed.title, url: finalUrl)
        }

        // 2. The page announces its feed: <link rel="alternate" type="application/rss+xml" href="…">
        let html = String(decoding: data, as: UTF8.self)
        let doc = try SwiftSoup.parse(html, finalUrl.absoluteString)
        var candidates = try doc.select("link[rel=alternate][type*=rss], link[rel=alternate][type*=atom]").array()
            .compactMap { try? $0.absUrl("href") }
            .compactMap { URL(string: $0) }
        // 3. Common feed addresses
        for path in ["/feed", "/rss", "/rss.xml", "/feed.xml", "/atom.xml", "/blog/rss.xml", "/blog/feed"] {
            if let u = URL(string: path, relativeTo: finalUrl)?.absoluteURL { candidates.append(u) }
        }
        let siteName = (try? doc.select("meta[property=og:site_name]").attr("content")).flatMap { $0.isEmpty ? nil : $0 }
            ?? (try? doc.title()).flatMap { $0.isEmpty ? nil : $0 }
            ?? finalUrl.host() ?? "Source"

        for candidate in candidates {
            guard let (feedData, _) = try? await URLSession.shared.data(from: candidate) else { continue }
            let feed = RSSParser.parse(feedData)
            if !feed.items.isEmpty {
                return makeSource(name: feed.title.isEmpty ? siteName : feed.title, url: candidate)
            }
        }
        throw DiscoveryError.noFeed
    }

    private func makeSource(name: String, url: URL) -> FeedSource {
        FeedSource(id: "custom-" + (url.host() ?? UUID().uuidString) + "-" + String(url.path.hashValue, radix: 36),
                   name: name, url: url, topicIds: ["custom"])
    }
}
