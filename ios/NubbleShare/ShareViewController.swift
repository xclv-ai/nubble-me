import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// "Share → Nubble" from Safari: saves the page to the App Group inbox; the app writes its levels.
final class ShareViewController: UIViewController {
    private static let appGroup = "group.me.nubble.app"

    override func viewDidLoad() {
        super.viewDidLoad()
        let host = UIHostingController(rootView: SavedView())
        addChild(host)
        host.view.frame = view.bounds
        host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(host.view)
        host.didMove(toParent: self)

        Task { @MainActor in
            await saveSharedPage()
            try? await Task.sleep(for: .milliseconds(900))
            extensionContext?.completeRequest(returningItems: nil)
        }
    }

    private func saveSharedPage() async {
        let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
        for item in items {
            let title = item.attributedContentText?.string
            for provider in item.attachments ?? [] where provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                if let url = try? await provider.loadItem(forTypeIdentifier: UTType.url.identifier) as? URL {
                    append(url: url, title: title)
                    return
                }
            }
        }
    }

    private func append(url: URL, title: String?) {
        guard let file = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Self.appGroup)?
            .appendingPathComponent("shared-inbox.json") else { return }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        var list = (try? decoder.decode([Entry].self, from: Data(contentsOf: file))) ?? []
        list.append(Entry(url: url.absoluteString, title: title, sharedAt: Date()))
        if let data = try? encoder.encode(list) { try? data.write(to: file, options: .atomic) }
    }

    private struct Entry: Codable {
        let url: String
        let title: String?
        let sharedAt: Date
    }
}

private struct SavedView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 44))
                .foregroundStyle(.green)
            Text("Saved to Nubble")
                .font(.headline)
            Text("Open Nubble to read it at every depth.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.regularMaterial)
    }
}
