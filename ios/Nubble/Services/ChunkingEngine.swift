import Foundation

struct RawChunk: Sendable {
    let id: String
    let position: Int
    let title: String
    let body: String
}

struct ChunkingEngine: Sendable {
    let minWords: Int
    let maxWords: Int
    let splitTarget: Int

    init(minWords: Int = 200, maxWords: Int = 800, splitTarget: Int = 600) {
        self.minWords = minWords
        self.maxWords = maxWords
        self.splitTarget = splitTarget
    }

    /// Chunk text into semantic sections of 200-800 words.
    /// Splits on headings first, then paragraph boundaries for oversized chunks.
    func chunk(_ text: String, chapterTitle: String? = nil, startPosition: Int = 0) -> [RawChunk] {
        let rawSections = splitOnHeadings(text, chapterTitle: chapterTitle)
        var chunks: [RawChunk] = []

        for section in rawSections {
            let wordCount = section.body.wordCount
            if wordCount > maxWords {
                // Split oversized sections on paragraph boundaries
                let subSections = splitOnParagraphs(section.body, title: section.title)
                chunks.append(contentsOf: subSections)
            } else {
                chunks.append(RawChunk(
                    id: UUID().uuidString,
                    position: 0,
                    title: section.title,
                    body: section.body.trimmingCharacters(in: .whitespacesAndNewlines)
                ))
            }
        }

        // Merge trailing short chunks (< minWords) with previous
        chunks = mergeShortTrailing(chunks)

        // Assign final positions
        chunks = chunks.enumerated().map { index, chunk in
            RawChunk(
                id: chunk.id,
                position: startPosition + index,
                title: chunk.title,
                body: chunk.body
            )
        }

        return chunks
    }

    // MARK: - Heading Splitting

    private struct RawSection {
        let title: String
        let body: String
    }

    private func splitOnHeadings(_ text: String, chapterTitle: String?) -> [RawSection] {
        let lines = text.components(separatedBy: .newlines)
        var sections: [RawSection] = []
        var currentTitle: String? = chapterTitle
        var currentBody = ""

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            if isHeading(trimmed) {
                // Save accumulated body as a section
                let body = currentBody.trimmingCharacters(in: .whitespacesAndNewlines)
                if !body.isEmpty {
                    let title = currentTitle ?? autoTitle(from: body)
                    sections.append(RawSection(title: title, body: body))
                }
                // Strip markdown heading markers for the title
                currentTitle = trimmed
                    .replacingOccurrences(of: "^#{1,6}\\s*", with: "", options: .regularExpression)
                    .trimmingCharacters(in: .whitespaces)
                currentBody = ""
            } else {
                currentBody += line + "\n"
            }
        }

        // Don't forget the last section
        let body = currentBody.trimmingCharacters(in: .whitespacesAndNewlines)
        if !body.isEmpty {
            let title = currentTitle ?? autoTitle(from: body)
            sections.append(RawSection(title: title, body: body))
        }

        return sections
    }

    private func isHeading(_ line: String) -> Bool {
        // Markdown headings
        if line.hasPrefix("#") {
            return true
        }
        // Short non-punctuated lines that look like headings
        let words = line.split(separator: " ")
        guard words.count >= 1, words.count <= 8 else { return false }
        guard !line.isEmpty else { return false }

        let lastChar = line.last
        let hasPunctuation = lastChar == "." || lastChar == "," ||
            lastChar == ";" || lastChar == ":" ||
            lastChar == "?" || lastChar == "!"

        if !hasPunctuation && words.count <= 6 {
            // ALL CAPS pattern
            if line == line.uppercased() && line != line.lowercased() {
                return true
            }
        }

        return false
    }

    // MARK: - Paragraph Splitting

    private func splitOnParagraphs(_ text: String, title: String) -> [RawChunk] {
        let paragraphs = text.components(separatedBy: "\n\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        var chunks: [RawChunk] = []
        var currentBody = ""
        var partIndex = 1

        for paragraph in paragraphs {
            let currentWords = currentBody.wordCount
            let paragraphWords = paragraph.wordCount

            if currentWords + paragraphWords > maxWords && currentWords >= minWords {
                // Current chunk is big enough, start a new one
                chunks.append(RawChunk(
                    id: UUID().uuidString,
                    position: 0,
                    title: chunks.isEmpty ? title : "\(title) (cont.)",
                    body: currentBody.trimmingCharacters(in: .whitespacesAndNewlines)
                ))
                currentBody = paragraph + "\n\n"
                partIndex += 1
            } else {
                currentBody += paragraph + "\n\n"
            }
        }

        // Remaining text
        let remaining = currentBody.trimmingCharacters(in: .whitespacesAndNewlines)
        if !remaining.isEmpty {
            chunks.append(RawChunk(
                id: UUID().uuidString,
                position: 0,
                title: chunks.isEmpty ? title : "\(title) (cont.)",
                body: remaining
            ))
        }

        return chunks
    }

    // MARK: - Merge Short Trailing

    private func mergeShortTrailing(_ chunks: [RawChunk]) -> [RawChunk] {
        guard chunks.count > 1 else { return chunks }
        var result = chunks

        // If last chunk is too short, merge with previous
        if let last = result.last, last.body.wordCount < minWords, result.count >= 2 {
            let prev = result[result.count - 2]
            let merged = RawChunk(
                id: prev.id,
                position: prev.position,
                title: prev.title,
                body: prev.body + "\n\n" + last.body
            )
            result.removeLast(2)
            result.append(merged)
        }

        return result
    }

    // MARK: - Auto Title

    private func autoTitle(from text: String) -> String {
        let words = text.split(separator: " ").prefix(6)
        let title = words.joined(separator: " ")
        if title.count > 50 {
            return String(title.prefix(47)) + "..."
        }
        return title + (words.count >= 6 ? "..." : "")
    }
}

// MARK: - String Word Count

private extension String {
    var wordCount: Int {
        split(separator: " ").count
    }
}
