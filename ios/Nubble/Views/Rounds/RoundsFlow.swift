import SwiftUI

/// The rounds: one signal per page, then discharge.
struct RoundsFlow: View {
    @Environment(FeedState.self) private var feedState
    @Environment(\.dismiss) private var dismiss
    let articles: [NewsArticle]
    @State private var page = 0

    var body: some View {
        // Nubble's two axes: up/down = the next signal, left/right = depth
        GeometryReader { geo in
            ScrollView(.vertical) {
                LazyVStack(spacing: 0) {
                    ForEach(Array(articles.enumerated()), id: \.element.id) { i, a in
                        SignalPage(articleId: a.id, index: i + 1, total: articles.count, topInset: geo.safeAreaInsets.top, onNext: { advance() })
                            .containerRelativeFrame([.horizontal, .vertical]).id(i)
                    }
                    DischargePage(topInset: geo.safeAreaInsets.top, onClose: { dismiss() }).containerRelativeFrame([.horizontal, .vertical]).id(articles.count)
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.paging)
            .scrollPosition(id: Binding(get: { page }, set: { if let p = $0 { page = p } }))
            .scrollIndicators(.hidden)
            .ignoresSafeArea()   // each page paints its own header colour behind the status bar (topInset)
        }
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
    var topInset: CGFloat = 0
    let onNext: () -> Void
    @State private var pipeline = NewsConversionPipeline()
    @State private var writing = false
    @State private var depth = 0
    private let depthNames = ["Signal", "Condensed", "Article", "Expanded", "For you"]

    private var article: NewsArticle? { feedState.articles.first { $0.id == articleId } }
    private var section: ContentSection? { article?.section }
    private var competitor: String? { article.flatMap { feedState.codeRedName(for: $0) } }
    private var isRed: Bool { competitor != nil }
    private var product: String { feedState.product?.name ?? "you" }

    var body: some View {
        VStack(spacing: 0) {
            (isRed ? Pok.critical : Pok.teal).frame(height: topInset)
            Ticker(text: isRed ? " [!] Code red • competitor on your patient list • \(competitor ?? "") " : " [+] \(String(format: "%02d", index)) // \(String(format: "%02d", total)) • \(article?.sourceName ?? "") • \(Self.time(article?.publishedAt)) ",
                   bg: isRed ? Pok.critical : Pok.teal, fg: isRed ? Pok.card : Pok.grey)
            if let section, let article, !writing {
                ScrollView {
                    VStack(spacing: 0) {
                        truth(section)
                        depthStrip(section)
                        if depth == 0 { evidence(section, article) } else {
                            DepthContent(section: section, depth: depth).padding(.horizontal, 24).padding(.vertical, 20)
                                .frame(maxWidth: .infinity, alignment: .leading).background(Pok.beige)
                                .id(depth).transition(.opacity)
                        }
                    }
                }
                .background(Pok.beige)
                .gesture(DragGesture(minimumDistance: 30).onEnded { v in
                    guard abs(v.translation.width) > abs(v.translation.height) * 1.5 else { return }
                    setDepth(depth + (v.translation.width < 0 ? 1 : -1), of: section)
                })
                rx(section, article)
            } else {
                writingView
            }
        }
        .background(Pok.yellow)
        .task {
            #if DEBUG
            let args = ProcessInfo.processInfo.arguments
            if index == 1, let i = args.firstIndex(of: "-depth"), i + 1 < args.count, let d = Int(args[i + 1]) { depth = d }
            if args.contains("-why"), index == 1 { depth = 3 }
            #endif
            await writeIfNeeded()
        }
    }

    // Pink (code red) or teal: the headline in Instrument Serif, then his line
    private func truth(_ s: ContentSection) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            PokLabelGrey(text: "\(String(format: "%02d", index)) // \(String(format: "%02d", total)) · \(isRed ? "Uncomfortable truth" : "Diagnosis")", color: isRed ? Pok.teal.opacity(0.6) : Pok.grey)
            SerifLine(text: s.headline ?? s.title, size: 38, color: isRed ? Pok.teal : Pok.card)
            if let v = s.verdict, !v.isEmpty, isRed { DoctorSays(line: Self.short(v), size: 19, color: Pok.teal).padding(.top, 6) }
        }
        .padding(.horizontal, 24).padding(.top, 14).padding(.bottom, 22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(isRed ? Pok.pink : Pok.teal)
    }

    private func setDepth(_ d: Int, of section: ContentSection) {
        let new = max(0, min(section.maxDepth, d))
        guard new != depth else { Haptics.warning(); return }
        withAnimation(.easeInOut(duration: 0.2)) { depth = new }
        Haptics.light()
    }

    /// The depth strip: 00 Signal · 01 Condensed · 02 Article · 03 Expanded · 04 For you — swipe left/right or tap
    private func depthStrip(_ section: ContentSection) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(0...section.maxDepth, id: \.self) { d in
                    Button { setDepth(d, of: section) } label: {
                        Text("\(String(format: "%02d", d)) \(depthNames[d])").font(Pok.mono(10, d == depth ? .bold : .regular)).tracking(0.6).textCase(.uppercase)
                            .padding(.horizontal, 8).padding(.vertical, 7)
                            .background(d == depth ? Pok.teal : Pok.card).foregroundStyle(d == depth ? Pok.yellow : Pok.teal)
                            .clipShape(Notch())
                    }
                    .buttonStyle(.plain)
                }
                PokLabelGrey(text: "← swipe for depth →").padding(.leading, 6)
            }
            .padding(.horizontal, 24)
        }
        .padding(.top, 14).background(Pok.beige)
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
            } else if let fact = HeroFact.find(in: s.summary + " " + s.condensed) {
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
            if !isRed, let v = s.verdict, !v.isEmpty { DoctorSays(line: Self.short(v), size: 19).padding(.top, 18) }
        }
        .padding(.horizontal, 24).padding(.top, 20).padding(.bottom, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // Yellow: the prescription
    private func rx(_ s: ContentSection, _ a: NewsArticle) -> some View {
        let line = s.rx?.isEmpty == false ? s.rx! : (s.action?.isEmpty == false ? s.action! : "No prescription. Read the diagnosis and decide yourself.")
        return RxBlock(title: isRed ? "Counter-move · today" : "Do this now", rx: line) {
            HStack(spacing: 8) {
                PokButton(text: "Prescribe → my list") { feedState.prescribe(a, text: line); onNext() }
                PokButton(text: isRed ? "Skip" : "Why?", trailing: "", outline: true) {
                    if isRed { feedState.prescribe(a, text: line, status: .skipped); onNext() } else { setDepth(3, of: s) }
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
        guard let article, article.document == nil || article.document?.productStamp != feedState.product?.updatedAt || (article.document?.writerVersion ?? 0) < NewsDepthWriter.version, !writing else { return }
        writing = true; defer { writing = false }
        if let doc = article.document, let product = feedState.product {
            _ = await pipeline.refreshProductLevel(article: article, document: doc, feedState: feedState, product: product)
        } else {
            _ = try? await pipeline.convert(article: article, feedState: feedState, product: feedState.product)
        }
    }

    /// At most two sentences and 26 words — the model does not keep to the limit, the screen does.
    static func short(_ text: String) -> String {
        var out: [String] = []; var words = 0
        for sentence in text.replacingOccurrences(of: "\n", with: " ").components(separatedBy: ". ") {
            let w = sentence.split(separator: " ").count
            if out.count == 2 || words + w > 26 && !out.isEmpty { break }
            out.append(sentence.trimmingCharacters(in: .whitespaces)); words += w
        }
        var s = out.joined(separator: ". ")
        if !s.hasSuffix(".") && !s.hasSuffix("?") && !s.hasSuffix("!") { s += "." }
        return s
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
        // money, a percentage, or a number with a magnitude word — a bare year is not a fact worth a hero
        let pattern = #"([$€£]\s?\d[\d.,]*|\d[\d.,]*\s?%|\d[\d.,]*(?=\s?(billion|million|trillion|bn)\b))\s?(billion|million|trillion|bn|B|M)?"#
        guard let re = try? NSRegularExpression(pattern: pattern), let m = re.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)), let r = Range(m.range, in: text) else { return nil }
        var number = String(text[Range(m.range(at: 1), in: text)!]).replacingOccurrences(of: " ", with: "")
        var unit = m.range(at: 3).location != NSNotFound ? String(text[Range(m.range(at: 3), in: text)!]) : ""
        unit = ["billion": "B", "million": "M", "trillion": "T", "bn": "B", "m": "M", "k": "K"][unit.lowercased()] ?? unit.uppercased()
        if number.hasSuffix("%") { unit = "%"; number.removeLast() }
        // the sentence that holds the number, whole, as the label
        let before = text[..<r.lowerBound].split(separator: ".", omittingEmptySubsequences: false).last.map { String($0) } ?? ""
        let after = text[r.upperBound...].split(separator: ".", omittingEmptySubsequences: false).first.map { String($0) } ?? ""
        var label = (before + String(text[r]) + after).replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        if label.count > 90 { label = String(label.prefix(88)) + "…" }
        return HeroFact(number: number, unit: unit, label: label.isEmpty ? "The number" : label)
    }
}

/// D · Discharged.
struct DischargePage: View {
    @Environment(FeedState.self) private var feedState
    var topInset: CGFloat = 0
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Pok.teal.frame(height: topInset)
            Ticker(text: " System status: operational • diagnostic complete • prescribing cure ", bg: Pok.teal, fg: Pok.grey)
            VStack(alignment: .leading, spacing: 10) {
                PokLabelGrey(text: "Discharge")
                SerifLine(text: "Discharged. Nothing else is wrong with you today. *Sadly.*", size: 34, color: Pok.card)
                DoctorSays(line: "\(todays.count) prescriptions. Don't come back until *tomorrow*.", size: 19, color: Pok.card).padding(.top, 6)
            }
            .padding(.horizontal, 24).padding(.top, 14).padding(.bottom, 22).frame(maxWidth: .infinity, alignment: .leading).background(Pok.teal)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    PokLabel(text: "Rx // Your prescriptions")
                    if todays.isEmpty {
                        SerifLine(text: "Nothing prescribed. You skipped everything — *brave.*", size: 20).padding(.vertical, 12)
                        DottedRule()
                    }
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
            .padding(.horizontal, 24).padding(.top, 16).padding(.bottom, 12).frame(maxWidth: .infinity).background(Pok.pink)
        }
        .background(Pok.pink)
    }

    private var todays: [Prescription] { feedState.prescriptions.filter { Calendar.current.isDateInToday($0.createdAt) } }
    private func toggle(_ p: Prescription) {
        guard let i = feedState.prescriptions.firstIndex(where: { $0.id == p.id }) else { return }
        feedState.prescriptions[i].status = feedState.prescriptions[i].status == .done ? .todo : .done
        Haptics.light()
    }
}
