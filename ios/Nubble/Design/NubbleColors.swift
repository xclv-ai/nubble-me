import SwiftUI

enum NubbleColors {
    // HSL to SwiftUI Color helper
    // H: 0-360, S: 0-100, L: 0-100
    private static func hsl(_ h: Double, _ s: Double, _ l: Double) -> Color {
        Color(hue: h / 360, saturation: s / 100, brightness: hslToB(s: s, l: l))
    }

    // Convert HSL lightness to HSB brightness
    private static func hslToB(s: Double, l: Double) -> Double {
        let s = s / 100
        let l = l / 100
        let v = l + s * min(l, 1 - l)
        return v
    }

    // Proper HSL to RGB conversion
    private static func hslColor(_ h: Double, _ s: Double, _ l: Double) -> Color {
        let h = h / 360
        let s = s / 100
        let l = l / 100

        let c = (1 - abs(2 * l - 1)) * s
        let x = c * (1 - abs((h * 6).truncatingRemainder(dividingBy: 2) - 1))
        let m = l - c / 2

        var r: Double = 0, g: Double = 0, b: Double = 0
        let sector = Int(h * 6)
        switch sector {
        case 0: r = c; g = x; b = 0
        case 1: r = x; g = c; b = 0
        case 2: r = 0; g = c; b = x
        case 3: r = 0; g = x; b = c
        case 4: r = x; g = 0; b = c
        default: r = c; g = 0; b = x
        }

        return Color(red: r + m, green: g + m, blue: b + m)
    }

    // Light mode colors
    enum Light {
        static let background = hslColor(40, 20, 97)
        static let foreground = hslColor(30, 15, 12)
        static let primary = hslColor(32, 80, 45)
        static let card = hslColor(38, 18, 95)
        static let border = hslColor(35, 10, 88)
        static let muted = hslColor(30, 5, 45)
    }

    // Dark mode colors
    enum Dark {
        static let background = hslColor(30, 10, 8)
        static let foreground = hslColor(35, 10, 88)
        static let primary = hslColor(32, 75, 55)
        static let card = hslColor(30, 8, 11)
        static let border = hslColor(30, 5, 18)
        static let muted = hslColor(30, 5, 55)
    }

    // Adaptive colors using environment
    static func background(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Dark.background : Light.background
    }

    static func foreground(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Dark.foreground : Light.foreground
    }

    static func primary(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Dark.primary : Light.primary
    }

    static func card(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Dark.card : Light.card
    }

    static func border(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Dark.border : Light.border
    }

    static func muted(for scheme: ColorScheme) -> Color {
        scheme == .dark ? Dark.muted : Light.muted
    }
}
