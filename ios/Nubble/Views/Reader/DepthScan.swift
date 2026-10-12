import SwiftUI

/// "Depth scan" — the transition between reading depths.
///
/// Deeper: the old text tilts back into the page and fades; the new text is revealed by a thin
/// glowing scan line sweeping down, each line sharpening out of blur as the beam passes it.
/// Shallower: the old text lifts toward the reader; the scan sweeps upward.
/// The final state is always plain, sharp text. Reduce Motion → a simple cross-fade.
struct DepthScanRenderer: TextRenderer, Animatable {
    /// 0 = nothing revealed, 1 = fully revealed
    var progress: Double
    /// +1 going deeper (scan sweeps down), -1 going shallower (scan sweeps up)
    var direction: Double
    var beamColor: Color

    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }

    /// How far below/above the beam a line takes to come fully into focus, in points.
    private let focusDistance: CGFloat = 48

    func draw(layout: Text.Layout, in ctx: inout GraphicsContext) {
        let lines = Array(layout)
        guard let first = lines.first, let last = lines.last else { return }
        let top = first.typographicBounds.rect.minY
        let bottom = last.typographicBounds.rect.maxY
        let height = max(1, bottom - top)
        let travel = height + focusDistance * 2
        // Beam position along the sweep
        let beam = direction > 0
            ? top - focusDistance + travel * progress
            : bottom + focusDistance - travel * progress

        for line in lines {
            let rect = line.typographicBounds.rect
            let distance = direction > 0 ? beam - rect.midY : rect.midY - beam
            let t = min(1, max(0, distance / focusDistance))      // 0 hidden → 1 in focus
            guard t > 0 else { continue }
            var lineCtx = ctx
            let eased = 1 - pow(1 - t, 3)
            lineCtx.opacity = eased
            if eased < 1 {
                // Grey while moving, white when settled; only a trace of blur
                lineCtx.addFilter(.colorMultiply(Color(white: 0.45 + 0.55 * eased)))
                lineCtx.addFilter(.blur(radius: (1 - eased) * 1.5))
                // Rises out of depth: slightly larger and offset toward the beam's origin
                let scale = 1 + (1 - eased) * 0.035
                lineCtx.translateBy(x: rect.minX, y: rect.midY + CGFloat(direction) * (1 - eased) * 6)
                lineCtx.scaleBy(x: scale, y: scale)
                lineCtx.translateBy(x: -rect.minX, y: -rect.midY)
            }
            lineCtx.draw(line)
        }

        // The scan line itself, fading out as the sweep completes
        let beamAlpha = progress < 0.85 ? 1 : max(0, (1 - progress) / 0.15)
        guard beamAlpha > 0, progress > 0 else { return }
        let width = layout.first.map { _ in lines.map { $0.typographicBounds.rect.maxX }.max() ?? 0 } ?? 0
        let beamRect = CGRect(x: -6, y: beam - 0.75, width: width + 12, height: 1.5)
        let gradient = Gradient(stops: [
            .init(color: beamColor.opacity(0), location: 0),
            .init(color: beamColor.opacity(0.9), location: 0.5),
            .init(color: beamColor.opacity(0), location: 1),
        ])
        var glow = ctx
        glow.opacity = beamAlpha * 0.55
        glow.addFilter(.blur(radius: 6))
        glow.fill(Path(beamRect.insetBy(dx: 0, dy: -3)), with: .linearGradient(gradient, startPoint: CGPoint(x: beamRect.minX, y: 0), endPoint: CGPoint(x: beamRect.maxX, y: 0)))
        var core = ctx
        core.opacity = beamAlpha
        core.fill(Path(beamRect), with: .linearGradient(gradient, startPoint: CGPoint(x: beamRect.minX, y: 0), endPoint: CGPoint(x: beamRect.maxX, y: 0)))
    }
}

/// Inserted text is scanned in; removed text tilts away in 3D.
struct DepthScanTransition: Transition {
    var direction: Double
    var beamColor: Color

    static let duration: Double = 0.55

    func body(content: Content, phase: TransitionPhase) -> some View {
        switch phase {
        case .willAppear, .identity:
            // Unfolds from the hinge at the top, like a foldable screen opening
            content
                .textRenderer(DepthScanRenderer(progress: phase.isIdentity ? 1 : 0, direction: direction, beamColor: beamColor))
                .rotation3DEffect(.degrees(phase.isIdentity ? 0 : -direction * 55), axis: (x: 1, y: 0, z: 0), anchor: .top, perspective: 0.5)
        case .didDisappear:
            // Folds away on the same hinge, dimming to grey
            content
                .rotation3DEffect(.degrees(direction * 70), axis: (x: 1, y: 0, z: 0), anchor: .top, perspective: 0.5)
                .brightness(-0.35)
                .opacity(0)
        }
    }
}

extension AnyTransition {
    static func depthScan(direction: Double, beamColor: Color, reduceMotion: Bool) -> AnyTransition {
        reduceMotion ? .opacity : AnyTransition(DepthScanTransition(direction: direction, beamColor: beamColor))
    }
}
