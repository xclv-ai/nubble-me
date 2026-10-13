import SwiftUI

/// POKPOK design system, as used by Dr HAOS's rounds.
/// Source: pokpok-ai/design-system/foundations (colour tokens, type scale, notch, motion: "the square is the asset").
enum Pok {
    // Colour — the rhythm: teal (authority) → beige (evidence) → pink (confrontation) → yellow (interrupt). Hard cuts, no gradients.
    static let yellow = Color(red: 0.961, green: 0.976, blue: 0)        // #F5F900
    static let beige = Color(red: 0.910, green: 0.878, blue: 0.820)     // #E8E0D1
    static let grey = Color(red: 0.557, green: 0.627, blue: 0.639)      // #8EA0A3
    static let teal = Color(red: 0.039, green: 0.231, blue: 0.267)      // #0A3B44
    static let pink = Color(red: 1.0, green: 0.769, blue: 0.839)        // #FFC4D6
    static let card = Color(red: 0.992, green: 0.992, blue: 0.988)      // #FDFDFC
    static let critical = Color(red: 0.906, green: 0, blue: 0.039)      // rgb(231,0,10) — competitors only
    static let notch: CGFloat = 4

    // Type — Instrument Serif = feeling (headlines, numbers, his lines); JetBrains Mono = proof (labels, evidence, lists).
    static func serif(_ size: CGFloat) -> Font { .custom("InstrumentSerif-Regular", size: size) }
    static func serifItalic(_ size: CGFloat) -> Font { .custom("InstrumentSerif-Italic", size: size) }
    static func mono(_ size: CGFloat, _ weight: MonoWeight = .regular) -> Font { .custom(weight.rawValue, size: size) }
    enum MonoWeight: String { case light = "JetBrainsMono-Light", regular = "JetBrainsMono-Regular", medium = "JetBrainsMono-Medium", bold = "JetBrainsMono-Bold" }
}

/// The 4×4 pt corner notch — POKPOK's atom. The corner shows the parent's colour.
struct Notch: Shape {
    var size: CGFloat = Pok.notch
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX + size, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX - size, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY + size))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - size))
        p.addLine(to: CGPoint(x: r.maxX - size, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + size, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX, y: r.maxY - size))
        p.addLine(to: CGPoint(x: r.minX, y: r.minY + size))
        p.closeSubpath()
        return p
    }
}

// MARK: - Text styles

struct PokLabel: View {           // `Label`: JBM 600 · 12/16 · 0.8px · uppercase
    let text: String
    var color: Color = Pok.teal
    var body: some View { Text(text.uppercased()).font(Pok.mono(12, .bold)).tracking(0.8).foregroundStyle(color) }
}

struct PokLabelGrey: View {       // `Label-Grey`: JBM 400 · 10/16 · 0.08em · uppercase
    let text: String
    var color: Color = Pok.grey
    var body: some View { Text(text.uppercased()).font(Pok.mono(10)).tracking(0.8).foregroundStyle(color) }
}

/// A line of Instrument Serif where *starred* words are italic — italic = significance, never decoration.
struct SerifLine: View {
    let text: String
    var size: CGFloat = 23
    var color: Color = Pok.teal
    var body: some View {
        Text(Self.attributed(text, size: size)).foregroundStyle(color).lineSpacing(size * 0.08)
    }
    static func attributed(_ text: String, size: CGFloat) -> AttributedString {
        var out = AttributedString()
        var italic = false
        for part in text.components(separatedBy: "*") {
            var a = AttributedString(part)
            a.font = italic ? Pok.serifItalic(size) : Pok.serif(size)
            out += a
            italic.toggle()
        }
        return out
    }
}

/// The ticker line: `[+] … • …` in mono. Static — nothing moves at rest.
struct Ticker: View {
    let text: String
    var bg: Color = Pok.pink
    var fg: Color = Pok.teal
    var body: some View {
        Text(text.uppercased()).font(Pok.mono(10)).tracking(0.6).lineLimit(1).truncationMode(.tail)
            .foregroundStyle(fg).padding(.horizontal, 16).frame(maxWidth: .infinity, alignment: .leading).frame(height: 22).background(bg)
    }
}

/// Patient-chart row: `KEY ……… value` with a dotted rule.
struct ChartRow: View {
    let key: String
    let value: String
    var valueColor: Color = Pok.teal
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            PokLabelGrey(text: key).frame(width: 92, alignment: .leading).padding(.top, 2)
            VStack(alignment: .leading, spacing: 4) {
                Text(value).font(Pok.mono(12)).foregroundStyle(valueColor).fixedSize(horizontal: false, vertical: true)
                DottedRule()
            }
        }
    }
}

struct DottedRule: View {
    var body: some View {
        Line().stroke(Pok.grey, style: StrokeStyle(lineWidth: 1, dash: [1, 2])).frame(height: 1)
    }
    struct Line: Shape { func path(in r: CGRect) -> Path { var p = Path(); p.move(to: CGPoint(x: r.minX, y: r.midY)); p.addLine(to: CGPoint(x: r.maxX, y: r.midY)); return p } }
}

// MARK: - The square is the asset

enum SquareFill { case solid(Color), pale, hatched }

struct Square: View {
    var fill: SquareFill = .solid(Pok.teal)
    var size: CGFloat = 14
    var body: some View {
        Group {
            switch fill {
            case .solid(let c): Rectangle().fill(c)
            case .pale: Rectangle().stroke(Pok.grey, lineWidth: 1)
            case .hatched: Rectangle().fill(Pok.teal).mask(Hatch())
            }
        }
        .frame(width: size, height: size)
    }
    struct Hatch: View { var body: some View { Canvas { ctx, size in var p = Path(); for x in stride(from: -size.height, through: size.width, by: 4) { p.move(to: CGPoint(x: x, y: size.height)); p.addLine(to: CGPoint(x: x + size.height, y: 0)) }; ctx.stroke(p, with: .color(.black), lineWidth: 1.6) } } }
}

/// `count` squares, the first `on` lit — a meter with no axis, no legend.
struct SquareMeter: View {
    let count: Int
    let on: Int
    var color: Color = Pok.teal
    var size: CGFloat = 14
    var body: some View {
        HStack(spacing: 3) { ForEach(0..<count, id: \.self) { i in Square(fill: i < on ? .solid(color) : .pale, size: size) } }
    }
}

/// The noise: one tiny square per story read, the signals lit.
struct NoiseGrid: View {
    let total: Int
    let lit: Set<Int>
    let red: Set<Int>
    var body: some View {
        // flexible() alone has a 10 pt minimum — 44 of them are wider than the screen and push the page off its left edge
        let cols = Array(repeating: GridItem(.flexible(minimum: 2, maximum: 24), spacing: 2), count: 44)
        LazyVGrid(columns: cols, spacing: 2) {
            ForEach(0..<max(total, 1), id: \.self) { i in
                Rectangle().fill(red.contains(i) ? Pok.critical : lit.contains(i) ? Pok.yellow : Pok.grey.opacity(0.35)).aspectRatio(1, contentMode: .fit)
                    .overlay(lit.contains(i) ? Rectangle().stroke(Pok.teal, lineWidth: 1) : nil)
            }
        }
    }
}

// MARK: - Buttons (teal on yellow / yellow on teal), notched

struct PokButton: View {
    let text: String
    var trailing: String = "→"
    var fill: Color = Pok.teal
    var fg: Color = Pok.yellow
    var outline = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack { Text(text.uppercased()).font(Pok.mono(13, .bold)).tracking(0.8); Spacer(minLength: 8); Text(trailing).font(Pok.mono(13, .bold)) }
                .foregroundStyle(outline ? Pok.teal : fg)
                .padding(.horizontal, 16).frame(height: 48).frame(maxWidth: .infinity)
                .background(outline ? Color.clear : fill)
                .overlay(outline ? Notch().stroke(Pok.teal, lineWidth: 1) : nil)
                .clipShape(Notch())
        }
        .buttonStyle(.plain)
    }
}

/// The ℞ block: yellow interrupt, the prescription in Instrument Serif.
struct RxBlock<Buttons: View>: View {
    let title: String
    let rx: String
    @ViewBuilder var buttons: Buttons
    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 14) {
                Text("℞").font(Pok.serif(44)).foregroundStyle(Pok.teal).frame(width: 44, alignment: .leading)
                VStack(alignment: .leading, spacing: 6) {
                    PokLabel(text: title)
                    SerifLine(text: rx, size: 22)
                }
            }
            buttons
        }
        .padding(.horizontal, 24).padding(.top, 16).padding(.bottom, 28)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Pok.yellow)
    }
}

// MARK: - The doctor

struct DoctorSays: View {
    let line: String
    var size: CGFloat = 19
    var color: Color = Pok.teal
    var mascot: CGFloat = 56
    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            Image("DrHaos").resizable().scaledToFit().frame(width: mascot, height: mascot)
            SerifLine(text: line, size: size, color: color)
        }
    }
}

/// Dither scanner band, in text — the retro-tech motif on yellow.
struct ScanBand: View {
    let text: String
    var body: some View {
        VStack(spacing: 0) {
            // the sawtooth edge, drawn — a run of ▲ is one unbreakable word and would widen the page
            Canvas { ctx, size in
                var p = Path(); let w: CGFloat = 6
                var x: CGFloat = 0
                while x < size.width { p.move(to: CGPoint(x: x, y: size.height)); p.addLine(to: CGPoint(x: x + w / 2, y: 0)); p.addLine(to: CGPoint(x: x + w, y: size.height)); p.closeSubpath(); x += w }
                ctx.fill(p, with: .color(Pok.teal))
            }
            .frame(height: 6)
            Text("║ . . : : ░ ▒ ▓ ▓ \(text.uppercased()) ▓ ▓ ▒ ░ : : . . ║").font(Pok.mono(11)).tracking(1).foregroundStyle(Pok.teal).lineLimit(1).truncationMode(.middle).padding(.vertical, 6).padding(.horizontal, 12)
        }
        .frame(maxWidth: .infinity).background(Pok.yellow)
    }
}
