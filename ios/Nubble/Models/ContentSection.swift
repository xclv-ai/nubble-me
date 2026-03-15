import Foundation

struct ContentSection: Identifiable, Sendable {
    let id: String
    let title: String
    let summary: String      // depth 0
    let condensed: String    // depth 1
    let standard: String     // depth 2
    let expanded: String     // depth 3

    func text(at depth: Int) -> String {
        switch depth {
        case 0: return summary
        case 1: return condensed
        case 3: return expanded
        default: return standard
        }
    }
}
