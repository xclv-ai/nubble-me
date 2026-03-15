import SwiftUI

enum BoundaryDirection: Equatable {
    case min, max
}

enum DepthLevel: Int, CaseIterable, Sendable {
    case summary = 0
    case condensed = 1
    case standard = 2
    case expanded = 3

    var label: String {
        switch self {
        case .summary: "Summary"
        case .condensed: "Condensed"
        case .standard: "Standard"
        case .expanded: "Expanded"
        }
    }
}

@Observable
@MainActor
final class ReaderState {
    var globalDepth: Int = 2
    var sectionOverrides: [String: Int] = [:]
    var activeSectionId: String = ""
    var scrollProgress: Double = 0.0
    var hasSwipedOnce: Bool = false
    var boundaryFlash: BoundaryDirection? = nil

    func effectiveDepth(for sectionId: String) -> Int {
        sectionOverrides[sectionId] ?? globalDepth
    }

    func changeGlobalDepth(by delta: Int) {
        let newDepth = max(0, min(3, globalDepth + delta))
        if newDepth != globalDepth {
            globalDepth = newDepth
            sectionOverrides.removeAll()
            Haptics.medium()
        } else {
            flashBoundary(delta < 0 ? .min : .max)
            Haptics.warning()
        }
    }

    func changeSectionDepth(id: String, by delta: Int) {
        let current = effectiveDepth(for: id)
        let newDepth = max(0, min(3, current + delta))
        if newDepth != current {
            sectionOverrides[id] = newDepth
            Haptics.light()
        } else {
            flashBoundary(delta < 0 ? .min : .max)
            Haptics.warning()
        }
    }

    func resetSectionDepth(id: String) {
        sectionOverrides.removeValue(forKey: id)
    }

    private func flashBoundary(_ direction: BoundaryDirection) {
        boundaryFlash = direction
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(400))
            if boundaryFlash == direction {
                boundaryFlash = nil
            }
        }
    }
}
