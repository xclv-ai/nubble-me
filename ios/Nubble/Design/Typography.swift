import SwiftUI

enum Typography {
    struct DepthStyle {
        let font: Font
        let opacity: Double
        let lineSpacing: CGFloat
    }

    // Body text uses Satoshi (sans-serif) — NOT Zodiak
    static func style(for depth: Int) -> DepthStyle {
        switch depth {
        case 0:
            return DepthStyle(
                font: .custom("Satoshi-Medium", size: 20, relativeTo: .body),
                opacity: 1.0,
                lineSpacing: 20 * 0.4
            )
        case 1:
            return DepthStyle(
                font: .custom("Satoshi-Regular", size: 18.5, relativeTo: .body),
                opacity: 0.95,
                lineSpacing: 18.5 * 0.4
            )
        case 2:
            return DepthStyle(
                font: .custom("Satoshi-Regular", size: 17.5, relativeTo: .body),
                opacity: 0.92,
                lineSpacing: 17.5 * 0.4
            )
        default:
            return DepthStyle(
                font: .custom("Satoshi-Regular", size: 17, relativeTo: .body),
                opacity: 0.9,
                lineSpacing: 17 * 0.4
            )
        }
    }

    // UI fonts (sans-serif)
    static let uiSmall: Font = .custom("Satoshi-Medium", size: 10, relativeTo: .caption2)
    static let uiCaption: Font = .custom("Satoshi-Regular", size: 11, relativeTo: .caption)
    static let uiBody: Font = .custom("Satoshi-Regular", size: 14, relativeTo: .body)
    static let uiHeadline: Font = .custom("Satoshi-Medium", size: 16, relativeTo: .headline)

    // Titles use Zodiak (serif)
    static let sectionTitle: Font = .custom("Zodiak-Regular", size: 24, relativeTo: .title2)
    static let documentTitle: Font = .custom("Zodiak-Regular", size: 28, relativeTo: .title)
}
