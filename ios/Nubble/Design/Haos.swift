import SwiftUI

/// Dr HAOS's own style: his colours (from the mascot — teal body, pink face, yellow eyes, off-white nose),
/// one big headline against small text (the size contrast of the first prototype), Geist for the interface,
/// Instrument Serif italic only for what he says.
enum Haos {
    static let bg = Color(red: 0.039, green: 0.231, blue: 0.267)        // #0A3B44 — his body
    static let bg2 = Color(red: 0.024, green: 0.165, blue: 0.192)       // deeper teal for layered surfaces
    static let ink = Color(red: 0.992, green: 0.992, blue: 0.988)       // #FDFDFC — his nose
    static let ink2 = ink.opacity(0.72)
    static let ink3 = ink.opacity(0.46)
    static let line = ink.opacity(0.14)
    static let pink = Color(red: 1.0, green: 0.769, blue: 0.839)        // #FFC4D6 — his face: his voice, emphasis
    static let yellow = Color(red: 0.992, green: 1.0, blue: 0)          // #FDFF00 — his eyes: the action only
    static let red = Color(red: 1.0, green: 0.294, blue: 0.2)           // competitors only

    static func display(_ size: CGFloat) -> Font { .custom("Geist-SemiBold", size: size) }
    static func text(_ size: CGFloat) -> Font { .custom("Geist-Regular", size: size) }
    static func medium(_ size: CGFloat) -> Font { .custom("Geist-Medium", size: size) }
    static func mono(_ size: CGFloat) -> Font { .custom("JetBrainsMono-Medium", size: size) }
    static func voice(_ size: CGFloat) -> Font { .custom("InstrumentSerif-Italic", size: size) }
    static func voiceRoman(_ size: CGFloat) -> Font { .custom("InstrumentSerif-Regular", size: size) }
}

/// Small mono meta line, tracked, uppercase.
struct Meta: View {
    let text: String
    var color: Color = Haos.ink3
    var body: some View { Text(text.uppercased()).font(Haos.mono(11)).tracking(1.2).foregroundStyle(color) }
}

/// What he says: Instrument Serif italic in pink; *starred* words come back to roman for emphasis.
struct Voice: View {
    let text: String
    var size: CGFloat = 22
    var color: Color = Haos.pink
    var body: some View {
        Text(attributed).foregroundStyle(color).lineSpacing(size * 0.1).fixedSize(horizontal: false, vertical: true)
    }
    private var attributed: AttributedString {
        var out = AttributedString(); var roman = false
        for part in text.components(separatedBy: "*") { var a = AttributedString(part); a.font = roman ? Haos.voiceRoman(size) : Haos.voice(size); out += a; roman.toggle() }
        return out
    }
}

/// The one action: yellow, teal text. Everything else is quiet.
struct ActionButton: View {
    let text: String
    var trailing: String = "→"
    var quiet = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack { Text(text).font(Haos.medium(16)); Spacer(minLength: 8); Text(trailing).font(Haos.medium(16)) }
                .foregroundStyle(quiet ? Haos.ink : Haos.bg)
                .padding(.horizontal, 18).frame(height: 52).frame(maxWidth: .infinity)
                .background(quiet ? Haos.ink.opacity(0.1) : Haos.yellow)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

/// The depth strip: 00 Signal · 01 Condensed · 02 Article · 03 Expanded · 04 For you
struct DepthStrip: View {
    let max: Int
    @Binding var depth: Int
    let names = ["Signal", "Condensed", "Article", "Expanded", "For you"]
    let onChange: (Int) -> Void
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(0...max, id: \.self) { d in
                    Button { onChange(d) } label: {
                        Text("\(String(format: "%02d", d))  \(names[d])").font(Haos.mono(11)).tracking(0.6).textCase(.uppercase)
                            .padding(.horizontal, 10).padding(.vertical, 8)
                            .background(d == depth ? Haos.ink : Haos.ink.opacity(0.1)).foregroundStyle(d == depth ? Haos.bg : Haos.ink2)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 24)
        }
    }
}
