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
                font: .custom("Satoshi-Medium", size: 15.5, relativeTo: .body),
                opacity: 1.0,
                lineSpacing: 15.5 * 0.8
            )
        case 1:
            return DepthStyle(
                font: .custom("Satoshi-Regular", size: 14.5, relativeTo: .body),
                opacity: 0.85,
                lineSpacing: 14.5 * 0.75
            )
        case 2:
            return DepthStyle(
                font: .custom("Satoshi-Regular", size: 14, relativeTo: .body),
                opacity: 0.80,
                lineSpacing: 14 * 0.7
            )
        default:
            return DepthStyle(
                font: .custom("Satoshi-Regular", size: 13.5, relativeTo: .body),
                opacity: 0.75,
                lineSpacing: 13.5 * 0.65
            )
        }
    }

    // UI fonts (sans-serif)
    static let uiSmall: Font = .custom("Satoshi-Medium", size: 10, relativeTo: .caption2)
    static let uiCaption: Font = .custom("Satoshi-Regular", size: 11, relativeTo: .caption)
    static let uiBody: Font = .custom("Satoshi-Regular", size: 14, relativeTo: .body)
    static let uiHeadline: Font = .custom("Satoshi-Medium", size: 16, relativeTo: .headline)

    // Titles use Zodiak (serif)
    static let sectionTitle: Font = .custom("Zodiak-Regular", size: 18, relativeTo: .title3)
    static let documentTitle: Font = .custom("Zodiak-Regular", size: 21, relativeTo: .title2)
}
