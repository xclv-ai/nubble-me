import CoreMotion
import SwiftUI

/// Makes text "alive" in the hand: turning the iPhone gives the text a small 3D tilt that springs
/// back to flat. It follows the turn (rotation rate), not the holding angle, so a still phone
/// always shows flat, readable text.
@Observable
@MainActor
final class MotionTilt {
    static let shared = MotionTilt()

    /// Degrees around the horizontal and vertical axes.
    private(set) var pitch: Double = 0
    private(set) var roll: Double = 0

    private let manager = CMMotionManager()
    private var users = 0

    /// How strongly a turn tilts the text, the largest tilt, and how fast it settles (per 1/60 s).
    private let gain = 2.2
    private let maxTilt = 5.0
    private let settle = 0.86

    func start() {
        users += 1
        guard users == 1, manager.isDeviceMotionAvailable else { return }
        manager.deviceMotionUpdateInterval = 1.0 / 60.0
        manager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let self, let rate = motion?.rotationRate else { return }
            MainActor.assumeIsolated {
                // Impulse from the turn, then decay back to flat
                self.pitch = max(-self.maxTilt, min(self.maxTilt, self.pitch * self.settle + rate.x * self.gain))
                self.roll = max(-self.maxTilt, min(self.maxTilt, self.roll * self.settle + rate.y * self.gain))
            }
        }
    }

    func stop() {
        users = max(0, users - 1)
        guard users == 0 else { return }
        manager.stopDeviceMotionUpdates()
        pitch = 0
        roll = 0
    }
}

extension View {
    /// The small motion tilt, off when Reduce Motion is on.
    func motionTilt(_ tilt: MotionTilt, enabled: Bool) -> some View {
        self
            .rotation3DEffect(.degrees(enabled ? tilt.pitch : 0), axis: (x: 1, y: 0, z: 0), perspective: 0.35)
            .rotation3DEffect(.degrees(enabled ? -tilt.roll : 0), axis: (x: 0, y: 1, z: 0), perspective: 0.35)
    }
}
