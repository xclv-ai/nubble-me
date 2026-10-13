import SwiftUI

/// C2 · Why? — the five levels of depth as an evidence sheet.
struct DepthSheet: View {
    let section: ContentSection
    let product: String
    @Environment(\.dismiss) private var dismiss
    @State private var depth = 3

    private let names = ["Summary", "Condensed", "Article", "Expanded", "For you"]

    var body: some View {
        VStack(spacing: 0) {
            Ticker(text: " [-] Why? • the full diagnosis • swipe down to close ", bg: Pok.beige, fg: Pok.grey)
            // the depth strip: notched tabs (scrolls — five don't fit one row)
            ScrollView(.horizontal, showsIndicators: false) { HStack(spacing: 6) {
                ForEach(0...section.maxDepth, id: \.self) { d in
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) { depth = d }
                    } label: {
                        Text("\(String(format: "%02d", d)) \(names[d])").font(Pok.mono(10, d == depth ? .bold : .regular)).tracking(0.6).textCase(.uppercase)
                            .padding(.horizontal, 8).padding(.vertical, 7)
                            .background(d == depth ? Pok.teal : Pok.card).foregroundStyle(d == depth ? Pok.yellow : Pok.teal)
                            .clipShape(Notch())
                    }
                    .buttonStyle(.plain)
                }
            }.padding(.horizontal, 16) }
            .padding(.vertical, 12).frame(maxWidth: .infinity, alignment: .leading).background(Pok.beige)
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack { PokLabel(text: "\(String(format: "%02d", depth)) // \(names[depth])"); Spacer(); PokLabelGrey(text: depth == 2 ? "the source text" : "\(blocks.count) blocks") }
                    content.padding(.top, 14)
                }
                .padding(.horizontal, 24).padding(.vertical, 18).frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Pok.beige)
            .gesture(DragGesture(minimumDistance: 30).onEnded { v in
                if abs(v.translation.width) > abs(v.translation.height) {
                    withAnimation(.easeInOut(duration: 0.2)) { depth = max(0, min(section.maxDepth, depth + (v.translation.width < 0 ? 1 : -1))) }
                }
            })
            PokButton(text: "Back to the prescription", trailing: "↓") { dismiss() }
                .padding(.horizontal, 24).padding(.top, 14).padding(.bottom, 28).background(Pok.yellow)
        }
        .background(Pok.beige)
        .preferredColorScheme(.light)
    }

    private var content: some View { DepthContent(section: section, depth: depth) }
    private var blocks: [Block] { Block.parse(section.text(at: depth)) }
}

/// One depth level in Dr HAOS's style: Geist leads, quiet support, his labels in pink; the Uncomfortable Truth marked.
struct DepthContent: View {
    let section: ContentSection
    let depth: Int
    var body: some View {
        switch depth {
        case 0, 1:
            Text(section.text(at: depth)).font(Haos.text(19)).foregroundStyle(Haos.ink).lineSpacing(5).fixedSize(horizontal: false, vertical: true)
        case 2:
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(section.standard.components(separatedBy: "\n\n").enumerated()), id: \.offset) { _, p in
                    Text(p).font(Haos.text(16)).foregroundStyle(Haos.ink2).lineSpacing(5)
                }
            }
        default:
            VStack(alignment: .leading, spacing: 22) {
                ForEach(blocks) { b in
                    let hot = b.label.localizedCaseInsensitiveContains("uncomfortable")
                    VStack(alignment: .leading, spacing: 6) {
                        Meta(text: b.label, color: hot ? Haos.pink : Haos.ink3)
                        if !b.lead.isEmpty { Text(b.lead).font(Haos.display(22)).foregroundStyle(hot ? Haos.pink : Haos.ink).lineSpacing(-1).fixedSize(horizontal: false, vertical: true) }
                        if b.bullets.isEmpty {
                            if !b.text.isEmpty { Text(b.text).font(Haos.text(16)).foregroundStyle(Haos.ink2).lineSpacing(4).fixedSize(horizontal: false, vertical: true) }
                        } else {
                            ForEach(Array(b.bullets.enumerated()), id: \.offset) { _, line in
                                HStack(alignment: .top, spacing: 10) { Text("→").font(Haos.medium(16)).foregroundStyle(Haos.yellow); Text(line).font(Haos.text(17)).foregroundStyle(Haos.ink) }
                            }
                        }
                    }
                    .padding(.leading, hot ? 14 : 0)
                    .overlay(alignment: .leading) { if hot { Rectangle().fill(Haos.pink).frame(width: 3) } }
                }
            }
        }
    }
    private var blocks: [Block] { Block.parse(section.text(at: depth)) }
    typealias Block = DepthSheet.Block
}

extension DepthSheet {
    struct Block: Identifiable {
        let id = UUID()
        let label: String
        let lead: String
        let text: String
        let bullets: [String]

        /// `**LABEL**` then `**lead.** support` or `- bullet` lines; a text without labels is one block.
        static func parse(_ text: String) -> [Block] {
            var out: [Block] = []
            let pattern = #"\*\*([A-Z][A-Z'’ ,.\-/]+)\*\*\s*\n?([\s\S]*?)(?=\n\s*\*\*[A-Z][A-Z'’ ,.\-/]+\*\*|\z)"#
            guard let re = try? NSRegularExpression(pattern: pattern) else { return [Block(label: "", lead: "", text: text, bullets: [])] }
            let ns = text as NSString
            for m in re.matches(in: text, range: NSRange(location: 0, length: ns.length)) {
                let label = ns.substring(with: m.range(at: 1)).trimmingCharacters(in: .whitespaces)
                let body = ns.substring(with: m.range(at: 2)).trimmingCharacters(in: .whitespacesAndNewlines)
                let lines = body.components(separatedBy: "\n").map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
                let bullets = lines.filter { $0.hasPrefix("- ") || $0.hasPrefix("• ") || $0.range(of: #"^\d+[.)]\s"#, options: .regularExpression) != nil }
                    .map { $0.replacingOccurrences(of: #"^(\d+[.)]|[-•])\s*"#, with: "", options: .regularExpression).replacingOccurrences(of: "**", with: "") }
                if !bullets.isEmpty { out.append(Block(label: label, lead: "", text: "", bullets: bullets)); continue }
                var lead = "", rest = body
                if body.hasPrefix("**"), let end = body.dropFirst(2).range(of: "**") {
                    lead = String(body.dropFirst(2)[..<end.lowerBound]); rest = String(body[end.upperBound...])
                }
                var support = rest.replacingOccurrences(of: "**", with: "").trimmingCharacters(in: .whitespacesAndNewlines)
                // the model often repeats the lead as the first support sentence — say it once
                let leadKey = lead.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: ". "))
                if !leadKey.isEmpty, support.lowercased().hasPrefix(leadKey) {
                    support = String(support.dropFirst(leadKey.count)).trimmingCharacters(in: CharacterSet(charactersIn: ". ")).trimmingCharacters(in: .whitespaces)
                    if let f = support.first { support = f.uppercased() + support.dropFirst() }
                }
                var seen = Set<String>()
                support = support.components(separatedBy: ". ").filter { seen.insert($0.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: ". "))).inserted }.joined(separator: ". ")
                if let last = support.last, !".!?".contains(last) { support += "." }
                out.append(Block(label: label, lead: lead, text: support, bullets: []))
            }
            return out.isEmpty ? [Block(label: "", lead: "", text: text.replacingOccurrences(of: "**", with: ""), bullets: [])] : out
        }
    }
}
