import CoreMotion
import SceneKit
import SwiftUI
import UIKit

/// Dr HAOS in 3D: low-poly bevelled geometry built from the mascot's own shapes, physically-based materials with a
/// grain, a key light with soft shadows onto a beige plate. The phone's tilt turns the whole stage, so the light
/// stays put and the shadows move. He is alive: breathing, blinking, ear twitches, chin up, a slow look-away when
/// you take too long; a tap earns a dismissive shake.
struct HaosStage: UIViewRepresentable {
    var height: CGFloat = 300
    var mood: Mood = .idle

    enum Mood { case idle, reading, discharged }

    func makeUIView(context: Context) -> SCNView {
        let v = SCNView()
        v.scene = context.coordinator.scene
        v.backgroundColor = .clear
        v.antialiasingMode = .multisampling4X
        v.allowsCameraControl = false
        v.isPlaying = true
        v.preferredFramesPerSecond = 60
        v.addGestureRecognizer(UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.tap)))
        context.coordinator.start()
        return v
    }

    func updateUIView(_ uiView: SCNView, context: Context) { context.coordinator.mood = mood }
    func makeCoordinator() -> Coordinator { Coordinator() }
    static func dismantleUIView(_ uiView: SCNView, coordinator: Coordinator) { coordinator.stop() }

    final class Coordinator: NSObject {
        let scene = SCNScene()
        let stage = SCNNode()      // tilts with the phone
        let head = SCNNode()       // his idle motion
        var eyes: [SCNNode] = []
        var ears: [SCNNode] = []
        let motion = CMMotionManager()
        var mood: Mood = .idle
        private var tiltX: Float = 0, tiltY: Float = 0

        override init() {
            super.init()
            build()
        }

        // MARK: - Geometry from the mascot (SVG viewBox 0…100, y down → scene −1…1, y up)
        private func pt(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: (x - 50) / 50, y: (50 - y) / 50) }
        private func polygon(_ coords: [CGFloat]) -> UIBezierPath {
            let p = UIBezierPath()
            for i in stride(from: 0, to: coords.count, by: 2) { let q = pt(coords[i], coords[i + 1]); i == 0 ? p.move(to: q) : p.addLine(to: q) }
            p.close(); return p
        }
        private func shape(_ path: UIBezierPath, depth: CGFloat, chamfer: CGFloat, color: UIColor, roughness: CGFloat = 0.55, metal: CGFloat = 0.02) -> SCNNode {
            path.flatness = 0.02
            let g = SCNShape(path: path, extrusionDepth: depth)
            g.chamferRadius = chamfer
            g.chamferMode = .both
            let m = SCNMaterial()
            m.lightingModel = .physicallyBased
            m.diffuse.contents = color
            m.roughness.contents = Self.grain(base: roughness)
            m.normal.contents = Self.grainNormal
            m.normal.intensity = 0.18
            m.metalness.contents = metal
            g.materials = [m]
            let n = SCNNode(geometry: g)
            n.castsShadow = true
            return n
        }

        private func build() {
            let pink = UIColor(red: 1, green: 0.769, blue: 0.839, alpha: 1)
            let teal = UIColor(red: 0.039, green: 0.231, blue: 0.267, alpha: 1)
            let yellow = UIColor(red: 0.992, green: 1, blue: 0, alpha: 1)
            let white = UIColor(red: 0.992, green: 0.992, blue: 0.988, alpha: 1)
            let beige = UIColor(red: 0.910, green: 0.878, blue: 0.820, alpha: 1)

            // the face plate: pink rim, teal inner (the scanning bar with its notches)
            let rim = polygon([49.9, 74.7, 41.5, 78.5, 33.6, 70.6, 10.7, 70.6, 10.7, 67.3, 7.4, 67.3, 7.4, 40.5, 10.7, 40.5, 10.7, 37.2, 16.2, 37.2, 27.3, 22.3, 34.6, 37.2, 67.2, 37.2, 74.5, 21.4, 83, 37.2, 89.1, 37.2, 89.1, 40.5, 92.4, 40.5, 92.4, 67.3, 89.1, 67.3, 89.1, 70.6, 66.3, 70.6, 58.3, 78.5])
            let inner = polygon([86.2, 43.4, 86.2, 40.1, 81.3, 40.1, 74.7, 27.9, 69, 40.1, 32.7, 40.1, 26.8, 27.9, 17.7, 40.1, 13.6, 40.1, 13.6, 43.4, 10.3, 43.4, 10.3, 64.4, 13.6, 64.4, 13.6, 67.7, 86.2, 67.7, 86.2, 64.4, 89.5, 64.4, 89.5, 43.4])
            let rimNode = shape(rim, depth: 0.22, chamfer: 0.04, color: pink, roughness: 0.6)
            let innerNode = shape(inner, depth: 0.26, chamfer: 0.035, color: teal, roughness: 0.5)
            innerNode.position.z = 0.03
            // ears (parts of the rim that stick up) get their own thin plates so they can twitch
            let earShapes: [([CGFloat], CGFloat)] = [([16.2, 37.2, 27.3, 22.3, 34.6, 37.2], 27.3), ([67.2, 37.2, 74.5, 21.4, 83, 37.2], 74.5)]
            for (ear, tip) in earShapes {
                let e = shape(polygon(ear), depth: 0.2, chamfer: 0.02, color: pink)
                e.pivot = SCNMatrix4MakeTranslation(Float(pt(tip, 37.2).x), Float(pt(tip, 37.2).y), 0)
                e.position = SCNVector3(Float(pt(tip, 37.2).x), Float(pt(tip, 37.2).y), 0.01)
                ears.append(e); head.addChildNode(e)
            }
            // eyes: half-lidded, glossy — the arrogance is in the lid
            for cx in [CGFloat(31), CGFloat(69)] {
                let p = UIBezierPath()
                let a = pt(cx - 9, 55), b = pt(cx + 9, 55), c = pt(cx, 50), d = pt(cx, 60)
                p.move(to: a); p.addQuadCurve(to: b, controlPoint: c); p.addQuadCurve(to: a, controlPoint: d); p.close()
                let e = shape(p, depth: 0.08, chamfer: 0.012, color: yellow, roughness: 0.18, metal: 0.05)
                e.position.z = 0.17
                eyes.append(e); head.addChildNode(e)
                // the lid: a teal wedge over the top third — half-lidded, always
                let lid = UIBezierPath(); lid.move(to: pt(cx - 10, 50)); lid.addLine(to: pt(cx + 10, 50)); lid.addLine(to: pt(cx + 10, 53.6)); lid.addLine(to: pt(cx - 10, 53.6)); lid.close()
                let l = shape(lid, depth: 0.09, chamfer: 0.005, color: teal); l.position.z = 0.18; head.addChildNode(l)
            }
            // the nose: the bridge and the heart — his signature
            let bridge = UIBezierPath(roundedRect: CGRect(x: pt(46.5, 0).x, y: pt(0, 63.5).y, width: 7 / 50, height: 20 / 50), cornerRadius: 0.05)
            let bridgeNode = shape(bridge, depth: 0.14, chamfer: 0.03, color: white, roughness: 0.4); bridgeNode.position.z = 0.16
            let heart = polygon([64.9, 67.8, 55.2, 62.8, 44.6, 62.8, 35, 67.8, 42.2, 75.1, 49.9, 71.5, 57.7, 75.1])
            let heartNode = shape(heart, depth: 0.16, chamfer: 0.03, color: white, roughness: 0.4); heartNode.position.z = 0.17
            head.addChildNode(rimNode); head.addChildNode(innerNode); head.addChildNode(bridgeNode); head.addChildNode(heartNode)
            head.scale = SCNVector3(1.15, 1.15, 1.15)
            head.position = SCNVector3(0, 0.12, 0)
            head.eulerAngles.x = -0.12   // chin up
            stage.addChildNode(head)

            // the plate he stands on: POKPOK beige, receives the shadow
            let plate = SCNNode(geometry: SCNBox(width: 3.2, height: 0.08, length: 2.2, chamferRadius: 0.03))
            let pm = SCNMaterial(); pm.lightingModel = .physicallyBased; pm.diffuse.contents = beige; pm.roughness.contents = Self.grain(base: 0.85); pm.normal.contents = Self.grainNormal; pm.normal.intensity = 0.06
            plate.geometry?.materials = [pm]
            plate.position = SCNVector3(0, -0.95, -0.1)
            plate.castsShadow = false
            stage.addChildNode(plate)
            // a back wall, same material, so the shadow also climbs a wall when he tilts
            let wall = SCNNode(geometry: SCNBox(width: 3.2, height: 2.6, length: 0.08, chamferRadius: 0.03))
            wall.geometry?.materials = [pm]
            wall.position = SCNVector3(0, 0.33, -0.95)
            wall.castsShadow = false
            stage.addChildNode(wall)
            scene.rootNode.addChildNode(stage)

            // lights: the key stays in the world; the stage turns under it
            let key = SCNNode(); key.light = SCNLight(); key.light!.type = .directional; key.light!.intensity = 1400
            key.light!.castsShadow = true; key.light!.shadowMode = .deferred; key.light!.shadowRadius = 9; key.light!.shadowSampleCount = 16
            key.light!.shadowColor = UIColor(red: 0.02, green: 0.1, blue: 0.12, alpha: 0.55); key.light!.orthographicScale = 2.5
            key.eulerAngles = SCNVector3(-0.75, 0.55, 0); scene.rootNode.addChildNode(key)
            let fill = SCNNode(); fill.light = SCNLight(); fill.light!.type = .omni; fill.light!.intensity = 350; fill.light!.color = UIColor(red: 0.85, green: 0.95, blue: 1, alpha: 1)
            fill.position = SCNVector3(-2, 0.5, 2.5); scene.rootNode.addChildNode(fill)
            let rimL = SCNNode(); rimL.light = SCNLight(); rimL.light!.type = .omni; rimL.light!.intensity = 500; rimL.light!.color = pink
            rimL.position = SCNVector3(1.6, 1.2, -1.2); scene.rootNode.addChildNode(rimL)
            let amb = SCNNode(); amb.light = SCNLight(); amb.light!.type = .ambient; amb.light!.intensity = 220; amb.light!.color = UIColor(white: 0.9, alpha: 1); scene.rootNode.addChildNode(amb)
            scene.lightingEnvironment.contents = Self.sky; scene.lightingEnvironment.intensity = 0.8

            let cam = SCNNode(); cam.camera = SCNCamera(); cam.camera!.fieldOfView = 34; cam.camera!.wantsHDR = true; cam.camera!.bloomIntensity = 0.15
            cam.position = SCNVector3(0, 0.25, 4.2); cam.look(at: SCNVector3(0, 0.05, 0)); scene.rootNode.addChildNode(cam)

            idle()
        }

        // MARK: - Life
        private func idle() {
            // breathing: the head rises and falls, slowly
            head.runAction(.repeatForever(.sequence([.moveBy(x: 0, y: 0.025, z: 0, duration: 2.2).withTiming(), .moveBy(x: 0, y: -0.025, z: 0, duration: 2.2).withTiming()])))
            // the slow look-away and back: he has better things to do
            head.runAction(.repeatForever(.sequence([.wait(duration: 5, withRange: 4), .rotateBy(x: 0, y: 0.42, z: 0.04, duration: 1.3).withTiming(), .wait(duration: 2.5, withRange: 2), .rotateBy(x: 0, y: -0.42, z: -0.04, duration: 0.9).withTiming()])))
            // blink: the lids stay, the eyes dip
            for e in eyes { e.runAction(.repeatForever(.sequence([.wait(duration: 3.5, withRange: 3), .scale(to: 0.1, duration: 0.07), .scale(to: 1, duration: 0.12)]))) }
            // ear twitch, one ear at a time
            for (i, ear) in ears.enumerated() { ear.runAction(.repeatForever(.sequence([.wait(duration: 6 + Double(i) * 2, withRange: 5), .rotateBy(x: 0, y: 0, z: i == 0 ? 0.22 : -0.22, duration: 0.09), .rotateBy(x: 0, y: 0, z: i == 0 ? -0.22 : 0.22, duration: 0.25).withTiming()]))) }
        }

        @objc func tap() {
            // a dismissive shake, ears flat for a moment
            head.removeAction(forKey: "shake")
            head.runAction(.sequence([.rotateBy(x: 0, y: -0.25, z: 0, duration: 0.08), .rotateBy(x: 0, y: 0.5, z: 0, duration: 0.14), .rotateBy(x: 0, y: -0.4, z: 0, duration: 0.14), .rotateBy(x: 0, y: 0.15, z: 0, duration: 0.1)]), forKey: "shake")
            for e in ears { e.runAction(.sequence([.rotateBy(x: 0.9, y: 0, z: 0, duration: 0.1), .wait(duration: 0.5), .rotateBy(x: -0.9, y: 0, z: 0, duration: 0.3).withTiming()])) }
            UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        }

        // MARK: - The phone's tilt turns the stage under a fixed light
        func start() {
            guard motion.isDeviceMotionAvailable, !motion.isDeviceMotionActive else { return }
            motion.deviceMotionUpdateInterval = 1 / 60
            motion.startDeviceMotionUpdates(using: .xArbitraryZVertical, to: .main) { [weak self] m, _ in
                guard let self, let a = m?.attitude else { return }
                // holding the phone upright is the rest pose; ±25° of tilt gives ±12° of stage
                let targetX = Float(max(-0.22, min(0.22, (a.pitch - 0.9) * 0.45)))
                let targetY = Float(max(-0.25, min(0.25, a.roll * 0.5)))
                self.tiltX += (targetX - self.tiltX) * 0.12
                self.tiltY += (targetY - self.tiltY) * 0.12
                self.stage.eulerAngles = SCNVector3(self.tiltX, self.tiltY, 0)
            }
        }
        func stop() { motion.stopDeviceMotionUpdates() }

        // MARK: - Textures: a fine grain so the surfaces look like material, not plastic
        static let grainNormal: UIImage = noiseImage(size: 256, strength: 0.18, normal: true)
        static func grain(base: CGFloat) -> UIImage { noiseImage(size: 128, strength: 0.12, normal: false, base: base) }
        static let sky: UIImage = {
            let r = UIGraphicsImageRenderer(size: CGSize(width: 64, height: 64))
            return r.image { ctx in
                let colors = [UIColor(red: 0.95, green: 0.97, blue: 1, alpha: 1).cgColor, UIColor(red: 0.6, green: 0.7, blue: 0.75, alpha: 1).cgColor, UIColor(red: 0.15, green: 0.25, blue: 0.28, alpha: 1).cgColor]
                let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors as CFArray, locations: [0, 0.55, 1])!
                ctx.cgContext.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: 64), options: [])
            }
        }()
        private static func noiseImage(size: Int, strength: CGFloat, normal: Bool, base: CGFloat = 0.5) -> UIImage {
            var rng = SystemRandomNumberGenerator()
            let r = UIGraphicsImageRenderer(size: CGSize(width: size, height: size))
            return r.image { ctx in
                for y in 0..<size { for x in 0..<size {
                    let n = CGFloat.random(in: -strength...strength, using: &rng)
                    let c = normal ? UIColor(red: 0.5 + n, green: 0.5 + CGFloat.random(in: -strength...strength, using: &rng), blue: 1, alpha: 1)
                                   : UIColor(white: max(0, min(1, base + n)), alpha: 1)
                    ctx.cgContext.setFillColor(c.cgColor); ctx.cgContext.fill(CGRect(x: x, y: y, width: 1, height: 1))
                } }
            }
        }
    }
}

private extension SCNAction {
    func withTiming() -> SCNAction { timingMode = .easeInEaseOut; return self }
}
