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
        var rankSeconds = 0.0
        var scored = 0
        var rankAnswers: [String] = []
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

    /// `-punch`: write headline + action for every story that already has a "My product" level.
    /// `-dump`: write today's rounds (headline, verdict, ℞, relevance, products) to Documents/rounds.json — the words, without screenshots.
    static var dumpOnly: Bool { ProcessInfo.processInfo.arguments.contains("-dump") }

    @MainActor
    static func dump(feedState: FeedState) {
        let rounds = feedState.rounds.map { a -> [String: String] in
            let s = a.section
            return ["title": a.title, "source": a.sourceName, "relevance": String(a.relevance ?? -1), "codeRed": feedState.codeRedName(for: a) ?? "",
                    "headline": s?.headline ?? "", "action": s?.action ?? "", "verdict": s?.verdict ?? "", "rx": s?.rx ?? "", "writerVersion": String(a.document?.writerVersion ?? 0),
                    "cloudRelevance": String(a.cloud?.relevance ?? -1), "cloudHeadline": a.cloud?.headline ?? "", "cloudVerdict": a.cloud?.verdict ?? "", "cloudRx": a.cloud?.rx ?? "",
                    "summary": s?.summary ?? "", "forYou": s?.forProduct ?? ""]
        }
        let out: [String: Any] = ["products": feedState.product?.products ?? [], "rankerVersion": feedState.rankerVersion, "stories": feedState.articles.count,
                                  "cloudError": feedState.cloudError ?? "", "cloudCalls": feedState.cloudCalls, "cloudJudged": feedState.articles.filter { $0.cloud != nil }.count,
                                  "high": feedState.articles.filter { ($0.relevance ?? 0) >= 1 }.count, "rounds": rounds]
        let file = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("rounds.json")
        try? JSONSerialization.data(withJSONObject: out, options: [.prettyPrinted]).write(to: file, options: .atomic)
    }

    static var punchOnly: Bool { ProcessInfo.processInfo.arguments.contains("-punch") }

    struct PunchReport: Codable { var items: [[String: String]] = []; var error: String? }

    @MainActor
    static func runPunch(feedState: FeedState) async {
        var report = PunchReport()
        let file = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("punch.json")
        func save() { try? JSONEncoder().encode(report).write(to: file, options: .atomic) }
        guard let product = feedState.product else { report.error = "no product"; save(); return }
        let writer = NewsDepthWriter()
        for a in feedState.articles {
            guard let s = a.document?.sections.first, let level = s.forProduct, level.contains("HOW RELEVANT") else { continue }
            let t = Date()
            do {
                // Rewrite the "My product" level with the current instructions, then the two short lines
                var levelNow = level
                var expandedNow = s.expanded
                if ProcessInfo.processInfo.arguments.contains("-rewrite") {
                    let all = try await writer.write(title: a.title, articleText: s.standard, product: product)
                    levelNow = all.forProduct ?? level
                    expandedNow = all.expanded
                }
                let p = try await writer.punchLines(title: a.title, summary: s.summary, productLevel: levelNow, product: product)
                var item = ["title": a.title, "forYou": levelNow, "expanded": expandedNow]
                if ProcessInfo.processInfo.arguments.contains("-haos") {
                    let h = try await writer.haosLines(title: a.title, summary: s.summary, productLevel: levelNow, product: product)
                    item["verdict"] = h.verdict; item["rx"] = h.rx
                }
                report.items.append(item)
                report.items.append(["title": a.title, "source": a.sourceName, "headline": p.headline, "action": p.action, "seconds": String(format: "%.1f", Date().timeIntervalSince(t))])
            } catch {
                report.items.append(["title": a.title, "error": error.localizedDescription])
            }
            save()
        }
        report.items.append(["done": "1"]); save()
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
            try? await Task.sleep(for: .milliseconds(200))
            while feedState.isRanking { try? await Task.sleep(for: .milliseconds(500)) }

            t = Date()
            await feedState.refresh()
            while feedState.isRanking { try? await Task.sleep(for: .milliseconds(500)) }
            await feedState.rank()
            report.rankSeconds = Date().timeIntervalSince(t)
            report.rankAnswers = RelevanceRanker.lastAnswers
            report.scored = feedState.articles.filter { $0.relevance != nil }.count
            report.sourcesRead = feedState.sources.filter { $0.isActive && $0.lastError == nil }.count
            report.sourceErrors = Dictionary(uniqueKeysWithValues: feedState.sources.compactMap { s in s.lastError.map { (s.name, $0) } })
            report.stories = feedState.articles.count
            report.topFive = feedState.articles.filter { $0.relevance != nil }.sorted { ($0.relevance ?? 0) > ($1.relevance ?? 0) }.prefix(15).map { String(format: "%.3f  ", $0.relevance ?? 0) + $0.title + "  (" + $0.sourceName + ")" }
            save(report)

            let pinned = storyURL.flatMap { u in feedState.articles.first { $0.articleUrl.absoluteString == u } }
            if storyURL == "none" { save(report); return }
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
