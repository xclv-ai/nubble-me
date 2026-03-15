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

@Observable
@MainActor
final class DepthGenerator {
    var progress: Double = 0
    var sectionsCompleted: Int = 0
    var totalSections: Int = 0

    /// Generate 4 depth variants for each chunk.
    /// Uses Apple Foundation Models on iOS 26+, falls back to passthrough on unsupported devices.
    func generateDepths(for chunks: [RawChunk]) async -> [ContentSection] {
        totalSections = chunks.count
        sectionsCompleted = 0
        progress = 0

        var sections: [ContentSection] = []

        for chunk in chunks {
            let depths = await generateDepthSet(for: chunk)
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

    private func generateDepthSet(for chunk: RawChunk) async -> DepthSet {
        #if canImport(FoundationModels)
        do {
            return try await generateWithFoundationModels(chunk)
        } catch {
            // Foundation Models not available at runtime (simulator, unsupported device)
            return passthroughDepths(chunk)
        }
        #else
        return passthroughDepths(chunk)
        #endif
    }

    #if canImport(FoundationModels)
    private func generateWithFoundationModels(_ chunk: RawChunk) async throws -> DepthSet {
        let session = LanguageModelSession()

        let summaryPrompt = """
        Summarize this section in exactly one sentence (max 20 words). \
        Capture the single most important idea.
        Section: \(chunk.body)
        """

        let condensedPrompt = """
        Condense this section to 2-3 sentences. \
        Keep only the key points. Drop examples, qualifications, transitions.
        Section: \(chunk.body)
        """

        let expandedPrompt = """
        Expand this section with:
        - Concrete examples for each key point
        - Brief explanation of why each point matters
        - Any relevant context the reader might need
        Keep the same structure. Add 50-100% more content.
        Section: \(chunk.body)
        """

        let summaryResponse = try await session.respond(to: summaryPrompt)
        let condensedResponse = try await session.respond(to: condensedPrompt)
        let expandedResponse = try await session.respond(to: expandedPrompt)

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
