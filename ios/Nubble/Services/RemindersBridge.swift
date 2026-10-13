import EventKit
import Foundation

/// "Prescribe → my list" also lands in the iPhone's Reminders, in a list called "Dr HAOS ℞".
/// Asked once; a refusal is silent — the in-app list still works.
enum RemindersBridge {
    static let listName = "Dr HAOS ℞"

    static func add(_ text: String, codeRed: Bool) async {
        let store = EKEventStore()
        let ok = (try? await store.requestFullAccessToReminders()) ?? false
        guard ok else { return }
        let list = store.calendars(for: .reminder).first { $0.title == listName } ?? {
            let c = EKCalendar(for: .reminder, eventStore: store)
            c.title = listName
            c.source = store.defaultCalendarForNewReminders()?.source ?? store.sources.first { $0.sourceType == .local }
            try? store.saveCalendar(c, commit: true)
            return c
        }()
        let r = EKReminder(eventStore: store)
        r.title = text
        r.calendar = list
        r.priority = codeRed ? 1 : 5
        var due = Calendar.current.dateComponents([.year, .month, .day], from: Date()); due.hour = 18
        r.dueDateComponents = due
        try? store.save(r, commit: true)
    }
}
