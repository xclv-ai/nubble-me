import Foundation

/// The actionable part of a story for the product: the relevance line and the first move,
/// read from the "My product" level the iPhone wrote.
struct Signal: Sendable {
    let relevance: String
    let firstMove: String

    init?(_ document: ContentDocument?) {
        guard let text = document?.sections.first?.forProduct,
              let rel = Self.block("HOW RELEVANT", in: text) else { return nil }
        relevance = rel
        let moves = Self.block("WHAT TO DO", in: text) ?? ""
        let lines = moves.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        // The first numbered move; the model sometimes opens with a lead-in sentence
        firstMove = (lines.first { $0.range(of: #"^\**\s*(1[.)]|[-•])"#, options: .regularExpression) != nil } ?? lines.first)?
            .replacingOccurrences(of: #"^\**\s*(\d+[.)]|[-•])\s*"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: "**", with: "") ?? ""
    }

    /// Text after `**NAME…**` up to the next `**UPPERCASE` header.
    private static func block(_ name: String, in text: String) -> String? {
        guard let start = text.range(of: "**" + name) else { return nil }
        let rest = text[start.upperBound...]
        guard let close = rest.range(of: "**") else { return nil }
        var body = String(rest[close.upperBound...])
        if let next = body.range(of: #"\n\s*\*\*[A-Z]"#, options: .regularExpression) { body = String(body[..<next.lowerBound]) }
        return body.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
