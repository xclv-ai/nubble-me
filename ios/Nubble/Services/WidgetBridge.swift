import Foundation
import WidgetKit

/// What the Lock Screen shows: the next ℞ and whether a code red is waiting. Written by the app, read by the widget.
struct WidgetState: Codable {
    var next: String?
    var nextIsRed: Bool
    var openCount: Int
    var alerts: Int
    var signals: Int
    var dischargedToday: Bool
    var updatedAt: Date

    static let file = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.me.nubble.app")?.appendingPathComponent("rounds-widget.json")

    static func load() -> WidgetState? {
        guard let f = file, let d = try? Data(contentsOf: f) else { return nil }
        let dec = JSONDecoder(); dec.dateDecodingStrategy = .iso8601
        return try? dec.decode(WidgetState.self, from: d)
    }
}

enum WidgetBridge {
    @MainActor static func publish(_ state: FeedState) {
        let open = state.prescriptions.filter { $0.status == .todo }
        let next = open.first { $0.isCodeRed } ?? open.first
        let w = WidgetState(next: next?.text, nextIsRed: next?.isCodeRed ?? false, openCount: open.count,
                            alerts: state.rounds.filter { state.codeRedName(for: $0) != nil }.count,
                            signals: state.rounds.count, dischargedToday: state.isDischargedToday, updatedAt: Date())
        let enc = JSONEncoder(); enc.dateEncodingStrategy = .iso8601
        if let f = WidgetState.file, let d = try? enc.encode(w) { try? d.write(to: f, options: .atomic) }
        WidgetCenter.shared.reloadAllTimelines()
    }
}
