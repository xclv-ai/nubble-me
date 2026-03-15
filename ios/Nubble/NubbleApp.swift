import SwiftUI

@main
struct NubbleApp: App {
    @State private var currentDocument: ContentDocument = SampleContent.paradoxOfChoice
    @State private var showImport = false

    var body: some Scene {
        WindowGroup {
            NubbleReaderView(
                document: currentDocument,
                onImportTapped: { showImport = true }
            )
            .sheet(isPresented: $showImport) {
                ImportSheet { document in
                    currentDocument = document
                    showImport = false
                }
            }
        }
    }
}
