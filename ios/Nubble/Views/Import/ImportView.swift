import SwiftUI
import UniformTypeIdentifiers

// MARK: - ImportSheet (used from NubbleApp as a .sheet)

struct ImportSheet: View {
    let onDocumentImported: (ContentDocument) -> Void
    @State private var showFilePicker = false
    @State private var pipeline = ConversionPipeline()
    @State private var isConverting = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        NavigationStack {
            Group {
                if isConverting {
                    conversionProgress
                } else {
                    importScreen
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .font(.custom("Satoshi-Regular", size: 15, relativeTo: .body))
                }
            }
        }
    }

    // MARK: - Import Screen

    private var importScreen: some View {
        ZStack {
            NubbleColors.background(for: colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                // Icon
                Image(systemName: "doc.badge.plus")
                    .font(.system(size: 48, weight: .light))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme).opacity(0.6))

                // Tagline
                VStack(spacing: 8) {
                    Text("Import a book or document")
                        .font(Typography.sectionTitle)
                        .foregroundStyle(NubbleColors.foreground(for: colorScheme))

                    Text("ePub and PDF files become\nmulti-depth reading experiences")
                        .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                        .foregroundStyle(NubbleColors.muted(for: colorScheme))
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 32)

                // Import button
                Button {
                    showFilePicker = true
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "folder")
                        Text("Choose File")
                    }
                    .font(.custom("Satoshi-Medium", size: 16, relativeTo: .body))
                    .foregroundStyle(NubbleColors.background(for: colorScheme))
                    .padding(.horizontal, 32)
                    .padding(.vertical, 14)
                    .background(NubbleColors.foreground(for: colorScheme))
                    .clipShape(Capsule())
                }

                // Error message
                if let errorMessage {
                    Text(errorMessage)
                        .font(.custom("Satoshi-Regular", size: 13, relativeTo: .caption))
                        .foregroundStyle(.red.opacity(0.8))
                        .padding(.horizontal, 32)
                        .multilineTextAlignment(.center)
                }

                Spacer()
            }
        }
        .fileImporter(
            isPresented: $showFilePicker,
            allowedContentTypes: [.pdf, .epub],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                importFile(url)
            case .failure(let error):
                errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - Conversion Progress

    private var conversionProgress: some View {
        ZStack {
            NubbleColors.background(for: colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "book.pages")
                    .font(.system(size: 48))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                    .symbolEffect(.pulse)

                Text(pipeline.stage.rawValue)
                    .font(.custom("Satoshi-Medium", size: 16, relativeTo: .headline))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme))

                ProgressView(value: pipeline.progress)
                    .progressViewStyle(.linear)
                    .tint(NubbleColors.foreground(for: colorScheme))
                    .frame(maxWidth: 280)

                if pipeline.stage == .generatingDepths && pipeline.totalSections > 0 {
                    Text("\(pipeline.sectionsCompleted) / \(pipeline.totalSections) sections")
                        .font(.custom("Satoshi-Regular", size: 13, relativeTo: .caption))
                        .foregroundStyle(NubbleColors.muted(for: colorScheme))
                }

                Spacer()
            }
            .padding(40)
        }
    }

    // MARK: - Import Logic

    private func importFile(_ url: URL) {
        errorMessage = nil
        isConverting = true

        Task {
            do {
                let accessing = url.startAccessingSecurityScopedResource()
                defer { if accessing { url.stopAccessingSecurityScopedResource() } }

                let doc = try await pipeline.convert(fileURL: url)
                onDocumentImported(doc)
            } catch {
                errorMessage = error.localizedDescription
                isConverting = false
            }
        }
    }
}
