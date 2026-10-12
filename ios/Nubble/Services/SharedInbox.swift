import CryptoKit
import Foundation

/// Pages shared to Nubble from Safari (or any app's Share button) land here via the App Group,
/// then the app turns each one into a saved story.
enum SharedInbox {
    static let appGroup = "group.me.nubble.app"

    struct Item: Codable, Sendable {
        let url: String
        let title: String?
        let sharedAt: Date
    }

    static var fileURL: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)?
            .appendingPathComponent("shared-inbox.json")
    }

    static func read() -> [Item] {
        guard let url = fileURL, let data = try? Data(contentsOf: url) else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return (try? decoder.decode([Item].self, from: data)) ?? []
    }

    static func write(_ items: [Item]) {
        guard let url = fileURL else { return }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let data = try? encoder.encode(items) { try? data.write(to: url, options: .atomic) }
    }

    @MainActor
    static func drain(into feedState: FeedState) async {
        let items = read()
        guard !items.isEmpty else { return }
        write([])
        for item in items {
            guard let url = URL(string: item.url) else { continue }
            let canonical = DuplicateDetector().canonicalUrl(url)
            let id = SHA256.hash(data: Data(canonical.utf8)).prefix(8).map { String(format: "%02x", $0) }.joined()
            if let i = feedState.articles.firstIndex(where: { $0.id == id }) {
                feedState.articles[i].isSaved = true
                continue
            }
            feedState.articles.insert(NewsArticle(
                id: id,
                title: item.title ?? url.host() ?? url.absoluteString,
                sourceName: url.host() ?? "Shared",
                sourceId: "shared",
                author: nil,
                publishedAt: item.sharedAt,
                articleUrl: url,
                imageUrl: nil,
                snippet: "",
                topics: ["custom"],
                wordCount: nil,
                processingState: .pending,
                document: nil,
                isSaved: true,
                isRead: false,
                readProgress: 0,
                lastReadAt: nil,
                processedAt: nil,
                errorMessage: nil,
                isPaywalled: false
            ), at: 0)
        }
        await feedState.rank()
    }
}
