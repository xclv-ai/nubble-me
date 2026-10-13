#if canImport(FoundationModels)
import FoundationModels
#endif
import Foundation

/// Apple's on-device model reads each story next to the product description and answers
/// high / medium / low for how much it matters to the product's business.
struct RelevanceRanker: Sendable {
    /// Bump when the ranking rule changes: every story is scored again.
    static let version = 3
    #if DEBUG
    /// The model's raw answers from the last run (development self-test only).
    nonisolated(unsafe) static var lastAnswers: [String] = []
    #endif

    /// Scores 0…1 by article id; stories in a group the model couldn't score are left out.
    func score(_ articles: [NewsArticle], against product: ProductProfile) async -> [String: Double] {
        #if canImport(FoundationModels)
        guard OnDeviceModel.unavailableReason == nil else { return [:] }
        var scores: [String: Double] = [:]
        let model = SystemLanguageModel(guardrails: .permissiveContentTransformations)
        let instructions = """
            You judge whether a news story matters to one company's business: its customers, its market, \
            its sales channels and its competitors.

            ABOUT \(product.name.uppercased()):
            \(product.description)

            high = a founder of \(product.name) must act on it this week (it changes what their customers buy, how they sell, or what a competitor offers). \
            medium = worth knowing, no action. low = not their business.
            Answer in the form `level — reason`, where reason names the \(product.name) customer, product or competitor it touches, in at most 12 words.
            """
        // words of the product's own world; a "high" whose reason shares none of them is a guess, not a signal
        let world = Set(product.description.lowercased().split(whereSeparator: { !$0.isLetter }).map(String.init).filter { $0.count >= 5 })
        // One story per request: the small model judges single items far better than lists
        for article in articles {
            let session = LanguageModelSession(model: model, instructions: instructions)
            let story = "\(article.title) — \(article.snippet.prefix(300).replacingOccurrences(of: "\n", with: " "))"
            guard let answer = try? await session.respond(to: "STORY: \(story)\n\nDoes this story matter to \(product.name)'s business? high, medium or low?", options: GenerationOptions(samplingMode: .greedy)).content.lowercased() else { continue }
            #if DEBUG
            Self.lastAnswers.append(answer.prefix(40) + " | " + article.title)
            #endif
            let level = answer.split(separator: "—").first.map(String.init) ?? answer
            let reason = answer.split(separator: "—").dropFirst().joined(separator: "—")
            let grounded = !reason.lowercased().split(whereSeparator: { !$0.isLetter }).map(String.init).filter { world.contains($0) }.isEmpty
            if level.contains("high") { scores[article.id] = grounded ? 1.0 : 0.5 }
            else if level.contains("medium") { scores[article.id] = 0.5 }
            else if level.contains("low") { scores[article.id] = 0.0 }
        }
        return scores
        #else
        return [:]
        #endif
    }
}
