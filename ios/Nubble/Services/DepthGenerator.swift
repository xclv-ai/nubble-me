#if canImport(FoundationModels)
import FoundationModels
#endif
import Foundation

struct DepthSet: Sendable {
    let summary: String
    let condensed: String
    let standard: String
    let expanded: String
}

enum DepthPromptStyle: Sendable {
    case general
    case news
}

@Observable
@MainActor
final class DepthGenerator {
    var progress: Double = 0
    var sectionsCompleted: Int = 0
    var totalSections: Int = 0

    /// Generate 4 depth variants for each chunk.
    /// Uses Apple Foundation Models on iOS 26+, falls back to passthrough on unsupported devices.
    func generateDepths(for chunks: [RawChunk], style: DepthPromptStyle = .general) async -> [ContentSection] {
        totalSections = chunks.count
        sectionsCompleted = 0
        progress = 0

        var sections: [ContentSection] = []

        for chunk in chunks {
            let depths = await generateDepthSet(for: chunk, style: style)
            let section = ContentSection(
                id: chunk.id,
                title: chunk.title,
                summary: depths.summary,
                condensed: depths.condensed,
                standard: depths.standard,
                expanded: depths.expanded
            )
            sections.append(section)

            sectionsCompleted += 1
            progress = Double(sectionsCompleted) / Double(totalSections)
        }

        return sections
    }

    private func generateDepthSet(for chunk: RawChunk, style: DepthPromptStyle) async -> DepthSet {
        #if canImport(FoundationModels)
        do {
            return try await generateWithFoundationModels(chunk, style: style)
        } catch {
            // Foundation Models not available at runtime (simulator, unsupported device)
            return passthroughDepths(chunk)
        }
        #else
        return passthroughDepths(chunk)
        #endif
    }

    // MARK: - Prompt Builders

    private func summaryPrompt(for body: String, style: DepthPromptStyle) -> String {
        switch style {
        case .general:
            return """
            Summarize this section in exactly one sentence (max 20 words). \
            Capture the single most important idea.
            Section: \(body)
            """
        case .news:
            return """
            Write a single-sentence summary (max 20 words) of this news section. \
            Focus on: what happened, who is involved, and why it matters.
            Section: \(body)
            """
        }
    }

    private func condensedPrompt(for body: String, style: DepthPromptStyle) -> String {
        switch style {
        case .general:
            return """
            Condense this section to 2-3 sentences. \
            Keep only the key points. Drop examples, qualifications, transitions.
            Section: \(body)
            """
        case .news:
            return """
            Condense this news section to 2-3 sentences. \
            Lead with the most newsworthy fact. Include key numbers, names, or dates. \
            Drop background context and attribution — just the core information.
            Section: \(body)
            """
        }
    }

    private func expandedPrompt(for body: String, style: DepthPromptStyle) -> String {
        switch style {
        case .general:
            return """
            Expand this section with:
            - Concrete examples for each key point
            - Brief explanation of why each point matters
            - Any relevant context the reader might need
            Keep the same structure. Add 50-100% more content.
            Section: \(body)
            """
        case .news:
            return """
            Expand this news section with:
            - Historical context: what led to this development
            - Industry implications: who is affected and how
            - Expert perspective: what analysts or insiders are saying
            - Related developments: connect to broader trends
            Keep journalistic tone. Add 50-100% more content.
            Section: \(body)
            """
        }
    }

    #if canImport(FoundationModels)
    private func generateWithFoundationModels(_ chunk: RawChunk, style: DepthPromptStyle) async throws -> DepthSet {
        let session = LanguageModelSession()

        let summaryResponse = try await session.respond(to: summaryPrompt(for: chunk.body, style: style))
        let condensedResponse = try await session.respond(to: condensedPrompt(for: chunk.body, style: style))
        let expandedResponse = try await session.respond(to: expandedPrompt(for: chunk.body, style: style))

        return DepthSet(
            summary: summaryResponse.content,
            condensed: condensedResponse.content,
            standard: chunk.body,
            expanded: expandedResponse.content
        )
    }
    #endif

    /// Fallback when Foundation Models is not available:
    /// all depths use the original text (no AI processing).
    private func passthroughDepths(_ chunk: RawChunk) -> DepthSet {
        // Create basic variants from the original text without AI
        let sentences = chunk.body.components(separatedBy: ". ")
        let summary = (sentences.first ?? chunk.body).trimmingCharacters(in: .whitespacesAndNewlines)
        let condensed = sentences.prefix(3).joined(separator: ". ")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return DepthSet(
            summary: summary.hasSuffix(".") ? summary : summary + ".",
            condensed: condensed.hasSuffix(".") ? condensed : condensed + ".",
            standard: chunk.body,
            expanded: chunk.body
        )
    }
}
