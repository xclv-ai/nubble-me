#if DEBUG
import SwiftUI
import WebKit
import UniformTypeIdentifiers
import CoreMotion

/// Debug only: shows a web prototype full screen inside the app.
/// `-proto gauge3d.html` loads the page bundled in ProtoBundle (no network to the Mac needed);
/// `-proto https://…` loads a remote page.
struct ProtoViewer: UIViewRepresentable {
    let url: URL

    static var launchURL: URL? {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-proto"), i + 1 < args.count else { return nil }
        let value = args[i + 1]
        if value.hasPrefix("http") { return URL(string: value) }
        return URL(string: "proto://app/\(value)")
    }

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "proto")
        config.userContentController.add(context.coordinator, name: "haptic")
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.isOpaque = false
        web.backgroundColor = .black
        web.scrollView.isScrollEnabled = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.load(URLRequest(url: url))
        context.coordinator.startMotion(for: web)
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    /// Serves files from the app's ProtoBundle folder at proto://app/<path>.
    final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
        func webView(_ webView: WKWebView, start task: any WKURLSchemeTask) {
            guard let url = task.request.url,
                  let root = Bundle.main.url(forResource: "ProtoBundle", withExtension: nil) else {
                task.didFailWithError(URLError(.fileDoesNotExist)); return
            }
            let file = root.appendingPathComponent(String(url.path.dropFirst()))
            guard let data = try? Data(contentsOf: file) else { task.didFailWithError(URLError(.fileDoesNotExist)); return }
            let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
            let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                           headerFields: ["Content-Type": mime, "Access-Control-Allow-Origin": "*"])!
            task.didReceive(response)
            task.didReceive(data)
            task.didFinish()
        }
        func webView(_ webView: WKWebView, stop task: any WKURLSchemeTask) {}
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        /// The page asks for a physical click: 'press' when the gauge is touched, 'tick' every 10 points, 'land' at the score.
        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            switch message.body as? String {
            case "press": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            case "tick": UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.6)
            case "land": UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
            default: break
            }
        }
        nonisolated(unsafe) private let motion = CMMotionManager()
        /// Feeds the phone's tilt into the page (window.__tilt) — pages served from the app are not a secure
        /// context, so the web DeviceOrientation API stays silent there.
        func startMotion(for web: WKWebView) {
            guard motion.isDeviceMotionAvailable else { return }
            motion.deviceMotionUpdateInterval = 1.0 / 60.0
            var base: CMAcceleration?
            motion.startDeviceMotionUpdates(to: .main) { [weak web] data, _ in
                guard let g = data?.gravity, let web else { return }
                // the way the phone is held when the screen opens counts as "straight"; tilt is measured from there
                if base == nil { base = g }
                let x = (g.x - base!.x) * 6.0, y = (g.y - base!.y) * 6.0
                web.evaluateJavaScript("window.__tilt && window.__tilt(\(x), \(y))", completionHandler: nil)
            }
        }
        deinit { motion.stopDeviceMotionUpdates() }

        func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge,
                     completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
            if let trust = challenge.protectionSpace.serverTrust {
                completionHandler(.useCredential, URLCredential(trust: trust))
            } else {
                completionHandler(.performDefaultHandling, nil)
            }
        }

        func webView(_ webView: WKWebView, requestDeviceOrientationAndMotionPermissionFor origin: WKSecurityOrigin,
                     initiatedByFrame frame: WKFrameInfo, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(.grant)
        }
    }
}
#endif
