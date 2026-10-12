import Foundation

struct NewsTopic: Identifiable, Hashable, Codable, Sendable {
    let id: String
    let label: String
    let emoji: String
    var isEnabled: Bool
    var sortOrder: Int
}

extension NewsTopic {
    static let defaults: [NewsTopic] = [
        .init(id: "ai-news", label: "AI News", emoji: "🤖", isEnabled: true, sortOrder: 0),
        .init(id: "ai-research", label: "Research", emoji: "🔬", isEnabled: true, sortOrder: 1),
        .init(id: "ai-releases", label: "Releases", emoji: "🚀", isEnabled: true, sortOrder: 2),
        .init(id: "commerce", label: "Commerce", emoji: "🛒", isEnabled: true, sortOrder: 3),
        .init(id: "marketing", label: "Marketing", emoji: "📣", isEnabled: true, sortOrder: 4),
        .init(id: "custom", label: "My sources", emoji: "⭐️", isEnabled: true, sortOrder: 5),
    ]
}
