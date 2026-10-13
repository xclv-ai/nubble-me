import Foundation

/// One ℞ the founder accepted: the move, and whether it is done.
struct Prescription: Identifiable, Codable, Sendable, Equatable {
    enum Status: String, Codable, Sendable { case todo, done, later, skipped }
    let id: String
    let articleId: String
    let text: String
    let createdAt: Date
    var status: Status
    var isCodeRed: Bool
}
