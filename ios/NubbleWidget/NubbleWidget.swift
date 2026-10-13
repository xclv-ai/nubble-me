import SwiftUI
import WidgetKit

@main
struct NubbleWidgetBundle: WidgetBundle {
    var body: some Widget { RoundsWidget() }
}

struct WidgetState: Codable {
    var next: String?
    var nextIsRed: Bool
    var openCount: Int
    var alerts: Int
    var signals: Int
    var dischargedToday: Bool
    var updatedAt: Date
    static func load() -> WidgetState? {
        guard let f = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.me.nubble.app")?.appendingPathComponent("rounds-widget.json"),
              let d = try? Data(contentsOf: f) else { return nil }
        let dec = JSONDecoder(); dec.dateDecodingStrategy = .iso8601
        return try? dec.decode(WidgetState.self, from: d)
    }
}

struct Entry: TimelineEntry { let date: Date; let state: WidgetState? }

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: .now, state: WidgetState(next: "Publish X-Ray vs Jungle Scout", nextIsRed: true, openCount: 2, alerts: 1, signals: 3, dischargedToday: false, updatedAt: .now)) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: .now, state: WidgetState.load() ?? placeholder(in: context).state)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        completion(Timeline(entries: [Entry(date: .now, state: WidgetState.load())], policy: .after(.now.addingTimeInterval(3600))))
    }
}

struct RoundsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "me.nubble.rounds", provider: Provider()) { entry in RoundsWidgetView(entry: entry) }
            .configurationDisplayName("Dr HAOS · next ℞")
            .description("The next prescription, and a red mark when a competitor moved.")
            .supportedFamilies([.accessoryRectangular, .accessoryInline, .systemSmall])
    }
}

struct RoundsWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: Entry
    private let teal = Color(red: 0.039, green: 0.231, blue: 0.267), yellow = Color(red: 0.961, green: 0.976, blue: 0), red = Color(red: 0.906, green: 0, blue: 0.039)

    private var line: String {
        guard let s = entry.state else { return "Open Nubble — Dr HAOS is reading." }
        if let n = s.next { return n }
        return s.dischargedToday ? "Discharged. Nothing else today." : s.signals > 0 ? "\(s.signals) signals waiting. Start rounds." : "Dr HAOS is reading your market."
    }
    private var mark: String { (entry.state?.alerts ?? 0) > 0 ? "■ \(entry.state!.alerts) CODE RED" : "℞ NEXT" }

    var body: some View {
        switch family {
        case .accessoryInline:
            Text("\(mark) · \(line)")
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text(mark).font(.custom("JetBrainsMono-Bold", size: 10)).foregroundStyle((entry.state?.alerts ?? 0) > 0 ? red : .primary)
                Text(line).font(.custom("InstrumentSerif-Regular", size: 16)).lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .containerBackground(for: .widget) { Color.clear }
        default:
            VStack(alignment: .leading, spacing: 6) {
                HStack { Image("DrHaos").resizable().scaledToFit().frame(width: 34, height: 34); Spacer(); Text(mark).font(.custom("JetBrainsMono-Bold", size: 9)).foregroundStyle((entry.state?.alerts ?? 0) > 0 ? red : yellow) }
                Spacer(minLength: 0)
                Text(line).font(.custom("InstrumentSerif-Regular", size: 17)).foregroundStyle(.white).lineLimit(3)
            }
            .padding(2)
            .containerBackground(for: .widget) { teal }
        }
    }
}
