import Foundation

struct ContentSection: Identifiable, Sendable {
    let id: String
    let title: String
    let summary: String      // depth 0
    let condensed: String    // depth 1
    let standard: String     // depth 2
    let expanded: String     // depth 3
    var forProduct: String? = nil  // depth 4 — "For my product", only on news stories
    // Dr HAOS's lines (news stories with a product set)
    var headline: String? = nil    // ≤ 7 words: what changed in the market
    var action: String? = nil      // ≤ 10 words, verb first (plain)
    var verdict: String? = nil     // his line under the number
    var rx: String? = nil          // the prescription, in his voice

    /// Deepest level this section has.
    var maxDepth: Int { forProduct == nil ? 3 : 4 }

    func text(at depth: Int) -> String {
        switch depth {
        case 0: return summary
        case 1: return condensed
        case 3: return expanded
        case 4: return forProduct ?? expanded
        default: return standard
        }
    }
}
