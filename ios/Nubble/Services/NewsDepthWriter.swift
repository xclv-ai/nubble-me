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




#endif

@MainActor
final class NewsDepthWriter {
    /// Tokens per part when a text doesn't fit; the rest of the 4,096 is for instructions and the notes.
    static let partTokens = 1_200

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

        // Each block is its own plain-text request with Apple's content-transformation guardrails
        // (structured @Generable answers always run under the default filter, which refused news
        // stories); the headers are added here, so every block is always present.
        let story = "Story: \(title)\n\nFacts:\n\(facts)\n\n"
        onStep(.brief)
        let summary = try await text("summary", Self.style, story + "Write one sentence, max 20 words: what changed and why it matters.")
        let condensed = try await text("condensed", Self.style, story + "Write 2-3 sentences: what's new, what it changes, who it affects. No filler.")

        onStep(.expanded)
        let going = try await text("what's going on", Self.style, story + "In plain English, what happened? Start with the concrete fact. 2-4 sentences.")
        let bigDeal = try await text("why big deal", Self.style, story + "Why is this a big deal? Context, what led here, the numbers that matter. 3-5 sentences.")
        let truth = try await text("uncomfortable truth", Self.style, story + "What is the uncomfortable truth here: the real friction or hidden cost nobody wants to say? Only from these facts. 3-5 sentences.")
        let soWhat = try await text("so what", Self.style, story + "So what? One sentence: the punchline, what changes tomorrow.")

        var forProduct: String?
        if let product {
            onStep(.product)
            forProduct = try await productLevel(title: title, facts: facts, product: product)
        }

        return StoryLevels(
            summary: summary,
            condensed: condensed,
            expanded: """
                **WHAT'S GOING ON** \(going)

                **WHY THIS IS A BIG DEAL** \(bigDeal)

                **UNCOMFORTABLE TRUTH** \(truth)

                **SO WHAT** \(soWhat)
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

    /// Reads the user's product page and writes the description every "My product" level uses.
    /// The name is the page's own (site name or title); the model writes only the description.
    /// Describing a page the user supplied is a content transformation, so it runs with Apple's
    /// `permissiveContentTransformations` guardrails (plain-text answers only).
    func describeProduct(url: URL, name: String, pageText: String) async throws -> (name: String, description: String) {
        #if canImport(FoundationModels)
        if let reason = OnDeviceModel.unavailableReason { throw WriterError.unavailable(reason) }
        let facts = try await factSheet(title: name, text: pageText)
        lastFactSheet = facts
        let session = LanguageModelSession(model: Self.transformModel, instructions: "You describe a company's product from its own website. Use only what the page states.")
        do {
            let response = try await session.respond(to: """
                Website of \(name) (\(url.absoluteString)):
                \(facts)

                Describe this product in 80-150 words: what it sells, to whom, how it is priced, \
                who it competes with, and what makes it different. Keep the page's own product names and numbers.
                """)
            return (name, response.content.trimmingCharacters(in: .whitespacesAndNewlines))
        } catch let error as LanguageModelSession.GenerationError {
            throw WriterError.model(Self.describe(error))
        }
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
            let parts = Self.chunks(current, size: await Self.wordsPerPart(current))
            var notes: [String] = []
            for part in parts {
                let session = LanguageModelSession(model: Self.transformModel, instructions: "You take notes on a text. Keep every fact: who, what, numbers, prices, dates, names, claims, quotes. Plain sentences, no commentary.")
                do {
                    let response = try await session.respond(to: "Source: \(title)\n\nText:\n\(part)\n\nWrite the most important facts from this text in 10-15 sentences.")
                    notes.append(response.content)
                } catch let error as LanguageModelSession.GenerationError {
                    throw WriterError.model("[notes, part \(notes.count + 1) of \(parts.count)] " + Self.describe(error))
                } catch {
                    throw WriterError.model("[notes, part \(notes.count + 1) of \(parts.count)] \(type(of: error)): \(error.localizedDescription)")
                }
            }
            let joined = notes.joined(separator: "\n")
            // Notes no shorter than the text: the model isn't compressing, stop here.
            if rounds > 3 || Self.words(joined).count >= Self.words(current).count { return joined }
            current = joined
        }
        return current
    }

    /// Words per part, from the text's real tokens-per-word (Apple's counter on iOS 26.4+).
    private static func wordsPerPart(_ text: String) async -> Int {
        let wordCount = max(1, words(text).count)
        var tokensPerWord = 1.5
        if #available(iOS 26.4, macOS 26.4, *), let count = try? await SystemLanguageModel.default.tokenCount(for: text) {
            tokensPerWord = max(1, Double(count) / Double(wordCount))
        }
        return max(200, Int(Double(partTokens) / tokensPerWord))
    }

    /// Apple's guardrails for transforming text the user supplied (notes, descriptions).
    private static var transformModel: SystemLanguageModel {
        SystemLanguageModel(guardrails: .permissiveContentTransformations)
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
        let name = product.name
        let analyst = """
            You are a strategic analyst writing for the founders of \(name). Clear, direct, no corporate speak. \
            Everything you say about \(name) — its products, customers, prices, competitors — comes only from \
            ABOUT \(name.uppercased()). Companies and products in the news story belong to the story, never to \(name).
            """
        let context = """
            ABOUT \(name.uppercased()):
            \(product.description)

            NEWS STORY: \(title)
            \(facts)


            """
        let relevance = try await text("how relevant", analyst, context + "How relevant is this story to \(name)? Start with one word — High, Medium or Low — then one sentence why.")
        let applies = try await text("how it applies", analyst, context + "How does this story apply to \(name)? Connect it to \(name)'s own products and customers. 3-5 sentences.")
        let impact = try await text("impact", analyst, context + "How will this change \(name)'s market or customers in the next 6-12 months? 2-4 sentences.")
        let moves = try await text("what to do", analyst, context + "What should \(name) do about it? 2-3 specific moves as a numbered list, each using \(name)'s real products.")
        return """
            **HOW RELEVANT** \(relevance)

            **HOW IT APPLIES TO \(name.uppercased())** \(applies)

            **HOW IT WILL IMPACT \(name.uppercased())** \(impact)

            **WHAT TO DO**
            \(moves)
            """
    }

    /// One plain-text answer in a fresh session, with the content-transformation guardrails.
    private func text(_ step: String, _ instructions: String, _ prompt: String) async throws -> String {
        let session = LanguageModelSession(model: Self.transformModel, instructions: instructions)
        do {
            return try await session.respond(to: prompt).content.trimmingCharacters(in: .whitespacesAndNewlines)
        } catch let error as LanguageModelSession.GenerationError {
            throw WriterError.model("[\(step)] " + Self.describe(error))
        } catch {
            throw WriterError.model("[\(step)] \(error.localizedDescription)")
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
