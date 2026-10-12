import Foundation

struct ContentSection: Identifiable, Sendable {
    let id: String
    let title: String
    let summary: String      // depth 0
    let condensed: String    // depth 1
    let standard: String     // depth 2
    let expanded: String     // depth 3
    var forProduct: String? = nil  // depth 4 — "For my product", only on news stories

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
