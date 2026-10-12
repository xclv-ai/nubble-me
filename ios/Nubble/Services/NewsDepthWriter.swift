#if canImport(FoundationModels)
import FoundationModels
#endif
import Foundation

/// Writes every level of a news story with Apple's on-device model — no paid API.
///
/// Apple's on-device model reads 4,096 tokens per session (Apple TN3193), counting instructions,
/// input and the answer. So the article is first turned into a fact sheet (one fresh session per
/// part of a long article), and each level is then written in its own fresh session from that sheet.
enum OnDeviceModel {
    /// nil when the model can run; otherwise the reason in plain words.
    static var unavailableReason: String? {
        #if canImport(FoundationModels)
        switch SystemLanguageModel.default.availability {
        case .available: return nil
        case .unavailable(.deviceNotEligible): return "This iPhone can't run Apple Intelligence (iPhone 15 Pro or newer is needed)."
        case .unavailable(.appleIntelligenceNotEnabled): return "Apple Intelligence is off. Turn it on in Settings → Apple Intelligence & Siri."
        case .unavailable(.modelNotReady): return "Apple Intelligence is still downloading its model. Try again in a few minutes."
        case .unavailable(let other): return "Apple Intelligence is unavailable (\(other))."
        }
        #else
        return "This build has no access to Apple Intelligence."
        #endif
    }
}

struct StoryLevels: Sendable {
    let summary: String
    let condensed: String
    let expanded: String
    let forProduct: String?
}

#if canImport(FoundationModels)

@Generable
struct StoryBrief {
    @Guide(description: "One sentence, max 20 words: what changed and why it matters.")
    var summary: String
    @Guide(description: "2-3 sentences: what's new, what it changes, who it affects.")
    var condensed: String
}

@Generable
struct StoryExpanded {
    @Guide(description: "Plain English. What happened. Start with the concrete fact.")
    var whatsGoingOn: String
    @Guide(description: "Context. What led here. The numbers that matter. Why anyone should care.")
    var whyThisIsABigDeal: String
    @Guide(description: "The thing nobody wants to say. The real friction, the hidden cost.")
    var uncomfortableTruth: String
    @Guide(description: "One sentence. The punchline. What changes tomorrow.")
    var soWhat: String
}

@Generable
struct ProductImpact {
    @Guide(description: "How this story hits the product: name its offer, customers, competitors. 120-200 words.")
    var howThisHits: String
    @Guide(description: "Specific actions the product team should take, each tied to its real offer and market.", .count(2...3))
    var movesToConsider: [String]
    @Guide(description: "1-2 sentences: what competitors gain if the product ignores this.")
    var riskOfSittingThisOut: String
}

@Generable
struct ProductBrief {
    @Guide(description: "The product or company name as the page states it.")
    var name: String
    @Guide(description: "What it sells, to whom, how it is priced, who it competes with and what makes it different — only facts the page states. 80-150 words.")
    var description: String
}

#endif

@MainActor
final class NewsDepthWriter {
    /// Part size when a text doesn't fit (~1,500 tokens per session, no notes carried between parts).
    static let chunkWords = 1_000

    enum Step: String, Sendable {
        case readingArticle = "Reading the article…"
        case brief = "Writing summary and condensed…"
        case expanded = "Writing the expanded story…"
        case product = "Writing what this means for your product…"
    }

    var onStep: (Step) -> Void = { _ in }
    /// The fact sheet the levels were written from (kept for the development self-test).
    private(set) var lastFactSheet = ""

    private static let style = """
        You explain news in the style of Richard Feynman: clear, direct, provocative, no jargon \
        without explanation, no corporate speak. Say what things actually mean. Use only facts from \
        the text you are given; if something is uncertain, say so.
        """

    func write(title: String, articleText: String, product: ProductProfile?) async throws -> StoryLevels {
        #if canImport(FoundationModels)
        if let reason = OnDeviceModel.unavailableReason { throw WriterError.unavailable(reason) }

        onStep(.readingArticle)
        let facts = try await factSheet(title: title, text: articleText)
        lastFactSheet = facts

        onStep(.brief)
        let brief = try await respond(
            instructions: Self.style,
            prompt: "Story: \(title)\n\nFacts:\n\(facts)\n\nWrite the summary and the condensed version of this story.",
            generating: StoryBrief.self)

        onStep(.expanded)
        let expanded = try await respond(
            instructions: Self.style,
            prompt: "Story: \(title)\n\nFacts:\n\(facts)\n\nWrite the expanded version of this story, 300-500 words in total across the four parts.",
            generating: StoryExpanded.self)

        var forProduct: String?
        if let product {
            onStep(.product)
            forProduct = try await productLevel(title: title, facts: facts, product: product)
        }

        return StoryLevels(
            summary: brief.summary,
            condensed: brief.condensed,
            expanded: """
                **WHAT'S GOING ON** \(expanded.whatsGoingOn)

                **WHY THIS IS A BIG DEAL** \(expanded.whyThisIsABigDeal)

                **UNCOMFORTABLE TRUTH** \(expanded.uncomfortableTruth)

                **SO WHAT** \(expanded.soWhat)
                """,
            forProduct: forProduct
        )
        #else
        throw WriterError.unavailable(OnDeviceModel.unavailableReason ?? "")
        #endif
    }

    /// Only the "My product" level — used when the product description changed after a story was written.
    func writeProductLevel(title: String, articleText: String, product: ProductProfile) async throws -> String {
        #if canImport(FoundationModels)
        if let reason = OnDeviceModel.unavailableReason { throw WriterError.unavailable(reason) }
        onStep(.readingArticle)
        let facts = try await factSheet(title: title, text: articleText)
        onStep(.product)
        return try await productLevel(title: title, facts: facts, product: product)
        #else
        throw WriterError.unavailable(OnDeviceModel.unavailableReason ?? "")
        #endif
    }

    /// Reads the user's product page text and writes the description every "My product" level uses.
    func describeProduct(url: URL, pageText: String) async throws -> (name: String, description: String) {
        #if canImport(FoundationModels)
        if let reason = OnDeviceModel.unavailableReason { throw WriterError.unavailable(reason) }
        let facts = try await factSheet(title: url.host() ?? url.absoluteString, text: pageText)
        lastFactSheet = facts
        let brief = try await respond(
            instructions: "You describe a company's product from its own website. Use only what the page states.",
            prompt: "Website: \(url.absoluteString)\n\nWhat the page says:\n\(facts)\n\nDescribe this product.",
            generating: ProductBrief.self)
        return (brief.name, brief.description)
        #else
        throw WriterError.unavailable(OnDeviceModel.unavailableReason ?? "")
        #endif
    }

    #if canImport(FoundationModels)

    /// The model gets the real text whenever it fits Apple's window (4,096 tokens: instructions,
    /// text and answer together). Only text that doesn't fit is read part by part — each part in its
    /// own fresh session (Apple TN3193) — and the parts' facts are joined.
    private func factSheet(title: String, text: String) async throws -> String {
        var current = text
        var rounds = 0
        while !(await Self.fits(current)) {
            rounds += 1
            let parts = Self.chunks(current, size: Self.chunkWords)
            var notes: [String] = []
            for part in parts {
                let session = LanguageModelSession(instructions: "You take notes on a text. Keep every fact: who, what, numbers, prices, dates, names, claims, quotes. Plain sentences, no commentary.")
                let response = try await session.respond(to: "Source: \(title)\n\nText:\n\(part)\n\nWrite the facts from this text.")
                notes.append(response.content)
            }
            let joined = notes.joined(separator: "\n")
            // Notes no shorter than the text: the model isn't compressing, stop here.
            if rounds > 3 || Self.words(joined).count >= Self.words(current).count { return joined }
            current = joined
        }
        return current
    }

    /// Tokens kept free for instructions, the output schema, the product description and the answer.
    static let reservedTokens = 1_700

    /// Asks Apple's own counter whether the text fits next to everything else in one session.
    private static func fits(_ text: String) async -> Bool {
        let model = SystemLanguageModel.default
        if #available(iOS 26.4, macOS 26.4, *), let count = try? await model.tokenCount(for: text) {
            return count <= model.contextSize - reservedTokens
        }
        // Before iOS 26.4 there is no counter: ~1.5 tokens per English word
        return Double(words(text).count) * 1.5 <= Double(4_096 - reservedTokens)
    }

    private func productLevel(title: String, facts: String, product: ProductProfile) async throws -> String {
        let impact = try await respond(
            instructions: """
                You are a strategic analyst writing for the founders of \(product.name). \
                Be concrete: name their products, their customers, their competitors. \
                Not generic advice. Clear, direct, no corporate speak.
                """,
            prompt: """
                ABOUT \(product.name.uppercased()):
                \(product.description)

                NEWS STORY: \(title)
                \(facts)

                Explain how this story hits \(product.name), what they should do, and the risk of ignoring it.
                """,
            generating: ProductImpact.self)
        let moves = impact.movesToConsider.enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n")
        return """
            **HOW THIS HITS \(product.name.uppercased())** \(impact.howThisHits)

            **MOVES TO CONSIDER**
            \(moves)

            **THE RISK OF SITTING THIS OUT** \(impact.riskOfSittingThisOut)
            """
    }

    private func respond<T: Generable>(instructions: String, prompt: String, generating: T.Type) async throws -> T {
        let session = LanguageModelSession(instructions: instructions)
        do {
            return try await session.respond(to: prompt, generating: T.self).content
        } catch let error as LanguageModelSession.GenerationError {
            throw WriterError.model(Self.describe(error))
        }
    }

    private static func describe(_ error: LanguageModelSession.GenerationError) -> String {
        switch error {
        case .guardrailViolation: return "Apple's on-device model declined this story (safety filter)."
        case .rateLimited: return "The iPhone is limiting Apple Intelligence right now. Open the story again in a moment."
        case .assetsUnavailable: return "Apple Intelligence's model isn't ready on this iPhone."
        case .unsupportedLanguageOrLocale: return "Apple Intelligence doesn't support this story's language."
        default: return error.localizedDescription
        }
    }

    #endif

    private static func words(_ text: String) -> [Substring] {
        text.split(whereSeparator: \.isWhitespace)
    }

    private static func chunks(_ text: String, size: Int) -> [String] {
        let all = words(text)
        return stride(from: 0, to: all.count, by: size).map { all[$0..<min($0 + size, all.count)].joined(separator: " ") }
    }
}

enum WriterError: LocalizedError {
    case unavailable(String)
    case model(String)
    var errorDescription: String? {
        switch self {
        case .unavailable(let reason), .model(let reason): reason
        }
    }
}
