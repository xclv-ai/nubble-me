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

    @ViewBuilder private var content: some View {
        switch depth {
        case 0, 1:
            SerifLine(text: section.text(at: depth), size: 26)
        case 2:
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(section.standard.components(separatedBy: "\n\n").enumerated()), id: \.offset) { _, p in
                    Text(p).font(Pok.mono(13, .light)).foregroundStyle(Pok.teal).lineSpacing(5)
                }
            }
        default:
            VStack(alignment: .leading, spacing: 18) {
                ForEach(blocks) { b in
                    let hot = b.label.localizedCaseInsensitiveContains("uncomfortable")
                    VStack(alignment: .leading, spacing: 6) {
                        PokLabelGrey(text: b.label, color: hot ? Pok.teal : Pok.grey)
                        if !b.lead.isEmpty { SerifLine(text: b.lead, size: 21) }
                        if b.bullets.isEmpty {
                            if !b.text.isEmpty { Text(b.text).font(Pok.mono(13, .light)).foregroundStyle(Pok.teal).lineSpacing(5) }
                        } else {
                            ForEach(Array(b.bullets.enumerated()), id: \.offset) { _, line in
                                HStack(alignment: .top, spacing: 8) { Text("→").font(Pok.mono(13, .bold)); Text(line).font(Pok.mono(13)) }.foregroundStyle(Pok.teal)
                            }
                        }
                    }
                    .padding(hot ? 14 : 0)
                    .background(hot ? Pok.pink : Color.clear)
                    .clipShape(Notch())
                }
            }
        }
    }

    private var blocks: [Block] { Block.parse(section.text(at: depth)) }

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
                out.append(Block(label: label, lead: lead, text: support, bullets: []))
            }
            return out.isEmpty ? [Block(label: "", lead: "", text: text.replacingOccurrences(of: "**", with: ""), bullets: [])] : out
        }
    }
}
