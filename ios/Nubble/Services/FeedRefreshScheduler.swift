import BackgroundTasks
import Foundation
import UserNotifications

/// iPhone background work:
/// - refresh: reads the sources and ranks the stories (light, any time the system allows);
/// - process: while charging, Apple Intelligence writes all levels for the stories most relevant
///   to the product, then a notification says they're ready. On battery the system rations the
///   on-device model for background apps, so this job asks for power.
enum FeedRefreshScheduler {
    static let feedRefreshIdentifier = "me.nubble.feed.refresh"
    static let articleProcessIdentifier = "me.nubble.article.process"

    static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: feedRefreshIdentifier, using: nil) { task in
            guard let refreshTask = task as? BGAppRefreshTask else { return }
            handleFeedRefresh(refreshTask)
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: articleProcessIdentifier, using: nil) { task in
            guard let processingTask = task as? BGProcessingTask else { return }
            handleArticleProcessing(processingTask)
        }
    }

    static func scheduleFeedRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: feedRefreshIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    static func scheduleArticleProcessing() {
        let request = BGProcessingTaskRequest(identifier: articleProcessIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = true
        try? BGTaskScheduler.shared.submit(request)
    }

    // MARK: - Handlers

    private static func handleFeedRefresh(_ task: BGAppRefreshTask) {
        // BGTask isn't Sendable; the system calls it from one place and we only complete it once.
        nonisolated(unsafe) let task = task
        scheduleFeedRefresh()
        let work = Task { @MainActor in
            let state = FeedState()
            await state.loadFromDisk()
            await state.refresh()
            await FeedPersistence.shared.saveArticles(state.articles)
            task.setTaskCompleted(success: state.error == nil)
        }
        task.expirationHandler = { work.cancel() }
    }

    private static func handleArticleProcessing(_ task: BGProcessingTask) {
        // BGTask isn't Sendable; the system calls it from one place and we only complete it once.
        nonisolated(unsafe) let task = task
        scheduleArticleProcessing()
        let work = Task { @MainActor in
            let state = FeedState()
            await state.loadFromDisk()
            await state.refresh()

            let candidates = (state.product != nil ? state.mostRelevant : state.articles.filter(\.isSaved))
                .filter { $0.document == nil }

            let pipeline = NewsConversionPipeline()
            var written: [NewsArticle] = []
            for article in candidates {
                if Task.isCancelled { break }
                do {
                    _ = try await pipeline.convert(article: article, feedState: state, product: state.product, inBackground: true)
                    written.append(article)
                } catch {
                    // Rationed or declined: stop now, the next charging window continues
                    break
                }
            }
            await FeedPersistence.shared.saveArticles(state.articles)
            if !written.isEmpty { await notifyReady(written, product: state.product) }
            task.setTaskCompleted(success: true)
        }
        task.expirationHandler = { work.cancel() }
    }

    @MainActor
    private static func notifyReady(_ articles: [NewsArticle], product: ProductProfile?) async {
        let content = UNMutableNotificationContent()
        content.title = product.map { "\(articles.count) stories for \($0.name)" } ?? "\(articles.count) stories ready"
        content.body = articles.prefix(3).map { "• " + $0.title }.joined(separator: "\n")
        content.sound = .default
        let request = UNNotificationRequest(identifier: "nubble.ready.\(Date().timeIntervalSince1970)", content: content, trigger: nil)
        try? await UNUserNotificationCenter.current().add(request)
    }
}
