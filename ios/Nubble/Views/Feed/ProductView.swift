import SwiftUI
import UserNotifications

/// "My product": the user gives a web address, the iPhone reads the page and Apple Intelligence
/// writes the description that every "My product" level uses. The user can edit it.
struct ProductView: View {
    @Environment(FeedState.self) private var feedState
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    @State private var address = ""
    @State private var name = ""
    @State private var description = ""
    @State private var readUrl: URL?
    @State private var isReading = false
    @State private var message: String?

    var body: some View {
        Form {
            Section {
                TextField("yourproduct.com", text: $address)
                    .keyboardType(.URL)
                    .textContentType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .onSubmit { Task { await readPage() } }
                Button {
                    Task { await readPage() }
                } label: {
                    HStack {
                        Text(isReading ? "Reading the page…" : "Read my product page")
                        if isReading { Spacer(); ProgressView() }
                    }
                }
                .disabled(address.trimmingCharacters(in: .whitespaces).isEmpty || isReading)
            } header: {
                Text("Product web address")
            } footer: {
                Text("Your iPhone opens the page and Apple Intelligence describes the product on the phone — nothing is sent to any AI service.")
            }

            if let message {
                Section { Text(message).foregroundStyle(.red) }
            }

            if !description.isEmpty || feedState.product != nil {
                Section {
                    TextField("Name", text: $name)
                    TextEditor(text: $description)
                        .frame(minHeight: 180)
                } header: {
                    Text("What every story is compared with")
                } footer: {
                    Text("Edit freely: add your customers, prices, competitors. The \"My product\" level and the ranking read exactly this text.")
                }

                Section {
                    Button("Save") { save() }
                        .disabled(name.isEmpty || description.isEmpty)
                    if feedState.product != nil {
                        Button("Remove product", role: .destructive) {
                            feedState.product = nil
                            dismiss()
                        }
                    }
                }
            }
        }
        .navigationTitle("My product")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
        }
        .onAppear {
            if let p = feedState.product {
                address = p.url.absoluteString
                name = p.name
                description = p.description
                readUrl = p.url
            }
        }
    }

    private func readPage() async {
        var text = address.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.lowercased().hasPrefix("http") { text = "https://" + text }
        guard let url = URL(string: text) else { message = "That isn't a web address."; return }
        isReading = true
        message = nil
        defer { isReading = false }
        do {
            let page = try await PageReader().text(of: url)
            let brief = try await NewsDepthWriter().describeProduct(url: page.finalUrl, pageText: page.text)
            readUrl = page.finalUrl
            name = brief.name
            description = brief.description
        } catch {
            message = error.localizedDescription
        }
    }

    private func save() {
        let url = readUrl ?? URL(string: address) ?? URL(string: "https://example.com")!
        feedState.product = ProductProfile(url: url, name: name, description: description, updatedAt: Date())
        // Ask once, so the iPhone can say when the stories most relevant to the product are ready
        Task { _ = try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) }
        FeedRefreshScheduler.scheduleArticleProcessing()
        dismiss()
    }
}
