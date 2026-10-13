import SwiftUI

/// A · Rounds — Dr HAOS on his stage; the three signals as plates that lean with the phone.
struct RoundsView: View {
    @Environment(FeedState.self) private var feedState
    @State private var showFlow = false
    @State private var startAt = 0
    @State private var showProduct = false
    private let tilt = MotionTilt.shared

    private var product: ProductProfile? { feedState.product }
    private var rounds: [NewsArticle] { feedState.rounds }
    private var redCount: Int { rounds.filter { feedState.codeRedName(for: $0) != nil }.count }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Haos.bg.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        HStack { Meta(text: "Dr HAOS · rounds · \(Self.dateLine)"); Spacer(); Meta(text: product == nil ? "no patient" : "\(feedState.articles.count) stories read") }
                            .padding(.horizontal, 24).padding(.top, 10)
                        HaosStage(height: 250, mood: feedState.isDischargedToday ? .discharged : .idle)
                            .frame(height: 250)
                            .padding(.top, 4)
                        Voice(text: openingLine, size: 24).padding(.horizontal, 24).padding(.top, 2)
                        if product == nil {
                            ActionButton(text: "Admit the patient — add your product", action: { showProduct = true }).padding(.horizontal, 24).padding(.top, 24)
                        } else {
                            HStack { Meta(text: "Today's signals"); Spacer(); Meta(text: "\(rounds.count) of \(feedState.articles.count) · ~90 s") }.padding(.horizontal, 24).padding(.top, 28)
                            ForEach(Array(rounds.enumerated()), id: \.element.id) { i, a in
                                SignalPlate(index: i + 1, headline: a.cloud?.headline ?? a.section?.headline ?? a.title, source: a.sourceName,
                                            codeRed: feedState.codeRedName(for: a) != nil, high: (a.cloud?.relevance ?? a.relevance ?? 0) >= 1, tilt: tilt) {
                                    startAt = i; showFlow = true
                                }
                                .padding(.horizontal, 20).padding(.top, 12)
                            }
                            if rounds.isEmpty {
                                Text(feedState.isRanking || feedState.isRefreshing ? "Reading…" : "Nothing moved in your market today.").font(Haos.text(17)).foregroundStyle(Haos.ink2).padding(.horizontal, 24).padding(.top, 16)
                            }
                        }
                        if product != nil && !rounds.isEmpty {
                            ActionButton(text: feedState.isDischargedToday ? "Rounds again" : "Start rounds\(redCount > 0 ? " — 01 is bleeding" : "")") { startAt = 0; showFlow = true }
                                .padding(.horizontal, 20).padding(.top, 20)
                        }
                        Color.clear.frame(height: 110)   // room for the tab bar
                    }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .fullScreenCover(isPresented: $showFlow) { RoundsFlow(articles: rounds, startAt: startAt) }
            .sheet(isPresented: $showProduct) { NavigationStack { ProductView() } }
            .onAppear {
                tilt.start()
                #if DEBUG
                if ProcessInfo.processInfo.arguments.contains("-flow") { DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { showFlow = true } }
                #endif
            }
            .onDisappear { tilt.stop() }
        }
        .preferredColorScheme(.dark)
    }

    private var openingLine: String {
        guard product != nil else { return "Give me your product's address. Until then, nothing here is about *you*." }
        if feedState.isDischargedToday { return "You're discharged for today. Come back tomorrow — I'll have read everything *again*." }
        if rounds.isEmpty { return feedState.isRanking || feedState.isRefreshing ? "Reading \(feedState.articles.count) stories. *Sit down.*" : "Nothing moved in your market. Enjoy it — it won't *last*." }
        let n = ["One thing", "Two things", "Three things"][min(rounds.count, 3) - 1]
        return "\(n) moved in your market.\(redCount > 0 ? " One is a *competitor*." : "") I read all \(feedState.articles.count) stories so you won't have to. *Sit down.*"
    }

    static var dateLine: String { let f = DateFormatter(); f.dateFormat = "EEE d MMM"; return f.string(from: Date()) }
}

/// A signal as a plate: beige material, a drop shadow that slides with the phone's tilt, the headline large.
struct SignalPlate: View {
    let index: Int
    let headline: String
    let source: String
    let codeRed: Bool
    let high: Bool
    let tilt: MotionTilt
    let action: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 10) {
                    Text(String(format: "%02d", index)).font(Haos.mono(12)).foregroundStyle(codeRed ? Haos.ink : Haos.bg.opacity(0.55))
                    Meta(text: source, color: codeRed ? Haos.ink.opacity(0.8) : Haos.bg.opacity(0.55))
                    Spacer()
                    Text(codeRed ? "CODE RED" : high ? "HIGH" : "MED").font(Haos.mono(10)).tracking(1)
                        .padding(.horizontal, 7).padding(.vertical, 4)
                        .background(codeRed ? Haos.ink : Haos.yellow).foregroundStyle(codeRed ? Haos.red : Haos.bg).clipShape(Capsule())
                }
                Text(headline).font(Haos.display(26)).foregroundStyle(codeRed ? Haos.ink : Haos.bg).lineSpacing(-1).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(codeRed ? Haos.red : Pok.beige)
            .clipShape(Notch(size: 6))
            .shadow(color: .black.opacity(0.35), radius: 14, x: reduceMotion ? 0 : CGFloat(-tilt.roll) * 2.5, y: 10 + (reduceMotion ? 0 : CGFloat(tilt.pitch) * 1.5))
            .rotation3DEffect(.degrees(reduceMotion ? 0 : tilt.pitch * 0.6), axis: (x: 1, y: 0, z: 0), perspective: 0.5)
            .rotation3DEffect(.degrees(reduceMotion ? 0 : -tilt.roll * 0.6), axis: (x: 0, y: 1, z: 0), perspective: 0.5)
        }
        .buttonStyle(.plain)
    }
}
