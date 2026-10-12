import SwiftUI

@main
struct NubbleApp: App {
    @State private var currentDocument: ContentDocument = SampleContent.paradoxOfChoice
    @State private var showImport = false
    @State private var feedState = FeedState()
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
            .environment(feedState)
            .tint(NubbleColors.Light.primary)
            .task {
                await feedState.loadFromDisk()
                await SharedInbox.drain(into: feedState)
                await feedState.refresh()
            }
            .onChange(of: scenePhase) { _, newPhase in
                switch newPhase {
                case .background:
                    FeedRefreshScheduler.scheduleFeedRefresh()
                    FeedRefreshScheduler.scheduleArticleProcessing()
                case .active:
                    Task { await SharedInbox.drain(into: feedState) }
                default:
                    break
                }
            }
        }
    }
}
