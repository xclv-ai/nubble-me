import Foundation

enum ReadingTime {
    /// Average reading speed: ~230 words/minute
    static func estimate(for document: ContentDocument, at depth: Int) -> Int {
        let totalWords = document.sections.reduce(0) { sum, section in
            let text = section.text(at: depth)
            return sum + text.split(whereSeparator: { $0.isWhitespace }).count
        }
        return max(1, Int((Double(totalWords) / 230).rounded()))
    }
}
