import UIKit

@MainActor
enum Haptics {
    /// Section depth change
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    /// Global depth change
    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    /// Boundary hit (min/max depth reached)
    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
}
