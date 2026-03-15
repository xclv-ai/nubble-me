import SwiftUI

struct DepthIndicator: View {
    let depth: Int
    let size: IndicatorSize

    enum IndicatorSize {
        case sm, md

        var unit: CGFloat {
            switch self {
            case .sm: 5
            case .md: 8
            }
        }

        var cornerRadius: CGFloat {
            switch self {
            case .sm: 1.5
            case .md: 2.5
            }
        }
    }

    private var widths: [CGFloat] {
        let u = size.unit
        return [u, u * 2.2, u * 3.5, u * 5]
    }

    private var maxWidth: CGFloat { size.unit * 5 }

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let accent = NubbleColors.primary(for: colorScheme)
        ZStack {
            // Track
            RoundedRectangle(cornerRadius: size.cornerRadius)
                .fill(accent.opacity(0.12))
                .frame(width: maxWidth, height: size.unit)

            // Active fill
            RoundedRectangle(cornerRadius: size.cornerRadius)
                .fill(accent.opacity(0.85))
                .frame(width: widths[depth], height: size.unit)
                .animation(Springs.snappy, value: depth)
        }
        .frame(width: maxWidth, height: size.unit)
        .allowsHitTesting(false)
    }
}
