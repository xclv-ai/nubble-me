import SwiftUI

/// The rounds: one signal per page, then discharge.
struct RoundsFlow: View {
    @Environment(FeedState.self) private var feedState
    @Environment(\.dismiss) private var dismiss
    let articles: [NewsArticle]
    @State private var page = 0

    var body: some View {
        TabView(selection: $page) {
            ForEach(Array(articles.enumerated()), id: \.element.id) { i, a in
                SignalPage(articleId: a.id, index: i + 1, total: articles.count, onNext: { advance() }).tag(i)
            }
            DischargePage(onClose: { dismiss() }).tag(articles.count)
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .ignoresSafeArea()
        .preferredColorScheme(.light)
        .onChange(of: page) { _, p in if p == articles.count { feedState.dischargedOn = FeedState.today } }
        .onAppear {
            #if DEBUG
            let args = ProcessInfo.processInfo.arguments
            if let i = args.firstIndex(of: "-page"), i + 1 < args.count, let n = Int(args[i + 1]) { page = min(n, articles.count) }
            #endif
        }
    }

    private func advance() { withAnimation(.easeInOut(duration: 0.25)) { page = min(page + 1, articles.count) } }
}

/// B/C · One signal: the truth, the evidence, the ℞. Red when a competitor on the watchlist is in it.
struct SignalPage: View {
    @Environment(FeedState.self) private var feedState
    let articleId: String
    let index: Int
    let total: Int
    let onNext: () -> Void
    @State private var pipeline = NewsConversionPipeline()
    @State private var writing = false
    @State private var showWhy = false

    private var article: NewsArticle? { feedState.articles.first { $0.id == articleId } }
    private var section: ContentSection? { article?.section }
    private var competitor: String? { article.flatMap { feedState.codeRedName(for: $0) } }
    private var isRed: Bool { competitor != nil }
    private var product: String { feedState.product?.name ?? "you" }

    var body: some View {
        VStack(spacing: 0) {
            Color.clear.frame(height: 54).background(isRed ? Pok.critical : Pok.teal)
            Ticker(text: isRed ? " [!] Code red • competitor on your patient list • \(competitor ?? "") " : " [+] \(String(format: "%02d", index)) // \(String(format: "%02d", total)) • \(article?.sourceName ?? "") • \(Self.time(article?.publishedAt)) ",
                   bg: isRed ? Pok.critical : Pok.teal, fg: isRed ? Pok.card : Pok.grey)
            if let section, let article {
                ScrollView {
                    VStack(spacing: 0) {
                        truth(section)
                        evidence(section, article)
                    }
                }
                .background(Pok.beige)
                rx(section, article)
            } else {
                writingView
            }
        }
        .background(isRed ? Pok.pink : Pok.teal)
        .task {
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("-why"), index == 1 { try? await Task.sleep(for: .seconds(2)); showWhy = true }
            #endif
            await writeIfNeeded()
        }
        .sheet(isPresented: $showWhy) { if let section { DepthSheet(section: section, product: product) } }
    }

    // Pink (code red) or teal: the headline in Instrument Serif, then his line
    private func truth(_ s: ContentSection) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            PokLabelGrey(text: "\(String(format: "%02d", index)) // \(String(format: "%02d", total)) · \(isRed ? "Uncomfortable truth" : "Diagnosis")", color: isRed ? Pok.teal.opacity(0.6) : Pok.grey)
            SerifLine(text: s.headline ?? s.title, size: 38, color: isRed ? Pok.teal : Pok.card)
            if let v = s.verdict, !v.isEmpty, isRed { DoctorSays(line: v, size: 19, color: Pok.teal).padding(.top, 6) }
        }
        .padding(.horizontal, 24).padding(.top, 14).padding(.bottom, 22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(isRed ? Pok.pink : Pok.teal)
    }

    // Beige: the number (if the story has one) as the hero, the square, the evidence rows, his verdict
    private func evidence(_ s: ContentSection, _ a: NewsArticle) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            if isRed {
                PokLabel(text: "02 // The evidence").padding(.bottom, 10)
                VStack(spacing: 8) {
                    ChartRow(key: "Symptom", value: s.summary)
                    ChartRow(key: "Diagnosis", value: Self.lead(of: s.forProduct, block: "WHAT IT MEANS") ?? s.condensed)
                    ChartRow(key: "Seen", value: "\(Self.time(a.publishedAt)) · \(a.articleUrl.host() ?? a.sourceName)")
                }
                HStack(spacing: 12) { PokLabelGrey(text: "Threat").frame(width: 92, alignment: .leading); SquareMeter(count: 5, on: (a.relevance ?? 0) >= 1 ? 4 : 3, color: Pok.critical); Text("\((a.relevance ?? 0) >= 1 ? 4 : 3) / 5").font(Pok.mono(12)) }.padding(.top, 10)
            } else if let fact = HeroFact.find(in: s.summary + " " + s.standard) {
                PokLabelGrey(text: fact.label)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(fact.number).font(Pok.serif(88)).foregroundStyle(Pok.teal)
                    Text(fact.unit).font(Pok.serif(40)).foregroundStyle(Pok.teal)
                }
                .minimumScaleFactor(0.6).lineLimit(1)
                PokLabelGrey(text: "Evidence · \(a.sourceName) · \(Self.date(a.publishedAt))").padding(.top, 4)
                DottedRule()
            } else {
                PokLabelGrey(text: "What changed")
                SerifLine(text: s.summary, size: 24).padding(.top, 6)
                PokLabelGrey(text: "Evidence · \(a.sourceName) · \(Self.date(a.publishedAt))").padding(.top, 10)
                DottedRule()
            }
            if !isRed, let v = s.verdict, !v.isEmpty { DoctorSays(line: v, size: 19).padding(.top, 18) }
        }
        .padding(.horizontal, 24).padding(.top, 20).padding(.bottom, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // Yellow: the prescription
    private func rx(_ s: ContentSection, _ a: NewsArticle) -> some View {
        let line = s.rx?.isEmpty == false ? s.rx! : (s.action ?? "Read the full diagnosis.")
        return RxBlock(title: isRed ? "Counter-move · today" : "Do this now", rx: line) {
            HStack(spacing: 8) {
                PokButton(text: "Prescribe → my list") { feedState.prescribe(a, text: line); onNext() }
                PokButton(text: isRed ? "Skip" : "Why?", trailing: "", outline: true) {
                    if isRed { feedState.prescribe(a, text: line, status: .skipped); onNext() } else { showWhy = true }
                }
                .frame(width: 96)
            }
        }
    }

    private var writingView: some View {
        VStack(spacing: 16) {
            Spacer()
            Image("DrHaos").resizable().scaledToFit().frame(width: 104, height: 104)
            SerifLine(text: writing ? "Reading it properly. *Thirty seconds.*" : (article?.errorMessage.map { "I couldn't read this one: \($0)" } ?? "Waiting for the article."), size: 22, color: Pok.card)
                .multilineTextAlignment(.center)
            Text(pipeline.stage.rawValue.uppercased()).font(Pok.mono(10)).tracking(0.8).foregroundStyle(Pok.grey)
            Spacer()
            PokButton(text: "Skip for now", fill: Pok.yellow, fg: Pok.teal) { onNext() }.padding(.horizontal, 24).padding(.bottom, 40)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Pok.teal)
    }

    private func writeIfNeeded() async {
        guard let article, article.document == nil || article.document?.productStamp != feedState.product?.updatedAt, !writing else { return }
        writing = true; defer { writing = false }
        if let doc = article.document, let product = feedState.product {
            _ = await pipeline.refreshProductLevel(article: article, document: doc, feedState: feedState, product: product)
        } else {
            _ = try? await pipeline.convert(article: article, feedState: feedState, product: feedState.product)
        }
    }

    static func lead(of text: String?, block: String) -> String? {
        guard let text, let r = text.range(of: "**\(block)") else { return nil }
        let rest = text[r.upperBound...]
        guard let close = rest.range(of: "**") else { return nil }
        let body = rest[close.upperBound...].trimmingCharacters(in: .whitespacesAndNewlines)
        if body.hasPrefix("**"), let end = body.dropFirst(2).range(of: "**") { return String(body.dropFirst(2)[..<end.lowerBound]) }
        return body.split(separator: "\n").first.map(String.init)
    }
    static func time(_ d: Date?) -> String { guard let d else { return "" }; let f = DateFormatter(); f.dateFormat = "HH:mm"; return f.string(from: d) }
    static func date(_ d: Date?) -> String { guard let d else { return "" }; let f = DateFormatter(); f.dateFormat = "d MMM"; return f.string(from: d) }
}

/// The number in the story, if it has one: "$9.86" + "B", with the words around it as the label.
struct HeroFact {
    let number: String
    let unit: String
    let label: String

    static func find(in text: String) -> HeroFact? {
        let pattern = #"([$€£]\s?\d[\d.,]*|\d[\d.,]*\s?%|\d[\d,]{3,})\s?(billion|million|trillion|bn|m|k|B|M|K)?"#
        guard let re = try? NSRegularExpression(pattern: pattern), let m = re.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)), let r = Range(m.range, in: text) else { return nil }
        var number = String(text[Range(m.range(at: 1), in: text)!]).replacingOccurrences(of: " ", with: "")
        var unit = m.range(at: 2).location != NSNotFound ? String(text[Range(m.range(at: 2), in: text)!]) : ""
        unit = ["billion": "B", "million": "M", "trillion": "T", "bn": "B", "m": "M", "k": "K"][unit.lowercased()] ?? unit.uppercased()
        if number.hasSuffix("%") { unit = "%"; number.removeLast() }
        // the sentence around it, trimmed to a label
        let sentence = text[..<r.lowerBound].split(separator: ".").last.map { String($0) } ?? ""
        var label = (sentence + " " + String(text[r.upperBound...].split(separator: ".").first ?? "")).trimmingCharacters(in: .whitespacesAndNewlines)
        if label.count > 70 { label = String(label.prefix(68)) + "…" }
        return HeroFact(number: number, unit: unit, label: label.isEmpty ? "The number" : label)
    }
}

/// D · Discharged.
struct DischargePage: View {
    @Environment(FeedState.self) private var feedState
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Color.clear.frame(height: 54).background(Pok.teal)
            Ticker(text: " System status: operational • diagnostic complete • prescribing cure ", bg: Pok.teal, fg: Pok.grey)
            VStack(alignment: .leading, spacing: 10) {
                PokLabelGrey(text: "Discharge")
                SerifLine(text: "Discharged. Nothing else is wrong with you today. *Sadly.*", size: 38, color: Pok.card)
                DoctorSays(line: "\(todays.count) prescriptions. Don't come back until *tomorrow*.", size: 19, color: Pok.card).padding(.top, 6)
            }
            .padding(.horizontal, 24).padding(.top, 14).padding(.bottom, 22).frame(maxWidth: .infinity, alignment: .leading).background(Pok.teal)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    PokLabel(text: "℞ // Your prescriptions")
                    ForEach(todays) { p in
                        HStack(alignment: .top, spacing: 12) {
                            Button { toggle(p) } label: { Square(fill: p.status == .done ? .solid(Pok.teal) : p.isCodeRed ? .solid(Pok.critical) : p.status == .todo ? .solid(Pok.yellow) : .pale, size: 14).padding(.top, 3) }.buttonStyle(.plain)
                            Text(p.text).font(Pok.mono(13)).foregroundStyle(p.status == .skipped ? Pok.grey : Pok.teal).strikethrough(p.status == .done).frame(maxWidth: .infinity, alignment: .leading)
                            PokLabelGrey(text: p.status == .skipped ? "skipped" : p.status == .done ? "done" : "today")
                        }
                        .padding(.vertical, 10)
                        DottedRule()
                    }
                    PokLabelGrey(text: "Vitals · this week").padding(.top, 18)
                    let week = feedState.prescriptions.filter { $0.createdAt > Date(timeIntervalSinceNow: -7 * 86400) && $0.status != .skipped }
                    let done = week.filter { $0.status == .done }.count
                    SquareMeter(count: max(week.count, 1), on: done).padding(.top, 6)
                    PokLabelGrey(text: "\(done) of \(week.count) prescriptions done · healthy condition \(week.isEmpty ? 0 : done * 100 / week.count)%").padding(.top, 6)
                }
                .padding(.horizontal, 24).padding(.vertical, 20).frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Pok.beige)
            VStack(spacing: 8) {
                ChartRow(key: "Watchlist", value: feedState.watchlist.isEmpty ? "no competitors watched yet — Settings → Watchlist" : "\(feedState.watchlist.count) competitors watched", valueColor: feedState.watchlist.isEmpty ? Pok.critical : Pok.teal)
                PokButton(text: "Close the chart", trailing: "↓") { onClose() }
            }
            .padding(.horizontal, 24).padding(.top, 16).padding(.bottom, 40).frame(maxWidth: .infinity).background(Pok.pink)
        }
    }

    private var todays: [Prescription] { feedState.prescriptions.filter { Calendar.current.isDateInToday($0.createdAt) } }
    private func toggle(_ p: Prescription) {
        guard let i = feedState.prescriptions.firstIndex(where: { $0.id == p.id }) else { return }
        feedState.prescriptions[i].status = feedState.prescriptions[i].status == .done ? .todo : .done
        Haptics.light()
    }
}
