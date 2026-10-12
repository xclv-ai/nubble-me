import SwiftUI

/// The news sources the iPhone reads. Switch them on/off, delete them, or add any site by its address.
struct SourcesView: View {
    @Environment(FeedState.self) private var feedState
    @State private var newAddress = ""
    @State private var isAdding = false
    @State private var message: String?

    var body: some View {
        @Bindable var feedState = feedState
        List {
            Section {
                HStack {
                    TextField("Site or feed address", text: $newAddress)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .onSubmit { Task { await add() } }
                    if isAdding {
                        ProgressView()
                    } else {
                        Button("Add") { Task { await add() } }
                            .disabled(newAddress.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
                if let message {
                    Text(message).font(.footnote).foregroundStyle(.red)
                }
            } header: {
                Text("Add a source")
            } footer: {
                Text("Paste a site (e.g. retaildive.com) or its RSS address. The iPhone finds the feed itself.")
            }

            Section {
                ForEach($feedState.sources) { $source in
                    Toggle(isOn: $source.isActive) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(source.name)
                            Text(source.url.host() ?? source.url.absoluteString)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let error = source.lastError, source.isActive {
                                Text(error).font(.caption).foregroundStyle(.red)
                            }
                        }
                    }
                }
                .onDelete { feedState.sources.remove(atOffsets: $0) }
            } header: {
                Text("\(feedState.sources.filter(\.isActive).count) of \(feedState.sources.count) on")
            }

            Section {
                Button("Restore the starting list") {
                    let custom = feedState.sources.filter { $0.id.hasPrefix("custom-") }
                    feedState.sources = FeedSource.defaults + custom
                }
            }
        }
        .navigationTitle("Sources")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { EditButton() }
        .onDisappear { Task { await feedState.refresh() } }
    }

    private func add() async {
        isAdding = true
        message = nil
        defer { isAdding = false }
        do {
            let source = try await LocalFeedService().discoverSource(from: newAddress)
            if feedState.sources.contains(where: { $0.url == source.url }) {
                message = "\(source.name) is already in the list."
                return
            }
            feedState.sources.insert(source, at: 0)
            newAddress = ""
        } catch {
            message = error.localizedDescription
        }
    }
}
