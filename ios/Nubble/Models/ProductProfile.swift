import Foundation

/// The user's product: the URL they gave and the description the phone wrote from that page.
/// The description is what every "For my product" level reads, so the user can edit it.
struct ProductProfile: Codable, Sendable, Equatable {
    var url: URL
    var name: String
    var description: String
    var updatedAt: Date
    /// The product's named offerings (e.g. "X-Ray", "Brand Alignment Truth"), read once from the description.
    var products: [String]? = nil
    /// The product's market among the source topics (commerce, marketing, ai-news, ai-research, ai-releases), decided once.
    var marketTopics: [String]? = nil
}
