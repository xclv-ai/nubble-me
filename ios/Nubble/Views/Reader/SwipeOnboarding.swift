import SwiftUI

struct SwipeOnboarding: View {
    @State private var handOffset: CGFloat = 0

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "hand.point.up")
                .font(.title2)
                .offset(x: handOffset)
                .onAppear {
                    withAnimation(
                        .easeInOut(duration: 2.5)
                        .repeatForever(autoreverses: false)
                    ) {
                        // We'll use a timer-based approach for the complex keyframe
                    }
                    startOscillation()
                }

            Text("swipe to change depth")
                .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                .tracking(0.5)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial, in: Capsule())
        .transition(.scale(scale: 0.8).combined(with: .opacity))
    }

    private func startOscillation() {
        // Oscillate: 0 → 14 → 0 → -14 → 0 over 2.5s
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(1.2))
            while !Task.isCancelled {
                withAnimation(.easeInOut(duration: 0.625)) { handOffset = 14 }
                try? await Task.sleep(for: .milliseconds(625))
                withAnimation(.easeInOut(duration: 0.625)) { handOffset = 0 }
                try? await Task.sleep(for: .milliseconds(625))
                withAnimation(.easeInOut(duration: 0.625)) { handOffset = -14 }
                try? await Task.sleep(for: .milliseconds(625))
                withAnimation(.easeInOut(duration: 0.625)) { handOffset = 0 }
                try? await Task.sleep(for: .milliseconds(625))
            }
        }
    }
}
