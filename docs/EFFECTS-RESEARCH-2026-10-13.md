# Depth transition and motion effects for the Nubble reader: research (2026-10-13)

Scope: a strong, futuristic and still readable 3D transition when a section's text goes from one depth to a deeper one (1-sentence summary → 4-paragraph analysis), in the spirit of the foldable iPhone folding and unfolding, plus text that feels "alive" with the gyroscope and settles flat fast.
Read-only research. No app code was changed.

Sources used (all read in this session):
- Apple sample "Creating visual effects with SwiftUI" (downloaded zip: `TextTransition.swift`, `Ripple.metal/.swift`, `Stripes.metal`, `CustomTransition.swift`, `ScrollTransitions.swift`, `VisualEffects.swift`).
- WWDC24 10151 "Create custom visual effects with SwiftUI" (full transcript + code tab).
- WWDC26 322 "Compose advanced graphics effects with SwiftUI" (June 2026: layer shaders, noise-texture domain warp, TimelineView time, and "the inputs could have been gyroscope data").
- The SDK that ships with this Xcode: **Xcode 27.0 (27A266a), iPhoneOS SDK 27.0**. Every API signature below was checked against `SwiftUICore.swiftinterface`/`SwiftUI.swiftinterface` in that SDK. Deployment target in `ios/project.yml` is iOS 26.0; every API used here is iOS 17/18+.
- Xcode bundled docs `SwiftUI-Implementing-Liquid-Glass-Design.md` (glassEffect, GlassEffectContainer, glassEffectID morphing) and `SwiftUI-Styled-Text-Editing.md` (AttributedString/TextEditor; not relevant to the transition beyond AttributedString runs).
- Inferno (twostraws/Inferno): source of `Shimmer.metal`, `Crosswarp.metal`, `Transitions.swift`, `Genie.metal`, plus its README list (Variable Blur, Water, Wave, Light Grid...).
- bpisano/Sticker (holographic foil SwiftUI package) and Apple's "Optimizing iPhone and iPad apps to support ProMotion displays".

---

## 0. TL;DR

1. **Why the current effect reads as weak**: one big slab rotates on one hinge with flat lighting, the scan line is 1.5 pt, and nothing in the image shows *depth* (no shading change across the surface, no light moving, no parallax). The eye reads it as a "fade with a tilt". Two problems are not visual at all (section 1): the app is **capped at 60 Hz** (no `CADisableMinimumFrameDurationOnPhone`), and the tilt **re-runs `SectionView.body` 60×/s, including markdown parsing**.
2. **Biggest discovery in the SDK**: inside a `TextRenderer`, `GraphicsContext.Filter.projectionTransform(_:)` exists, so **each line, word or glyph can get a real 3D perspective rotation**. `GraphicsContext.Filter.colorShader / distortionShader / layerShader` also exist, so a Metal shader can run **per line inside the renderer**. Apple's own sample only uses 2D translate + blur. This is what makes a premium per-line or per-glyph flip possible without dropping to UIKit.
3. **Two concepts I recommend** (full sketches in sections 6 and 7):
   - **A. "Accordion unfold"** (foldable-phone metaphor): the 4-paragraph analysis arrives **folded like a map, one panel per paragraph, creases in the paragraph gaps**. It unfolds panel by panel in ~560 ms. Each panel catches the light as it passes the light angle, so a specular glint runs down the stack. The light angle comes from the gyroscope. There is crease shadow and a small chromatic fringe on steep panels. One Metal `layerEffect`, turned off at rest, so the text at rest is native, crisp text.
   - **B. "Line flip cascade"**: a `TextRenderer` where each line flips up from edge-on (90°) to flat with a real perspective projection and a spring. A light band sweeps across each line as it lands (a Metal `colorShader` per line). Lines arrive staggered across paragraphs. At rest the renderer draws lines natively.
   - Combine them: A for summary → analysis (a big change in size), B for the shorter moves (summary ↔ product level, or the old text leaving).
4. **Gyroscope**: move the life **into the light, not into the text**. Keep text flat (rotating text by 3–5° resamples glyphs and softens them). Drive a specular highlight and a 4–8 pt background parallax from the **gravity vector, high-pass filtered** (reference follows the current pose in ~0.4 s), so a phone held still always settles to the neutral look. Read the motion only in a small leaf modifier.

---

## 1. Diagnosis of the current code (`ios/Nubble/Views/Reader/DepthScan.swift`, `MotionTilt.swift`, `SectionView.swift`)

| # | Finding | Effect | Fix |
|---|---|---|---|
| 1 | `project.yml` has no `CADisableMinimumFrameDurationOnPhone`. | On iPhone (13 Pro and later), apps must opt in to animate above 60 Hz. The iPhone 15 Pro shows the transition at 60 Hz. Apple: `<key>CADisableMinimumFrameDurationOnPhone</key><true/>`. | Add it under `info.properties` in `project.yml`. Check the result with the Instruments "Animation Hitches"/frame-rate track: community reports say some SwiftUI paths still cap, while `TimelineView(.animation)` and `CADisplayLink` honour it. |
| 2 | `.motionTilt(tilt, enabled:)` reads `tilt.pitch/roll` (an `@Observable`) **inside `SectionView.body`**. | Every motion sample (60 Hz) invalidates `SectionView.body`. That re-runs `Self.styled(paragraph)` (`AttributedString(markdown:)`) for every paragraph, rebuilds the text views and re-lays them out. This costs battery and frame time for no visual gain. | Move the read into its own `ViewModifier` struct (section 4.3). Only that modifier's body then invalidates. |
| 3 | Tilt uses `rotationRate` × gain with decay 0.86 per 1/60 s (time constant ≈ 110 ms) and a ±5° clamp. | The impulse is gone before the eye notices it. Rotating the whole text block also resamples glyphs (softness while tilted). | Gravity high-pass → light position plus parallax, with text kept flat (section 4). |
| 4 | The old text folds as **one slab** on the **top edge** with `brightness(-0.35)`. | There is no shading *gradient* across the surface and no specular, so it reads as a 2D squash. Folding phones look 3D because the two halves are lit differently and a highlight runs along the crease. | Shading per panel from the panel's normal, plus crease shadow and specular (concept A). |
| 5 | The scan beam is 1.5 pt with a 6 pt glow, and lines only fade, colour-multiply and scale by 3.5%. | Too subtle at arm's length, and the per-line motion has no depth axis. | Per-line 3D flip (concept B), or replace the beam with a light band that only exists on the glyphs. |
| 6 | Transition progress runs on `.easeInOut(0.55)` on `depth`, and the renderer reads that eased value. | Easing is applied twice and per-line timing can't use springs. | WWDC24 pattern: force **linear** time in the transition (`transaction.animation = .linear(duration:)`), then apply a spring per element with `Spring.value(...time:)`. |
| 7 | Good parts to keep: `Transition` with the same modifiers in every phase, the Reduce Motion fallback, `.id(depth)` for a new view per depth, and paragraphs already split by `\n\n`, which is exactly what concept A needs for its crease positions. | | |

---

## 2. Apple's official toolkit: exact APIs (checked in iOS SDK 27.0)

### 2.1 TextRenderer (iOS 18+)
```swift
public protocol TextRenderer : Animatable {
  func draw(layout: Text.Layout, in ctx: inout GraphicsContext)
  func sizeThatFits(proposal: ProposedViewSize, text: TextProxy) -> CGSize   // default: text.sizeThatFits
  var displayPadding: EdgeInsets { get }                                      // default: EdgeInsets() — RAISE THIS for 3D overhang
}
// Hierarchy: Text.Layout (Collection of Line) → Line (Collection of Run) → Run (Collection of RunSlice = glyph/attachment)
// Each has .typographicBounds (.rect, .ascent, .descent…). Run and RunSlice support run[MyAttr.self] for TextAttribute.
// GraphicsContext: draw(_ line|run|slice, options: .disablesSubpixelQuantization)
```
- Apply with `.textRenderer(renderer)`. It covers **every `Text` in that subtree**: each paragraph `Text` gets its own `draw` call with its own layout.
- Pass per-range data with `struct EmphasisAttribute: TextAttribute {}` and `Text("…").customAttribute(EmphasisAttribute())`, then read `run[EmphasisAttribute.self]`. **Use this to tag each paragraph with its index** so the timing can be staggered across paragraphs (concept B).
- Helpers from the WWDC24 sample:
```swift
extension Text.Layout {
    var flattenedRuns: some RandomAccessCollection<Text.Layout.Run> { self.flatMap { $0 } }
    var flattenedRunSlices: some RandomAccessCollection<Text.Layout.RunSlice> { flattenedRuns.flatMap(\.self) }
}
```
- Per-element timing pattern (Apple's `AppearanceEffectRenderer`): one animatable `elapsedTime`, `elementDuration`, `totalDuration`, plus
```swift
func elementDelay(count: Int) -> TimeInterval {
    let count = TimeInterval(count)
    let remainingTime = totalDuration - count * elementDuration
    return max(remainingTime / (count + 1), (totalDuration - elementDuration) / count)
}
// per slice: translationY = spring.value(fromValue: -descent, toValue: 0, initialVelocity: 0, time: t)
// spring = .snappy(duration: elementDuration - 0.05, extraBounce: 0.4)
```
- Transition wiring that forces linear time (Apple):
```swift
struct TextTransition: Transition {
    static var properties: TransitionProperties { TransitionProperties(hasMotion: true) }
    func body(content: Content, phase: TransitionPhase) -> some View {
        let duration = 0.9
        let renderer = AppearanceEffectRenderer(elapsedTime: phase.isIdentity ? duration : 0, totalDuration: duration)
        content.transaction { t in
            if !t.disablesAnimations { t.animation = .linear(duration: duration) }
        } body: { view in view.textRenderer(renderer) }
    }
}
```

### 2.2 GraphicsContext filters you can use **inside** a TextRenderer (verified in the interface)
```swift
GraphicsContext.Filter.projectionTransform(_ matrix: ProjectionTransform)        // ← real 3D per line/glyph
GraphicsContext.Filter.colorShader(_ shader: Shader)                              // Metal per pixel of what you draw next
GraphicsContext.Filter.distortionShader(_ shader: Shader, maxSampleOffset: CGSize)
GraphicsContext.Filter.layerShader(_ shader: Shader, maxSampleOffset: CGSize)
GraphicsContext.Filter.shadow(color:radius:x:y:blendMode:options:)
.colorMultiply(_:) .brightness(_:) .colorMatrix(_:) .blur(radius:options:) .alphaThreshold(min:max:color:)
// ProjectionTransform(CATransform3D) — init(_ m: CATransform3D) exists.
```
Every filtered draw renders off-screen. Budget: per **line** (~25 lines for 4 paragraphs) is cheap on A17 Pro. Per **word** (~250) is borderline. Per **glyph** (~1,500) is too much for the long text, but fine for the 1-sentence summary (~100 glyphs).

### 2.3 Shaders (iOS 17+), from SwiftUI
```swift
// View modifiers (also as VisualEffect inside .visualEffect { content, proxy in … })
.colorEffect(_ shader: Shader, isEnabled: Bool = true)
.distortionEffect(_ shader: Shader, maxSampleOffset: CGSize, isEnabled: Bool = true)
.layerEffect(_ shader: Shader, maxSampleOffset: CGSize, isEnabled: Bool = true)
// Shader construction
ShaderLibrary.myFunction(.float(t), .float2(size), .float2(point), .float3(…), .float4(…),
                         .color(c), .colorArray([c]), .floatArray([Float]), .image(img), .data(d), .boundingRect)
ShaderLibrary.bundle(.module) / ShaderLibrary(url:) / ShaderLibrary(data:)
try await shader.compile(as: .layerEffect)   // iOS 18: precompile, avoids first-use hitch
shader.dithersColor = true                   // smoother gradients (glints on dark backgrounds)
```
Metal signatures (`#include <SwiftUI/SwiftUI.h>`):
```metal
[[ stitchable ]] half4  colorFn (float2 position, half4 color, /* args */);
[[ stitchable ]] float2 distortFn(float2 position, /* args */);            // returns source position
[[ stitchable ]] half4  layerFn (float2 position, SwiftUI::Layer layer, /* args */);  // layer.sample(p)
// .floatArray / .colorArray arrive as two params: (device const float *ptr, int count) / (device const half4 *ptr, int count)
// .image arrives as texture2d<half>; sample with constexpr sampler s(address::repeat, filter::linear)
```
Rules: sample only within `maxSampleOffset` of `position`. Layer samples are **premultiplied alpha**. Shaders keep no state, so time and progress must come from SwiftUI (WWDC26: `TimelineView(.animation)` or an animatable value). `isEnabled: false` means the shader is skipped and the view draws normally. **Use this at rest for crisp text.**

Apple's ripple (WWDC24), useful as a "touch to dive deeper" accent:
```metal
[[ stitchable ]] half4 Ripple(float2 position, SwiftUI::Layer layer, float2 origin, float time,
                              float amplitude, float frequency, float decay, float speed) {
    float distance = length(position - origin);
    float delay = distance / speed;
    time = max(0.0, time - delay);
    float rippleAmount = amplitude * sin(frequency * time) * exp(-decay * time);
    float2 n = normalize(position - origin);
    half4 color = layer.sample(position + rippleAmount * n);
    color.rgb += 0.3 * (rippleAmount / amplitude) * color.a;
    return color;
}
// SwiftUI: keyframeAnimator(initialValue: 0, trigger:) { view, t in view.modifier(RippleModifier(origin:, elapsedTime: t, duration: 3)) }
//          keyframes: { _ in MoveKeyframe(0); LinearKeyframe(3, duration: 3) }
//          .visualEffect { v, _ in v.layerEffect(shader, maxSampleOffset: CGSize(width: 12, height: 12), isEnabled: 0 < t && t < 3) }
```

### 2.4 Other relevant SwiftUI pieces
- `Transition` protocol (`body(content:phase:)`, `TransitionPhase.willAppear/.identity/.didDisappear`, `phase.value` −1…1), `TransitionProperties(hasMotion:)`.
- `.visualEffect { content, proxy in … }`: geometry-aware effects, no layout cost. `rotation3DEffect` is also a `VisualEffect` here (signature: `rotation3DEffect(_:axis:anchor:anchorZ:perspective:)`, so **`anchorZ` exists**: you can lift a hinge toward the reader).
- `.scrollTransition { content, phase in … }`: per-paragraph parallax as paragraphs scroll in. Cheap polish for the long analysis.
- Liquid Glass (`.glassEffect(.regular.tint(_).interactive(), in: .rect(cornerRadius:))`, `GlassEffectContainer`, `glassEffectID(_:in:)` morphing, `GlassEffectTransition`). It reacts to touch and the system's own lighting, **not** to app-driven light. Use it for the depth chip/control, not for body text (glass behind body copy lowers contrast).
- `MeshGradient(width:height:points:colors:)`: an animated background layer for the parallax plane.

---

## 3. Premium shader recipes for text (copy-ready)

All are `[[ stitchable ]]` and go in a `.metal` file in the app target (`ShaderLibrary.default`).

### 3.1 Specular light band, colour effect (glass/foil sweep), driven by tilt or by progress
Based on Inferno `shimmer`, simplified (no HSL; additive on premultiplied colour so transparent stays transparent):
```metal
// band: x = centre in points along the sweep axis, y = half-width in points; dir = unit sweep direction
[[ stitchable ]] half4 lightBand(float2 position, half4 color, float2 band, float2 dir, float strength, half4 tint) {
    float d = (dot(position, dir) - band.x) / band.y;
    half k = half(strength * exp(-d * d));            // gaussian band, no hard edges
    return half4(color.rgb + k * color.a * tint.rgb, color.a);
}
```
SwiftUI: `.colorEffect(ShaderLibrary.lightBand(.float2(c, 40), .float2(0.8, 0.6), .float(s), .color(.white)), isEnabled: s > 0.01)`. Light mode: invert to a darkening band (`color.rgb * (1 - k*0.35)`), because additive white on white text background reads as nothing.

### 3.2 Chromatic edge fringe (futuristic, only during motion)
```metal
[[ stitchable ]] half4 chromaSplit(float2 position, SwiftUI::Layer layer, float2 shift) {
    half4 g = layer.sample(position);
    half4 r = layer.sample(position + shift);
    half4 b = layer.sample(position - shift);
    return half4(r.r, g.g, b.b, max(g.a, max(r.a, b.a)));
}
// maxSampleOffset: CGSize(width: abs(shift.x), height: abs(shift.y)); keep |shift| ≤ 1.5 pt and 0 at rest.
```

### 3.3 Hinge fold of one panel with perspective and moving specular (layer effect, inverse mapping)
This is the single-panel version of concept A. It shows the maths: orthographic in y, perspective in x, normal-based shading.
```metal
// angle: radians, panel rotates about its TOP edge (hinge at y = 0). focal: perspective distance in pt (~800–1000).
[[ stitchable ]] half4 hingeFold(float2 position, SwiftUI::Layer layer, float2 size,
                                 float angle, float focal, float2 light, half4 paper) {
    float c = cos(angle), s = sin(angle);
    float hp = size.y * c;                                  // projected height of the folded panel
    if (position.y > hp) return half4(0);
    float local = position.y / max(c, 0.02);                // distance along the panel from the hinge
    float z = local * s;                                    // depth (positive = away from the reader)
    float k = (focal + z) / focal;                          // perspective: far parts shrink toward centre
    float2 src = float2(size.x * 0.5 + (position.x - size.x * 0.5) * k, local);
    if (src.x < 0.0 || src.x > size.x) return half4(0);
    half4 col = layer.sample(src);
    // paper backing so the fold plane is visible while folding (vanishes when flat)
    half backing = half(0.07 * abs(s));
    col = col + paper * backing * (1.0h - col.a);
    // lighting
    float3 n = float3(0.0, -s, c);
    float3 L = normalize(float3(light, 1.0));
    float3 V = normalize(float3(0.0, (size.y * 0.5 - position.y) / focal, 1.0));
    float3 H = normalize(L + V);
    float diffuse = 0.78 + 0.22 * saturate(dot(n, L));
    float spec = pow(saturate(dot(n, H)), 90.0) * abs(s);    // only on a tilted plane
    col.rgb = col.rgb * half(diffuse) + half(spec) * max(col.a, backing * 4.0h);
    return col;
}
```

### 3.4 Depth of field while text emerges (variable blur)
Inferno `VariableGaussianBlur.metal`: a two-pass `layerEffect` whose radius per pixel comes from a mask image. Gives a "rack focus" from back panels to front. **Use only during the transition and keep radius ≤ 2 pt on text.** For a reader, a brightness/contrast falloff (`.colorMatrix`) gives the same "far away" cue without mush. Ranked low for this app (section 5).

### 3.5 Per-glyph or per-line 3D flip (TextRenderer + projectionTransform)
```swift
static func flip(_ angle: Double, hinge p: CGPoint, focal: CGFloat = 600) -> ProjectionTransform {
    var r = CATransform3DIdentity
    r.m34 = -1 / focal                                  // perspective
    r = CATransform3DRotate(r, angle, 1, 0, 0)          // rotate first, then perspective
    let toOrigin = CATransform3DMakeTranslation(-p.x, -p.y, 0)
    let back = CATransform3DMakeTranslation(p.x, p.y, 0)
    return ProjectionTransform(CATransform3DConcat(CATransform3DConcat(toOrigin, r), back))
}
// in draw(layout:in:):  var c = ctx; c.addFilter(.projectionTransform(Self.flip(a, hinge: CGPoint(x: r.midX, y: r.maxY)))); c.draw(line)
```
**Check on device (10 minutes):** I could not confirm from the interface alone whether the filter's matrix is applied in the context's current user space or in layer space. If lines rotate about the wrong point, drop the two translations and use `ctx.translateBy` around the draw instead. Use the Xcode Preview with a slider on `angle` to confirm.

---

## 4. Gyroscope: make it alive, then settle

### 4.1 Which signal
| Signal | Use | Why |
|---|---|---|
| `deviceMotion.gravity` (unit vector, device frame) | **Light direction + parallax** | Absolute, smooth, no drift, cheap. `g.x` = roll (left/right), `g.y` = pitch (toward/away). |
| `deviceMotion.attitude` + `multiply(byInverseOf: reference)` | When yaw matters (turning in place) | Needs a reference attitude; yaw drifts with `.xArbitraryZVertical`. |
| `rotationRate` (what the app uses now) | Short "kick" accents only | It is a velocity: integrating it drifts, and using it raw gives a twitchy 100 ms flick. |

**Settle behaviour** (the key requirement) comes from a **high-pass**: keep a reference that follows the current gravity slowly, and use `tilt = g − reference`. Held still at any angle, tilt returns to 0 in about 0.4–0.6 s. A turn produces a clear swing. `UIInterpolatingMotionEffect` (home-screen parallax) behaves the same way. It is UIKit-only and has no SwiftUI equivalent in SDK 27 (checked: no `motionEffect`/`parallax` API in SwiftUI).

### 4.2 Layering (what moves how much)
| Layer | Reaction to tilt (unit −1…1) | Notes |
|---|---|---|
| Background plane (MeshGradient / paper texture) | offset ±6–8 pt, **opposite** to tilt | Creates the depth gap behind the text. |
| Text plane | **0° rotation**; optional ±1 pt offset with tilt | Text stays pixel-aligned, so it stays crisp. |
| Text shadow (`.shadow` or a `GraphicsContext` shadow) | offset ±1.5 pt, **away** from the light | Lifts the text off the page. |
| Specular band (3.1) on headers/emphasis (or the whole block, alpha ≤ 0.12) | band centre moves across ±40% of width | Wallet-card or foil feel; this is where the "alive" feel lives. |
| During transition only: fold-panel light (concept A) | light vector = (tilt.x, tilt.y) | The glint angle shifts with how the phone is held. |

### 4.3 Implementation sketch (replaces `MotionTilt`)
```swift
import CoreMotion
import SwiftUI

@Observable @MainActor
final class MotionLight {
    static let shared = MotionLight()
    /// −1…1 on each axis; returns to .zero when the phone is held still.
    private(set) var tilt: SIMD2<Double> = .zero
    private let manager = CMMotionManager()
    private var reference: SIMD2<Double>?
    private var users = 0

    private let follow = 0.045     // reference catch-up per sample (≈0.4 s at 60 Hz)
    private let gain = 3.5         // gravity delta → tilt (≈16° of turn = full swing)
    private let smooth = 0.25      // output low-pass against sensor noise

    func start() {
        users += 1
        guard users == 1, manager.isDeviceMotionAvailable,
              !ProcessInfo.processInfo.isLowPowerModeEnabled,
              !UIAccessibility.isReduceMotionEnabled else { return }
        manager.deviceMotionUpdateInterval = 1.0 / 60.0
        manager.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: .main) { [weak self] m, _ in
            guard let self, let g = m?.gravity else { return }
            MainActor.assumeIsolated { self.ingest(SIMD2(g.x, g.y)) }
        }
    }

    func stop() {
        users = max(0, users - 1)
        guard users == 0 else { return }
        manager.stopDeviceMotionUpdates()
        reference = nil
        tilt = .zero
    }

    private func ingest(_ g: SIMD2<Double>) {
        let ref = (reference ?? g) + ((g - (reference ?? g)) * follow)
        reference = ref
        let target = simd_clamp((g - ref) * gain, SIMD2(repeating: -1), SIMD2(repeating: 1))
        let next = tilt + (target - tilt) * smooth
        // Publish only meaningful changes, so a still phone stops invalidating views
        if simd_length(next - tilt) > 0.002 || simd_length(next) < 0.002 && tilt != .zero {
            tilt = simd_length(next) < 0.002 ? .zero : next
        }
    }
}

/// Reads motion in ITS OWN body, so only this modifier re-renders at 60 Hz (not SectionView).
struct LitByMotion: ViewModifier {
    let light: MotionLight
    var enabled: Bool
    func body(content: Content) -> some View {
        let t = enabled ? light.tilt : .zero
        content
            .shadow(color: .black.opacity(0.18), radius: 1.5, x: -t.x * 1.5, y: t.y * 1.5)
            .visualEffect { v, proxy in
                v.colorEffect(
                    ShaderLibrary.lightBand(
                        .float2(proxy.size.width * (0.5 + 0.4 * t.x), 60),
                        .float2(1, 0), .float(0.10 * min(1, simd_length(t) * 3)), .color(.white)),
                    isEnabled: simd_length(t) > 0.01)        // at rest: no shader, native text
            }
    }
}
```
Background parallax goes on the section's background view (`.offset(x: -t.x * 7, y: -t.y * 7)`) in a separate leaf modifier.

### 4.4 Performance and battery at 120 Hz
- Device motion at 60 Hz is enough for light. Light is low-frequency, and SwiftUI interpolates nothing between samples, but a 60 Hz light change on a 120 Hz panel is invisible for a soft band. If you need 120 Hz smoothness, drive a spring per frame from `TimelineView(.animation(minimumInterval: nil, paused: isSettled))` and pause it once settled.
- Stop updates on `.onDisappear`, when `scenePhase != .active`, in Low Power Mode (observe `NSProcessInfoPowerStateDidChange`), and with Reduce Motion on.
- Stop publishing when the phone is still (the threshold above). A still `@Observable` value costs nothing.
- Never read motion state in a body that also builds the text (section 1, #2).
- Precompile shaders once at launch: `try await ShaderLibrary.accordionUnfold(...).compile(as: .layerEffect)` (iOS 18+). Otherwise the first transition can stall while the shader compiles.
- Add `CADisableMinimumFrameDurationOnPhone = YES` (section 1, #1). Apple recommends saving 120 Hz for "high-impact animations". This transition is one of those.

---

## 5. Readability rules (non-negotiable)

1. **At rest, nothing is applied.** `layerEffect(..., isEnabled: progress < 0.999)`, rotations exactly `0`, no blur filter, and the TextRenderer early-returns to `ctx.draw(line)` when finished. A disabled shader means native text rendering: subpixel-positioned and crisp.
2. **Blur on text ≤ 1 pt and only in the first ~30% of an element's life.** Use opacity, brightness and a 3D angle to convey depth. Blur is what makes transitions look "mushy".
3. **Timing**: total 450–600 ms. First readable content by ~150 ms (concept A: the first panel is flat almost at once; concept B: the first line lands by ~200 ms). Per element 300–380 ms with a snappy spring (`extraBounce` 0.1–0.2, never 0.4 on body text). Outgoing text is gone by 35–40% so it never overlaps the readable new text.
4. **Contrast during motion**: glyph luminance ≥ 60% of final by the middle of each element's animation. Specular is additive on dark and multiplicative (darkening) on light.
5. **Reduce Motion / Prefer Cross-Fade Transitions**: `@Environment(\.accessibilityReduceMotion)` (the SDK doc says it covers both settings), a 200 ms opacity cross-fade, and motion updates off. Declare `TransitionProperties(hasMotion: true)` on custom transitions.
6. **Interruptibility**: a fast second swipe must not jam. Animatable progress retargets from the current value. For self-driven unfolds use `withAnimation(...)` on a `@State` progress, not a fixed keyframe timeline.
7. **VoiceOver**: transitions are visual only. The paragraphs remain normal `Text`, so nothing changes for accessibility.

---

## 6. Ranking

Scores 1–5 (5 = best: most wow, most readable, cheapest to build).

| Rank | Technique | Wow | Readability | Cost | Notes |
|---|---|---|---|---|---|
| **1** | **A. Accordion unfold** (layerEffect, one panel per paragraph, light-driven glint, crease shadow, chroma on steep panels) | 5 | 5 (off at rest; panels flat in order) | 3 | Closest to the foldable iPhone. One shader plus one Animatable modifier. Needs paragraph tops (already split). |
| **2** | **B. Line flip cascade** (TextRenderer + `projectionTransform` per line + `colorShader` glint per line) | 4 | 5 | 3 | Works on any `Text` with no layout changes. Strongest for short text (per-glyph variant on the 1-sentence summary). |
| 3 | Gravity-lit specular band + background parallax (section 4) | 3 (constant, subtle) | 5 | 2 | The "alive" layer. Ship it with A or B. |
| 4 | Per-paragraph `rotation3DEffect(anchor: .top, anchorZ:)` with staggered delays + paragraph shading by angle (no Metal) | 3 | 4 | 1 | Cheapest real 3D. A good fallback if Metal work slips. |
| 5 | Ripple from the swipe point (Apple sample) on depth change | 3 | 3 (warps glyphs while active) | 1 | Nice accent on the old text as it leaves; avoid on the arriving text. |
| 6 | Chromatic fringe on its own | 2 | 3 | 1 | Only as a seasoning inside A or B. |
| 7 | Inferno transitions (Crosswarp, Genie, Swirl, Wind) | 3 | 2 | 1 | Generic and image-like; they look like a slideshow, not reading. |
| 8 | Depth-of-field / variable blur | 3 | 2 | 3 | Fights crispness; use brightness falloff instead. |
| 9 | Liquid Glass on body text | 2 | 2 | 1 | Use glass for the depth control (`glassEffectID` morph between depth chips), never behind paragraphs. |

---

## 7. Concept A: "Accordion unfold" (full sketch)

**Story**: going deeper, the section's text **becomes a folded sheet**: one panel per paragraph, folded zig-zag (mountain, valley, mountain...) into roughly the summary's height. It then **unfolds from the top**, panel by panel. As each panel swings through the light angle (set by how the phone is held), a glint runs across it, so the light visibly travels down the stack. The creases fall **in the paragraph gaps**, so no line of text is ever cut. When everything is flat, the shader turns off and the reader sees native text. Going shallower reverses the motion: the analysis folds up into a small stack and the summary appears. On a 120 Hz screen this reads as real paper, or as the foldable iPhone's hinge.

**Timing** (560 ms, linear clock, smoothstep per panel): stagger 0.12 of the timeline between panels. The old summary leaves in 0–200 ms (opacity + 0.98 scale + 8° back-tilt). Panel 0 (first paragraph) starts at ~84° and is flat by ~300 ms, so the first paragraph is readable early. The last panel is flat at 560 ms.

### A.1 Metal (`Accordion.metal`)
```metal
#include <metal_stdlib>
#include <SwiftUI/SwiftUI.h>
using namespace metal;

// tops: normalised (0…1) top of each panel in source space, ascending, tops[0] = 0. count = panel count.
// progress: 0 = fully folded, 1 = flat. stagger: timeline share between panel starts.
// focal: perspective distance in points. light: tilt (−1…1). sheen: specular strength. aberration: max chroma split (pt).
[[ stitchable ]] half4 accordionUnfold(float2 position, SwiftUI::Layer layer,
                                       float2 size, device const float *tops, int count,
                                       float progress, float stagger, float focal,
                                       float2 light, float sheen, float aberration, half4 paper)
{
    float span = max(1.0 - float(count - 1) * stagger, 0.05);
    float yProj = 0.0;     // projected top of the current panel
    float z = 0.0;         // depth of the current panel's top edge (positive = away from the reader)
    float3 L = normalize(float3(light.x, light.y, 1.0));

    for (int i = 0; i < count; i++) {
        float top    = tops[i] * size.y;
        float bottom = (i + 1 < count) ? tops[i + 1] * size.y : size.y;
        float h = max(bottom - top, 1.0);

        float local = saturate((progress - float(i) * stagger) / span);
        float e = local * local * (3.0 - 2.0 * local);                 // smoothstep ease per panel
        float a = (1.0 - e) * 1.47 * ((i % 2 == 0) ? 1.0 : -1.0);      // ±84°, zig-zag
        float c = cos(a), s = sin(a);
        float hp = h * c;

        if (position.y < yProj + hp) {
            float along = (position.y - yProj) / max(c, 0.02);          // distance from this panel's hinge
            float zz = z + along * s;
            float k = (focal + zz) / focal;                               // perspective in x
            float2 src = float2(size.x * 0.5 + (position.x - size.x * 0.5) * k, top + along);
            if (src.x < 0.0 || src.x > size.x) return half4(0);

            // chromatic split grows with steepness, zero when flat
            float ca = aberration * abs(s);
            half4 g = layer.sample(src);
            half4 r = layer.sample(src + float2(ca, 0));
            half4 b = layer.sample(src - float2(ca, 0));
            half4 col = half4(r.r, g.g, b.b, max(g.a, max(r.a, b.a)));

            // paper backing makes the fold planes visible mid-motion, gone at rest
            half backing = half(0.08 * abs(s));
            col += paper * backing * (1.0h - col.a);

            // lighting: diffuse by panel normal, crease shadow, specular band using a per-pixel view vector
            float3 n = float3(0.0, -s, c);
            float diffuse = 0.80 + 0.20 * saturate(dot(n, L));
            float edge = min(along, h - along);
            float ao = 1.0 - 0.45 * abs(s) * (1.0 - smoothstep(0.0, 18.0, edge));
            float3 V = normalize(float3((size.x * 0.5 - position.x) / focal, (size.y * 0.5 - position.y) / focal, 1.0));
            float3 H = normalize(L + V);
            float spec = sheen * pow(saturate(dot(n, H)), 120.0) * abs(s);
            col.rgb = col.rgb * half(diffuse * ao) + half(spec) * max(col.a, backing * 3.0h);
            col.a = max(col.a, half(spec) * backing * 3.0h);
            return col;
        }
        yProj += hp;
        z += h * s;
    }
    return half4(0);   // below the folded stack
}
```

### A.2 Swift
```swift
import SwiftUI

/// Same panel maths as the shader, so the layout height follows the folding stack.
enum Accordion {
    static func foldedHeight(tops: [Float], total: CGFloat, progress: Double, stagger: Double) -> CGFloat {
        let n = tops.count
        let span = max(1 - Double(n - 1) * stagger, 0.05)
        var h: CGFloat = 0
        for i in 0..<n {
            let top = CGFloat(tops[i]) * total
            let bottom = i + 1 < n ? CGFloat(tops[i + 1]) * total : total
            let local = min(1, max(0, (progress - Double(i) * stagger) / span))
            let e = local * local * (3 - 2 * local)
            h += (bottom - top) * cos((1 - e) * 1.47)
        }
        return h
    }
}

struct AccordionUnfold: ViewModifier, Animatable {
    var progress: Double                 // 0 folded → 1 flat
    var tops: [Float]                    // normalised panel tops, tops[0] == 0
    var totalHeight: CGFloat             // natural height of the content
    var light: SIMD2<Double>
    var paper: Color
    var stagger = 0.12

    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }

    func body(content: Content) -> some View {
        let active = progress < 0.999 && tops.count > 0 && totalHeight > 0
        let (tops, progress, stagger, light, paper) = (tops, progress, stagger, light, paper)   // Sendable captures
        content
            .visualEffect { view, proxy in
                view.layerEffect(
                    ShaderLibrary.accordionUnfold(
                        .float2(proxy.size), .floatArray(tops),       // floatArray → (device const float*, int)
                        .float(progress), .float(stagger), .float(900),
                        .float2(light.x, light.y), .float(0.9), .float(1.2), .color(paper)),
                    maxSampleOffset: proxy.size,          // samples come from further down the same view
                    isEnabled: active)
            }
            // content keeps its natural height (fixedSize vertical); the frame makes the sections below ride up with the unfold
            .frame(height: active ? Accordion.foldedHeight(tops: tops, total: totalHeight, progress: progress, stagger: stagger) : nil,
                   alignment: .top)
    }
}

/// The deeper level's paragraphs: measures the creases, then unfolds itself on appear.
struct UnfoldingParagraphs: View {
    let paragraphs: [AttributedString]
    let style: Typography.DepthStyle
    let foreground: Color
    let paper: Color
    var light: SIMD2<Double>

    @State private var paragraphTops: [CGFloat] = []
    @State private var total: CGFloat = 0
    @State private var progress = 0.0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var tops: [Float] {
        guard total > 0, !paragraphTops.isEmpty else { return [0] }
        // creases in the middle of the 12 pt paragraph gap; first panel starts at 0
        return paragraphTops.enumerated().map { i, y in i == 0 ? 0 : Float(max(0, y - 6) / total) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(paragraphs.indices, id: \.self) { i in
                Text(paragraphs[i])
                    .font(style.font)
                    .foregroundStyle(foreground.opacity(style.opacity))
                    .lineSpacing(style.lineSpacing)
                    .fixedSize(horizontal: false, vertical: true)
                    .onGeometryChange(for: CGFloat.self) { $0.frame(in: .named("unfold")).minY } action: { y in
                        if paragraphTops.count != paragraphs.count { paragraphTops = Array(repeating: 0, count: paragraphs.count) }
                        paragraphTops[i] = y
                    }
            }
        }
        .coordinateSpace(.named("unfold"))
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { total = $0 }
        .modifier(AccordionUnfold(progress: reduceMotion ? 1 : progress, tops: tops,
                                  totalHeight: total, light: light, paper: paper))
        .onAppear {
            guard !reduceMotion else { progress = 1; return }
            // linear clock; easing lives per panel inside the shader
            withAnimation(.linear(duration: 0.56).delay(0.06)) { progress = 1 }
        }
    }
}
```
**Wiring into `SectionView.contentBody`**: when going deeper, render `UnfoldingParagraphs` with `.transition(.asymmetric(insertion: .identity, removal: .opacity))`. Give the old summary a short removal transition (opacity + `.scale(0.98, anchor: .top)` + 8° `rotation3DEffect` with `anchorZ: -20`, about 200 ms). When going shallower, apply `AccordionUnfold(progress: 0 …)` as the removal transition's active state, using `AnyTransition.modifier(active:identity:)` with uniform tops (`(0..<n).map { Float($0)/Float(n) }`). The removal transition can't see the measured tops, which is why the shader takes normalised tops.
**Light** comes from `MotionLight.shared.tilt`, read in the small wrapper only. **Paper colour**: dark mode `Color.white.opacity(1)` (the shader scales it to ≤ 8%); light mode `Color.black`.
**Things to tune on the device**: `stagger` 0.10–0.14, `focal` 700–1100, `sheen` 0.6–1.2, `aberration` 0.8–1.5 pt, max angle 1.35–1.5 rad.
**Known limits**: y uses an orthographic projection (x gets the perspective), which is visually convincing and needs no depth sorting. Panels taller than the screen are fine. With an 8-panel cap the shader loop is trivial on the GPU.

---

## 8. Concept B: "Line flip cascade with glint" (full sketch)

**Story**: lines rise from the page. Each line starts edge-on (rotated 90° on its baseline, invisible), flips up with a real perspective projection and a small spring overshoot, and while it lands a band of light sweeps across its glyphs, left to right. Lines are staggered top to bottom and across paragraphs (paragraph index tagged with a `TextAttribute`). Outgoing text does the reverse in 250 ms, flipping away from the reader top-first. At rest it is plain `ctx.draw(line)`.

### B.1 Metal (`Glint.metal`)
```metal
#include <metal_stdlib>
#include <SwiftUI/SwiftUI.h>
using namespace metal;

// band.x = centre (pt, in the context's x), band.y = half-width; amount 0…1
[[ stitchable ]] half4 glint(float2 position, half4 color, float2 band, float amount, half4 tint) {
    float d = (position.x - band.x) / band.y;
    half k = half(amount * exp(-d * d));
    return half4(color.rgb + k * color.a * tint.rgb, color.a);
}
```

### B.2 Swift
```swift
import SwiftUI
import QuartzCore

struct ParagraphIndex: TextAttribute { var value: Int }

struct FlipCascadeRenderer: TextRenderer, Animatable {
    /// 1 = fully shown (identity). Arriving animates 0 → 1, leaving animates 1 → 0. Animated LINEARLY.
    var progress: Double
    var total: TimeInterval = 0.60
    var lineDuration: TimeInterval = 0.34
    var paragraphLead: TimeInterval = 0.07   // extra delay per paragraph
    var direction: Double = 1          // +1 arriving (rise from page), −1 leaving (flip away)
    var light: SIMD2<Double> = .zero
    var tint: Color = .white

    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }

    /// Room for the perspective overhang so lines are not clipped mid-flip.
    var displayPadding: EdgeInsets { EdgeInsets(top: 20, leading: 24, bottom: 20, trailing: 24) }

    func draw(layout: Text.Layout, in ctx: inout GraphicsContext) {
        let lines = Array(layout)
        guard progress < 1, !lines.isEmpty else {              // at rest: native, crisp
            for line in lines { ctx.draw(line) }
            return
        }
        // one forward clock for both phases
        let elapsed = (direction > 0 ? progress : 1 - progress) * total
        let paragraph = lines.first?.first?[ParagraphIndex.self]?.value ?? 0
        let budget = max(0.01, total - lineDuration - Double(paragraph) * paragraphLead)
        let perLine = lines.count > 1 ? min(0.05, budget / Double(lines.count - 1)) : 0
        let spring = Spring.snappy(duration: lineDuration, extraBounce: 0.12)

        for (i, line) in lines.enumerated() {
            let start = Double(paragraph) * paragraphLead + Double(i) * perLine
            let t = min(lineDuration, max(0, elapsed - start))
            let unit = t / lineDuration
            guard unit > 0 || direction < 0 else { continue }

            // 0 → 1 with a slight overshoot
            let p = spring.value(fromValue: 0.0, toValue: 1.0, initialVelocity: 0, time: t)
            let shown = direction > 0 ? p : 1 - p
            let angle = (1 - shown) * (.pi / 2) * (direction > 0 ? 1 : -1)
            let r = line.typographicBounds.rect

            var c = ctx
            c.opacity = direction > 0 ? min(1, unit * 2.5) : max(0, 1 - unit * 1.6)
            c.addFilter(.projectionTransform(Self.flip(angle, hinge: CGPoint(x: r.midX, y: r.maxY))))
            c.addFilter(.brightness(-0.25 * abs(sin(angle))))          // far = darker

            // glint: strongest as the line passes ~25–35° (shifted by how the phone is held)
            let peak = 0.5 + light.y * 0.25
            let amount = exp(-pow(abs(angle) - peak, 2) / 0.03) * 0.55
            if amount > 0.02 {
                let x = r.minX + r.width * (unit * 1.4 - 0.2)            // sweeps left → right
                c.addFilter(.colorShader(ShaderLibrary.glint(.float2(x, 70), .float(amount), .color(tint))))
            }
            c.draw(line, options: .disablesSubpixelQuantization)
        }
    }

    static func flip(_ angle: Double, hinge p: CGPoint, focal: CGFloat = 600) -> ProjectionTransform {
        var r = CATransform3DIdentity
        r.m34 = -1 / focal
        r = CATransform3DRotate(r, angle, 1, 0, 0)
        let toOrigin = CATransform3DMakeTranslation(-p.x, -p.y, 0)
        let back = CATransform3DMakeTranslation(p.x, p.y, 0)
        return ProjectionTransform(CATransform3DConcat(CATransform3DConcat(toOrigin, r), back))
    }
}

struct FlipCascadeTransition: Transition {
    var light: SIMD2<Double>
    static var properties: TransitionProperties { TransitionProperties(hasMotion: true) }

    func body(content: Content, phase: TransitionPhase) -> some View {
        let leaving = phase == .didDisappear
        let total = leaving ? 0.25 : 0.60
        // Same renderer type in every phase, so SwiftUI interpolates `progress` between phases
        let renderer = FlipCascadeRenderer(
            progress: phase.isIdentity ? 1 : 0,
            total: total,
            lineDuration: leaving ? 0.18 : 0.34,
            direction: leaving ? -1 : 1,
            light: light)
        content.transaction { t in
            if !t.disablesAnimations { t.animation = .linear(duration: total) }   // easing lives per line (spring)
        } body: { view in
            view.textRenderer(renderer)
        }
    }
}
```
Tag paragraphs: `Text(Self.styled(p)).customAttribute(ParagraphIndex(value: i))`. The attribute has to cover the whole run, so wrap the styled paragraph: `Text("\(Text(styled).customAttribute(ParagraphIndex(value: i)))")`, or set it on the outer `Text`.
**Leaving phase**: SwiftUI animates `.identity` → `.didDisappear`, so `progress` goes 1 → 0. The renderer turns that into a forward clock (`1 - progress`), so lines leave top-first. A non-animatable field like `total` takes its final value at the start of the phase, which is why the 0.25 s leaving timing is set entirely in the `.didDisappear` branch. The rule the current `DepthScanTransition` already follows still holds: one renderer type in every phase.
**Per-glyph variant** for the 1-sentence summary: iterate `layout.flattenedRunSlices` instead of lines and use the slice's `typographicBounds.rect` for the hinge. With ~100 glyphs and staggered 12 ms it gives a "letters snapping in" cascade. Keep it to the summary only.
**Combine with A**: when going deeper, the old summary **leaves with B (reverse, 250 ms)** while the analysis **arrives with A**. When going shallower, the analysis folds away with A reversed and the summary arrives with B per glyph.

---

## 9. Small extras worth having
- **Depth chip morph**: the depth indicator as Liquid Glass chips in a `GlassEffectContainer`, with `glassEffectID(depth, in: ns)` so the active chip morphs as the depth changes (bundled Liquid Glass doc).
- **Haptic on landing**: `.sensoryFeedback(.impact(weight: .light, intensity: 0.5), trigger: depth)` timed with the last panel going flat. It roots the "physical fold" in touch. Cheap, and the wow it adds is large.
- **Swipe-origin ripple** on the outgoing text only (Apple's `Ripple` with amplitude 6, decay 10), origin = the drag's end point.
- **Scroll polish** for the long analysis: `.scrollTransition(.interactive) { c, phase in c.opacity(phase.isIdentity ? 1 : 0.6).offset(y: phase.value * 6) }` per paragraph.

## 10. Test plan (device, iPhone 15 Pro)
1. Add `CADisableMinimumFrameDurationOnPhone`. In Instruments (Animation Hitches + Core Animation FPS), confirm the transition runs at 120 fps with 0 hitches over 20 depth changes.
2. Instruments → SwiftUI template: with the phone moving, `SectionView.body` evaluations per second must be ~0 after the leaf-modifier fix (today ~60).
3. Screenshot diff: at rest after a transition, the rendered text must be pixel-identical to a build with effects off (proves the shader is disabled and the text is not resampled).
4. Reduce Motion on: only cross-fades, no motion updates (check `CMMotionManager.isDeviceMotionActive == false`).
5. Rapid swipes (5 depth changes in 1 s): no stuck half-folded state, and the final text is crisp.
