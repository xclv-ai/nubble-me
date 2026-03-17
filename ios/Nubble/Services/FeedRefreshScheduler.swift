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

        // Background article pre-processing would go here
        // For now, mark as complete
        task.setTaskCompleted(success: true)
    }
}
