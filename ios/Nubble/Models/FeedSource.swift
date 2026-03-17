import Foundation

enum FeedSourceType: String, Codable, Sendable {
    case rss
    case atom
}

struct FeedSource: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let name: String
    let url: URL
    let type: FeedSourceType
    let topicIds: [String]
    let refreshIntervalMinutes: Int
    var lastFetchedAt: Date?
    var isActive: Bool
}
