import SwiftUI

/// A · Rounds — Dr HAOS read everything; the founder gets three.
struct RoundsView: View {
    @Environment(FeedState.self) private var feedState
    @State private var showFlow = false
    @State private var showProduct = false

    private var product: ProductProfile? { feedState.product }
    private var rounds: [NewsArticle] { feedState.rounds }
    private var redCount: Int { rounds.filter { feedState.codeRedName(for: $0) != nil }.count }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Ticker(text: " [+] Rounds \(Self.dateLine) • \(rounds.count) signals • \(redCount) code red • \(max(0, feedState.articles.count - rounds.count)) stories discharged as noise ")
                ScrollView {
                    VStack(spacing: 0) {
                        hero
                        ScanBand(text: "Scanning… \(feedState.articles.count) stories")
                        evidence
                    }
                }
                .background(Pok.beige)
                footer
            }
            .background(Pok.teal)
            .toolbar(.hidden, for: .navigationBar)
            .fullScreenCover(isPresented: $showFlow) { RoundsFlow(articles: rounds) }
            .sheet(isPresented: $showProduct) { NavigationStack { ProductView() } }
        }
        .preferredColorScheme(.light)
    }

    // Teal: the doctor speaks first
    private var hero: some View {
        VStack(alignment: .leading, spacing: 8) {
            PokLabelGrey(text: "POKPOK.AI // DR HAOS · Brand perception agent")
            HStack(alignment: .bottom, spacing: 16) {
                Image("DrHaos").resizable().scaledToFit().frame(width: 104, height: 104)
                SerifLine(text: openingLine, size: 23, color: Pok.card)
            }
        }
        .padding(.horizontal, 24).padding(.top, 14).padding(.bottom, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Pok.teal)
    }

    private var openingLine: String {
        guard product != nil else { return "Give me your product's address and I'll read the news for you. Until then, nothing here is about *you*." }
        if feedState.isDischargedToday { return "You're discharged for today. Come back tomorrow — *I'll have read everything by then.*" }
        if rounds.isEmpty { return feedState.isRanking || feedState.isRefreshing ? "Reading \(feedState.articles.count) stories. *Sit down.*" : "Nothing moved in your market. Enjoy it — *it won't last.*" }
        let n = ["One thing", "Two things", "Three things"][min(rounds.count, 3) - 1]
        let red = redCount > 0 ? " One is a *competitor*." : ""
        return "\(n) moved in your market.\(red) I read all \(feedState.articles.count) stories so you won't have to. *Sit down.*"
    }

    // Beige: the patient chart, the noise, the scan
    private var evidence: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(spacing: 8) {
                ChartRow(key: "Patient", value: product?.name ?? "— not set")
                ChartRow(key: "Doctor", value: "DR HAOS")
                ChartRow(key: "Rounds", value: product == nil ? "waiting for the patient" : "\(rounds.count) signals · ~90 s · then you are discharged")
            }
            if product == nil {
                PokButton(text: "Admit the patient · add your product", action: { showProduct = true }).padding(.top, 20)
            } else {
                HStack { PokLabel(text: "00 // The noise"); Spacer(); PokLabelGrey(text: "\(feedState.articles.count) stories · \(rounds.count) matter") }.padding(.top, 18)
                let ids = Set(rounds.map(\.id)); let redIds = Set(rounds.filter { feedState.codeRedName(for: $0) != nil }.map(\.id))
                let lit = Set(feedState.articles.enumerated().filter { ids.contains($0.element.id) }.map(\.offset))
                let red = Set(feedState.articles.enumerated().filter { redIds.contains($0.element.id) }.map(\.offset))
                NoiseGrid(total: feedState.articles.count, lit: lit, red: red).padding(.top, 8)
                PokLabel(text: "01 // The scan").padding(.top, 18)
                ForEach(Array(rounds.enumerated()), id: \.element.id) { i, a in
                    ScanTag(index: i + 1, text: a.section?.headline ?? a.title, codeRed: feedState.codeRedName(for: a) != nil, high: (a.relevance ?? 0) >= 1)
                        .padding(.top, 8)
                }
            }
        }
        .padding(.horizontal, 24).padding(.top, 20).padding(.bottom, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // Yellow: the interrupt
    private var footer: some View {
        VStack(spacing: 10) {
            if product != nil && !rounds.isEmpty {
                PokButton(text: feedState.isDischargedToday ? "Rounds again" : "Start rounds\(redCount > 0 ? " · 01 is bleeding" : "")") { showFlow = true }
                HStack { Text("~90 s · then discharged"); Spacer(); Text(feedState.prescriptions.isEmpty ? "" : "\(feedState.prescriptions.filter { $0.status == .todo }.count) ℞ open") }
                    .font(Pok.mono(10)).tracking(0.8).textCase(.uppercase).foregroundStyle(Pok.teal)
            } else {
                Text(product == nil ? "No patient, no rounds." : "Dr HAOS is reading. The rounds open when three signals are in.").font(Pok.mono(11)).tracking(0.5).foregroundStyle(Pok.teal)
            }
        }
        .padding(.horizontal, 24).padding(.top, 14).padding(.bottom, 10)
        .frame(maxWidth: .infinity).background(Pok.yellow)
    }

    static var dateLine: String { let f = DateFormatter(); f.dateFormat = "dd-MM-yy"; return f.string(from: Date()) }
}

struct ScanTag: View {
    let index: Int
    let text: String
    let codeRed: Bool
    let high: Bool
    var body: some View {
        HStack(spacing: 12) {
            Text(String(format: "%02d", index)).font(Pok.serif(22)).frame(width: 30, alignment: .leading)
            Text(text).font(Pok.mono(13)).lineLimit(2).frame(maxWidth: .infinity, alignment: .leading)
            Text(codeRed ? "CODE RED" : high ? "HIGH" : "MED").font(Pok.mono(10, .bold)).tracking(0.8)
                .padding(.horizontal, 6).padding(.vertical, 3)
                .background(codeRed ? Pok.card : Pok.yellow).foregroundStyle(codeRed ? Pok.critical : Pok.teal)
        }
        .foregroundStyle(codeRed ? Pok.card : Pok.teal)
        .padding(.horizontal, 14).padding(.vertical, 12)
        .background(codeRed ? Pok.critical : Pok.card)
        .clipShape(Notch())
    }
}

extension NewsArticle {
    var section: ContentSection? { document?.sections.first }
}
