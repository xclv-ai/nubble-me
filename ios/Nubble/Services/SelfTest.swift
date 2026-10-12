#if DEBUG
import Foundation
import FoundationModels

/// Development builds only. Launched with `-selftest <product url>`, the app runs the real steps
/// (read product page → describe → read sources → rank → write all levels for the top story)
/// and saves what came out to Documents/selftest.json, so it can be read off the phone.
enum SelfTest {
    struct Report: Codable {
        var startedAt = Date()
        var modelUnavailable: String?
        var languages: [String] = []
        var locale = ""
        var modelSupportsLocale = false
        var freeStorageGB = 0.0
        var productName = ""
        var productDescription = ""
        var productSeconds = 0.0
        var sourcesRead = 0
        var sourceErrors: [String: String] = [:]
        var stories = 0
        var topFive: [String] = []
        var storyTitle = ""
        var storyUrl = ""
        var levels: [String] = []
        var storySeconds = 0.0
        var error: String?
        var productPageText = ""
        var productFactSheet = ""
        var storyArticleWords = 0
        var storyFactSheet = ""
    }

    /// Optional `-story <url>`: write this story instead of the top-ranked one (same instance across runs).
    static var storyURL: String? {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-story"), i + 1 < args.count else { return nil }
        return args[i + 1]
    }

    static var productURL: URL? {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-selftest"), i + 1 < args.count else { return nil }
        return URL(string: args[i + 1])
    }

    @MainActor
    static func run(feedState: FeedState, url: URL) async {
        var report = Report()
        report.modelUnavailable = OnDeviceModel.unavailableReason
        report.languages = Locale.preferredLanguages
        report.locale = Locale.current.identifier
        report.modelSupportsLocale = SystemLanguageModel.default.supportsLocale(Locale.current)
        let values = try? URL(fileURLWithPath: NSHomeDirectory()).resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
        report.freeStorageGB = Double(values?.volumeAvailableCapacityForImportantUsage ?? 0) / 1e9
        save(report)
        do {
            var t = Date()
            let page = try await PageReader().text(of: url)
            report.productPageText = page.text
            let describer = NewsDepthWriter()
            let brief = try await describer.describeProduct(url: page.finalUrl, name: page.title, pageText: page.text)
            report.productFactSheet = describer.lastFactSheet
            report.productSeconds = Date().timeIntervalSince(t)
            report.productName = brief.name
            report.productDescription = brief.description
            save(report)
            feedState.product = ProductProfile(url: page.finalUrl, name: brief.name, description: brief.description, updatedAt: Date())

            await feedState.refresh()
            report.sourcesRead = feedState.sources.filter { $0.isActive && $0.lastError == nil }.count
            report.sourceErrors = Dictionary(uniqueKeysWithValues: feedState.sources.compactMap { s in s.lastError.map { (s.name, $0) } })
            report.stories = feedState.articles.count
            report.topFive = feedState.mostRelevant.map { String(format: "%.3f  ", $0.relevance ?? 0) + $0.title + "  (" + $0.sourceName + ")" }
            save(report)

            let pinned = storyURL.flatMap { u in feedState.articles.first { $0.articleUrl.absoluteString == u } }
            guard let top = pinned ?? feedState.mostRelevant.first else { report.error = "no ranked stories"; save(report); return }
            report.storyTitle = top.title
            report.storyUrl = top.articleUrl.absoluteString
            t = Date()
            let pipeline = NewsConversionPipeline()
            let doc = try await pipeline.convert(article: top, feedState: feedState, product: feedState.product)
            report.storySeconds = Date().timeIntervalSince(t)
            report.storyArticleWords = pipeline.lastArticleText.split(whereSeparator: \.isWhitespace).count
            report.storyFactSheet = pipeline.lastFactSheet
            if let s = doc.sections.first {
                report.levels = (0...s.maxDepth).map { "LEVEL \($0)\n" + s.text(at: $0) }
            }
        } catch {
            report.error = error.localizedDescription
        }
        save(report)
    }

    private static func save(_ report: Report) {
        let file = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("selftest.json")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .withoutEscapingSlashes]
        encoder.dateEncodingStrategy = .iso8601
        try? encoder.encode(report).write(to: file, options: .atomic)
    }
}
#endif
