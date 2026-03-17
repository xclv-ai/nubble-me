import SwiftUI

@main
struct NubbleApp: App {
    @State private var currentDocument: ContentDocument = SampleContent.paradoxOfChoice
    @State private var showImport = false
    @Environment(\.scenePhase) private var scenePhase

    init() {
        FeedRefreshScheduler.register()
    }

    var body: some Scene {
        WindowGroup {
            TabView {
                Tab("Feed", systemImage: "newspaper") {
                    NewsFeedView()
                }

                Tab("Library", systemImage: "books.vertical") {
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

                Tab("Settings", systemImage: "gearshape") {
                    SettingsView()
                }
            }
            .tint(NubbleColors.Light.primary)
            .onChange(of: scenePhase) { _, newPhase in
                if newPhase == .background {
                    FeedRefreshScheduler.scheduleFeedRefresh()
                    FeedRefreshScheduler.scheduleArticleProcessing()
                }
            }
        }
    }
}
