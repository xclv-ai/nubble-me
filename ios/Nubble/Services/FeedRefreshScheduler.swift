import BackgroundTasks
import Foundation

enum FeedRefreshScheduler {
    static let feedRefreshIdentifier = "me.nubble.feed.refresh"
    static let articleProcessIdentifier = "me.nubble.article.process"

    static func register() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: feedRefreshIdentifier,
            using: nil
        ) { task in
            guard let refreshTask = task as? BGAppRefreshTask else { return }
            handleFeedRefresh(refreshTask)
        }

        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: articleProcessIdentifier,
            using: nil
        ) { task in
            guard let processingTask = task as? BGProcessingTask else { return }
            handleArticleProcessing(processingTask)
        }
    }

    static func scheduleFeedRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: feedRefreshIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    static func scheduleArticleProcessing() {
        let request = BGProcessingTaskRequest(identifier: articleProcessIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        try? BGTaskScheduler.shared.submit(request)
    }

    // MARK: - Handlers

    private static func handleFeedRefresh(_ task: BGAppRefreshTask) {
        // Schedule next refresh
        scheduleFeedRefresh()

        let fetchTask = Task {
            do {
                let service = FeedService()
                try await service.triggerRefresh()

                // Fetch latest articles and persist them
                let (articles, _) = try await service.fetchFeed()
                await FeedPersistence.shared.saveArticles(articles)

                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }

        task.expirationHandler = {
            fetchTask.cancel()
        }
    }

    private static func handleArticleProcessing(_ task: BGProcessingTask) {
        // Schedule next processing run
        scheduleArticleProcessing()

        let processingTask = Task { @MainActor in
            let persistence = FeedPersistence.shared
            let articles = await persistence.loadArticles()

            // Pre-process top 5 saved articles that don't have documents yet
            let candidates = articles
                .filter { $0.isSaved && $0.document == nil && $0.processingState != .failed }
                .prefix(5)

            guard !candidates.isEmpty else {
                task.setTaskCompleted(success: true)
                return
            }

            let pipeline = NewsConversionPipeline()
            let feedState = FeedState()
            feedState.articles = articles

            for article in candidates {
                guard !Task.isCancelled else { break }
                do {
                    let document = try await pipeline.convert(article: article, feedState: feedState)
                    await persistence.saveDocument(articleId: article.id, document: document)
                } catch {
                    // Skip failed articles, continue with next
                    continue
                }
            }

            // Persist updated article states
            await persistence.saveArticles(feedState.articles)
            task.setTaskCompleted(success: true)
        }

        task.expirationHandler = {
            processingTask.cancel()
        }
    }
}
