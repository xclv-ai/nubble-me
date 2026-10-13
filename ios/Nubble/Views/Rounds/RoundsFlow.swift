import SwiftUI

/// The rounds: up/down = the next signal, left/right = depth; then discharge.
struct RoundsFlow: View {
    @Environment(FeedState.self) private var feedState
    @Environment(\.dismiss) private var dismiss
    let articles: [NewsArticle]
    var startAt: Int = 0
    @State private var page = 0

    var body: some View {
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
            .ignoresSafeArea()
            .background(Haos.bg)
            .overlay(alignment: .top) { topBar.padding(.top, geo.safeAreaInsets.top + 6) }
        }
        .preferredColorScheme(.dark)
        .onChange(of: page) { _, p in if p == articles.count { feedState.dischargedOn = FeedState.today } }
        .onAppear {
            page = min(startAt, articles.count)
            #if DEBUG
            let args = ProcessInfo.processInfo.arguments
            if let i = args.firstIndex(of: "-page"), i + 1 < args.count, let n = Int(args[i + 1]) { page = min(n, articles.count) }
            #endif
        }
    }

    private func advance() { withAnimation(.easeInOut(duration: 0.3)) { page = min(page + 1, articles.count) } }

    /// Always visible: close, where you are, how many left. The way out is never more than one tap away.
    private var topBar: some View {
        HStack(spacing: 12) {
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 15, weight: .semibold)).foregroundStyle(Haos.ink)
                    .frame(width: 40, height: 40).background(Haos.ink.opacity(0.14)).clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close the rounds")
            HStack(spacing: 6) {
                ForEach(0...articles.count, id: \.self) { i in
                    Capsule().fill(i == page ? Haos.yellow : Haos.ink.opacity(i < page ? 0.6 : 0.22)).frame(width: i == page ? 22 : 8, height: 5)
                }
            }
            Spacer()
            Meta(text: page < articles.count ? "\(page + 1) of \(articles.count) · swipe up" : "discharge", color: Haos.ink2)
        }
        .padding(.horizontal, 20)
    }
}

/// One signal: the headline big, his line in pink, the depth strip, the evidence, the ℞.
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
    @State private var prescribed = false
    private let tilt = MotionTilt.shared

    private var article: NewsArticle? { feedState.articles.first { $0.id == articleId } }
    private var section: ContentSection? { article?.section }
    private var competitor: String? { article.flatMap { feedState.codeRedName(for: $0) } }
    private var isRed: Bool { competitor != nil }
    private var product: String { feedState.product?.name ?? "you" }

    var body: some View {
        VStack(spacing: 0) {
            Color.clear.frame(height: topInset + 48)
            if let section, let article, !writing {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack { Meta(text: "\(String(format: "%02d", index))/\(String(format: "%02d", total)) · \(article.sourceName)", color: isRed ? Haos.ink.opacity(0.8) : Haos.ink3); Spacer(); Meta(text: isRed ? "■ code red · \(competitor ?? "")" : Self.time(article.publishedAt), color: isRed ? Haos.ink : Haos.ink3) }
                            .padding(.horizontal, 24).padding(.top, 8)
                        Text(article.cloud?.headline ?? section.headline ?? section.title)
                            .font(Haos.display(42)).foregroundStyle(Haos.ink).lineSpacing(-2).fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 24).padding(.top, 14)
                        if let v = article.cloud?.verdict ?? section.verdict, !v.isEmpty {
                            HStack(alignment: .top, spacing: 12) {
                                Image("DrHaos").resizable().scaledToFit().frame(width: 40, height: 40).padding(.top, 2)
                                Voice(text: Self.short(v), size: 22, color: isRed ? Haos.ink : Haos.pink)
                            }
                            .padding(.horizontal, 24).padding(.top, 18)
                        }
                        DepthStrip(max: section.maxDepth, depth: $depth) { setDepth($0, of: section) }.padding(.top, 22)
                        Group {
                            if depth == 0 { evidence(section, article) } else { DepthContent(section: section, depth: depth) }
                        }
                        .padding(.horizontal, 24).padding(.top, 18)
                        .id(depth).transition(.opacity)
                        HStack(spacing: 10) {
                            Button { onNext() } label: {
                                HStack(spacing: 8) { Text(index < total ? "Next signal" : "Discharge"); Image(systemName: "arrow.down") }
                                    .font(Haos.medium(15)).foregroundStyle(Haos.ink).padding(.horizontal, 16).frame(height: 44)
                                    .background(Haos.ink.opacity(0.12)).clipShape(Capsule())
                            }
                            .buttonStyle(.plain)
                            Spacer()
                        }
                        .padding(.horizontal, 24).padding(.top, 26)
                        Color.clear.frame(height: 40)
                    }
                }
                .gesture(DragGesture(minimumDistance: 30).onEnded { v in
                    guard abs(v.translation.width) > abs(v.translation.height) * 1.5 else { return }
                    setDepth(depth + (v.translation.width < 0 ? 1 : -1), of: section)
                })
                rx(section, article)
            } else {
                writingView
            }
        }
        .background(isRed ? Haos.red : Haos.bg)
        .task {
            #if DEBUG
            let args = ProcessInfo.processInfo.arguments
            if index == 1, let i = args.firstIndex(of: "-depth"), i + 1 < args.count, let d = Int(args[i + 1]) { depth = d }
            if args.contains("-why"), index == 1 { depth = 3 }
            #endif
            await writeIfNeeded()
        }
    }

    private func setDepth(_ d: Int, of section: ContentSection) {
        let new = max(0, min(section.maxDepth, d))
        guard new != depth else { Haptics.warning(); return }
        withAnimation(.easeInOut(duration: 0.2)) { depth = new }
        Haptics.light()
    }

    // The evidence, quiet and small: what changed, the number if there is one, the receipt
    private func evidence(_ s: ContentSection, _ a: NewsArticle) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if let fact = HeroFact.find(in: s.summary + " " + s.condensed) {
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(fact.number).font(Haos.voiceRoman(72)).foregroundStyle(Haos.ink)
                    Text(fact.unit).font(Haos.voiceRoman(34)).foregroundStyle(Haos.ink2)
                }
                .minimumScaleFactor(0.6).lineLimit(1)
                Text(fact.label).font(Haos.text(15)).foregroundStyle(Haos.ink2)
            } else {
                Meta(text: "What changed")
                Text(s.summary).font(Haos.text(18)).foregroundStyle(Haos.ink2).lineSpacing(4).fixedSize(horizontal: false, vertical: true)
            }
            if isRed {
                VStack(alignment: .leading, spacing: 8) {
                    Meta(text: "Diagnosis", color: Haos.ink.opacity(0.7))
                    Text(Self.lead(of: s.forProduct, block: "WHAT IT MEANS") ?? s.condensed).font(Haos.text(17)).foregroundStyle(Haos.ink).lineSpacing(3)
                    HStack(spacing: 10) { Meta(text: "Threat", color: Haos.ink.opacity(0.7)); SquareMeter(count: 5, on: (a.relevance ?? 0) >= 1 ? 4 : 3, color: Haos.ink, size: 12) }
                }
                .padding(.top, 8)
            }
            Meta(text: "Receipt · \(a.sourceName) · \(Self.date(a.publishedAt)) ↗").padding(.top, 6)
        }
    }

    // The ℞ plate: yellow material, the prescription, prescribe / why
    private func rx(_ s: ContentSection, _ a: NewsArticle) -> some View {
        let line = a.cloud?.rx.isEmpty == false ? a.cloud!.rx : s.rx?.isEmpty == false ? s.rx! : (s.action?.isEmpty == false ? s.action! : "No prescription. Read the diagnosis and decide yourself.")
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("℞").font(Haos.voiceRoman(26)).foregroundStyle(Haos.bg)
                Text(line).font(Haos.medium(18)).foregroundStyle(Haos.bg).lineSpacing(1).fixedSize(horizontal: false, vertical: true)
            }
            HStack(spacing: 8) {
                Button {
                    feedState.prescribe(a, text: line); withAnimation(.spring(response: 0.35, dampingFraction: 0.6)) { prescribed = true }
                    Haptics.medium(); DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { onNext() }
                } label: {
                    HStack { Text(prescribed ? "Prescribed" : "Prescribe"); Spacer(); Text(prescribed ? "✓" : "→") }
                        .font(Haos.medium(16)).foregroundStyle(Haos.yellow).padding(.horizontal, 16).frame(height: 46).frame(maxWidth: .infinity)
                        .background(Haos.bg).clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
                Button {
                    if isRed { feedState.prescribe(a, text: line, status: .skipped); onNext() } else { setDepth(3, of: s) }
                } label: {
                    Text(isRed ? "Skip" : "Why?").font(Haos.medium(16)).foregroundStyle(Haos.bg).frame(width: 92, height: 46)
                        .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Haos.bg, lineWidth: 1.5))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 20).padding(.top, 14).padding(.bottom, 14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Haos.yellow)
        .clipShape(Notch(size: 6))
        .shadow(color: .black.opacity(0.35), radius: 16, x: CGFloat(-tilt.roll) * 2.5, y: -6 + CGFloat(tilt.pitch) * 1.5)
        .rotation3DEffect(.degrees(tilt.pitch * 0.5), axis: (x: 1, y: 0, z: 0), perspective: 0.5)
        .scaleEffect(prescribed ? 0.97 : 1)
        .padding(.horizontal, 12).padding(.bottom, 24)
    }

    private var writingView: some View {
        VStack(spacing: 18) {
            Spacer()
            HaosStage(height: 240, mood: .reading).frame(height: 240)
            Voice(text: writing ? "Reading it properly. *Thirty seconds.*" : (article?.errorMessage.map { "I couldn't read this one: \($0)" } ?? "Waiting for the article."), size: 24)
                .multilineTextAlignment(.center).padding(.horizontal, 32)
            Meta(text: pipeline.stage.rawValue)
            Spacer()
            ActionButton(text: "Skip for now", quiet: true) { onNext() }.padding(.horizontal, 20).padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
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

/// The number in the story, if it has one: "$9.86" + "B", with the sentence around it as the label.
struct HeroFact {
    let number: String
    let unit: String
    let label: String

    static func find(in text: String) -> HeroFact? {
        let pattern = #"([$€£]\s?\d[\d.,]*|\d[\d.,]*\s?%|\d[\d.,]*(?=\s?(billion|million|trillion|bn)\b))\s?(billion|million|trillion|bn|B|M)?"#
        guard let re = try? NSRegularExpression(pattern: pattern), let m = re.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)), let r = Range(m.range, in: text) else { return nil }
        var number = String(text[Range(m.range(at: 1), in: text)!]).replacingOccurrences(of: " ", with: "")
        var unit = m.range(at: 3).location != NSNotFound ? String(text[Range(m.range(at: 3), in: text)!]) : ""
        unit = ["billion": "B", "million": "M", "trillion": "T", "bn": "B", "m": "M", "k": "K"][unit.lowercased()] ?? unit.uppercased()
        if number.hasSuffix("%") { unit = "%"; number.removeLast() }
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
            Color.clear.frame(height: topInset + 48)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    Meta(text: "Discharge · \(RoundsView.dateLine)").padding(.horizontal, 24).padding(.top, 8)
                    Text("Discharged.").font(Haos.display(42)).foregroundStyle(Haos.ink).padding(.horizontal, 24).padding(.top, 14)
                    HaosStage(height: 220, mood: .discharged).frame(height: 220).padding(.top, 4)
                    Voice(text: "Nothing else is wrong with you today. *Sadly.* \(todays.filter { $0.status != .skipped }.count) prescriptions. Don't come back until *tomorrow*.", size: 24).padding(.horizontal, 24)
                    Meta(text: "℞ · your prescriptions").padding(.horizontal, 24).padding(.top, 28)
                    if todays.isEmpty {
                        Voice(text: "Nothing prescribed. You skipped everything — *brave*.", size: 20, color: Haos.ink2).padding(.horizontal, 24).padding(.top, 10)
                    }
                    ForEach(todays) { p in
                        HStack(alignment: .top, spacing: 12) {
                            Button { toggle(p) } label: { Square(fill: p.status == .done ? .solid(Haos.ink) : p.isCodeRed ? .solid(Haos.red) : p.status == .todo ? .solid(Haos.yellow) : .pale, size: 14).padding(.top, 4) }.buttonStyle(.plain)
                            Text(p.text).font(Haos.text(17)).foregroundStyle(p.status == .skipped ? Haos.ink3 : Haos.ink).strikethrough(p.status == .done).frame(maxWidth: .infinity, alignment: .leading)
                            Meta(text: p.status == .skipped ? "skipped" : p.status == .done ? "done" : "today")
                        }
                        .padding(.horizontal, 24).padding(.vertical, 12)
                        Rectangle().fill(Haos.line).frame(height: 1).padding(.horizontal, 24)
                    }
                    let week = feedState.prescriptions.filter { $0.createdAt > Date(timeIntervalSinceNow: -7 * 86400) && $0.status != .skipped }
                    let done = week.filter { $0.status == .done }.count
                    HStack(spacing: 12) { Meta(text: "Vitals · this week"); SquareMeter(count: max(week.count, 1), on: done, color: Haos.ink, size: 12); Meta(text: "\(done) of \(week.count) done") }
                        .padding(.horizontal, 24).padding(.top, 22)
                    Meta(text: feedState.watchlist.isEmpty ? "No competitors watched — Settings → Watchlist" : "\(feedState.watchlist.count) competitors watched", color: feedState.watchlist.isEmpty ? Haos.pink : Haos.ink3)
                        .padding(.horizontal, 24).padding(.top, 10)
                    Color.clear.frame(height: 110)
                }
            }
        }
        .background(Haos.bg)
        .overlay(alignment: .bottom) { ActionButton(text: "Close the chart", trailing: "↓", quiet: true) { onClose() }.padding(.horizontal, 20).padding(.bottom, 36) }
    }

    private var todays: [Prescription] { feedState.prescriptions.filter { Calendar.current.isDateInToday($0.createdAt) } }
    private func toggle(_ p: Prescription) {
        guard let i = feedState.prescriptions.firstIndex(where: { $0.id == p.id }) else { return }
        feedState.prescriptions[i].status = feedState.prescriptions[i].status == .done ? .todo : .done
        Haptics.light()
    }
}
