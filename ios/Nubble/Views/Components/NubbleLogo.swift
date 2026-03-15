import SwiftUI

struct NubbleLogo: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Canvas { context, size in
            let fg = colorScheme == .dark
                ? Color.white.opacity(0.9)
                : Color.black.opacity(0.9)
            let fgLight = colorScheme == .dark
                ? Color.white.opacity(0.3)
                : Color.black.opacity(0.3)
            let accent = NubbleColors.primary(for: colorScheme)

            // Back rect (transparent, 30% opacity)
            let backRect = RoundedRectangle(cornerRadius: 2.5)
                .path(in: CGRect(x: 3, y: 5, width: 12, height: 14))
            context.stroke(backRect, with: .color(fgLight), lineWidth: 1.3)

            // Front rect
            let frontRect = RoundedRectangle(cornerRadius: 2.5)
                .path(in: CGRect(x: 9, y: 5, width: 12, height: 14))
            context.stroke(frontRect, with: .color(fg), lineWidth: 1.3)

            // Center line (accent)
            var linePath = Path()
            linePath.move(to: CGPoint(x: 7, y: 12))
            linePath.addLine(to: CGPoint(x: 17, y: 12))
            context.stroke(
                linePath,
                with: .color(accent),
                style: StrokeStyle(lineWidth: 1.5, lineCap: .round)
            )
        }
        .frame(width: 22, height: 22)
        .accessibilityLabel("Nubble logo")
    }
}
