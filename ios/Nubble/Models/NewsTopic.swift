import Foundation

struct NewsTopic: Identifiable, Hashable, Codable, Sendable {
    let id: String
    let label: String
    let emoji: String
    var isEnabled: Bool
    var sortOrder: Int
}
