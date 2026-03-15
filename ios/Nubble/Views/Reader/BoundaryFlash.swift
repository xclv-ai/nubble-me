import SwiftUI

struct BoundaryFlash: View {
    let direction: BoundaryDirection?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        if let direction {
            let accent = NubbleColors.primary(for: colorScheme)
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [
                            direction == .min ? accent.opacity(0.08) : .clear,
                            direction == .max ? accent.opacity(0.08) : .clear,
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .allowsHitTesting(false)
                .transition(.opacity.animation(.easeOut(duration: 0.15)))
        }
    }
}
