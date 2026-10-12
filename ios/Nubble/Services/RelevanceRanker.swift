import Foundation
import NaturalLanguage

/// Scores each headline against the user's product with Apple's on-device sentence embeddings.
/// 1.0 = same meaning, 0 = unrelated. Instant and free; no language model call.
struct RelevanceRanker: Sendable {
    func score(_ articles: [NewsArticle], against product: ProductProfile) -> [String: Double] {
        guard let embedding = NLEmbedding.sentenceEmbedding(for: .english) else { return [:] }
        let productText = product.name + ". " + product.description
        var scores: [String: Double] = [:]
        for article in articles {
            let text = article.title + ". " + String(article.snippet.prefix(400))
            let distance = embedding.distance(between: productText, and: text, distanceType: .cosine)
            // Cosine distance runs 0 (same) … 2 (opposite)
            scores[article.id] = max(0, 1 - distance / 2)
        }
        return scores
    }
}
