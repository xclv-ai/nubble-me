import SwiftUI

struct NewsFeedView: View {
    @State private var feedState = FeedState()
    @State private var feedService = FeedService()
    @State private var selectedArticle: NewsArticle?
    @State private var processingArticle: NewsArticle?
    @State private var showSaved = false
    @State private var showTopicManager = false
    @State private var isLoadingMore = false
    @State private var hasMorePages = true
    @Namespace private var namespace
    @Environment(\.colorScheme) private var colorScheme

    private let pageSize = 50

    var body: some View {
        NavigationStack {
            ZStack {
                NubbleColors.background(for: colorScheme)
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    feedHeader
                    topicChips
                    articleList
                }

                // Floating processing indicator
                if !feedState.processingQueue.isEmpty {
                    VStack {
                        Spacer()
                        processingBanner
                            .padding(.bottom, 8)
                    }
                }
            }
            .navigationDestination(item: $selectedArticle) { article in
                if let doc = article.document {
                    NubbleReaderView(document: doc)
                } else {
                    ArticleProcessingView(article: article, feedState: feedState) { document in
                        selectedArticle = nil
                        // Brief delay then navigate to the reader
                        Task { @MainActor in
                            try? await Task.sleep(for: .milliseconds(300))
                            if let idx = feedState.articles.firstIndex(where: { $0.id == article.id }) {
                                selectedArticle = feedState.articles[idx]
                            }
                        }
                    }
                }
            }
            .navigationDestination(isPresented: $showSaved) {
                SavedArticlesView(feedState: feedState) { article in
                    showSaved = false
                    tapArticle(article)
                }
            }
            .sheet(isPresented: $showTopicManager) {
                TopicManagerView(topics: $feedState.topics)
            }
            .task {
                await feedState.loadFromDisk()
                await loadFeed()
            }
        }
    }

    // MARK: - Header

    private var feedHeader: some View {
        HStack {
            HStack(spacing: 10) {
                NubbleLogo()
                Text("nubble")
                    .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                    .foregroundStyle(NubbleColors.muted(for: colorScheme))
                    .tracking(2.5)
                    .textCase(.uppercase)
            }

            Spacer()

            HStack(spacing: 14) {
                // Saved articles
                let savedCount = feedState.articles.filter { $0.isSaved }.count
                Button { showSaved = true } label: {
                    Image(systemName: savedCount > 0 ? "bookmark.fill" : "bookmark")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.6))
                }

                // Topic manager
                Button { showTopicManager = true } label: {
                    Image(systemName: "line.3.horizontal.decrease")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.6))
                }

                // Unread badge
                if feedState.unreadCount > 0 {
                    Text("\(feedState.unreadCount)")
                        .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                        .foregroundStyle(NubbleColors.primary(for: colorScheme))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(
                            Capsule().fill(NubbleColors.primary(for: colorScheme).opacity(0.12))
                        )
                }
            }
        }
        .padding(.horizontal, 20)
        .frame(height: 48)
    }

    // MARK: - Topic Chips

    private var topicChips: some View {
        TopicChipsBar(
            selectedTopics: $feedState.selectedTopics,
            topics: feedState.topics
        )
        .padding(.bottom, 12)
    }

    // MARK: - Article List

    private var articleList: some View {
        ScrollView(.vertical) {
            LazyVStack(spacing: 12) {
                if feedState.isRefreshing && feedState.articles.isEmpty {
                    loadingState
                } else if feedState.articles.isEmpty {
                    emptyState
                } else {
                    // Last refreshed indicator
                    if let lastRefreshed = feedState.lastRefreshedAt {
                        HStack {
                            Spacer()
                            Text("Updated \(lastRefreshed.timeAgo) ago")
                                .font(.custom("Satoshi-Regular", size: 10, relativeTo: .caption2))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.4))
                            Spacer()
                        }
                        .padding(.bottom, 4)
                    }

                    // Featured card (first article)
                    if let featured = feedState.filteredArticles.first {
                        NewsCardView(
                            article: featured,
                            style: .featured,
                            onTap: { tapArticle(featured) },
                            onSave: { feedState.toggleSaved(featured.id) }
                        )
                        .matchedTransitionSource(id: featured.id, in: namespace)
                    }

                    // Remaining articles as compact cards
                    let remaining = Array(feedState.filteredArticles.dropFirst())
                    ForEach(remaining) { article in
                        NewsCardView(
                            article: article,
                            style: .compact,
                            onTap: { tapArticle(article) },
                            onSave: { feedState.toggleSaved(article.id) }
                        )
                        .matchedTransitionSource(id: article.id, in: namespace)
                        .onAppear {
                            // Infinite scroll: load more when near the end
                            if article.id == remaining.last?.id {
                                Task { await loadMoreIfNeeded() }
                            }
                        }
                    }

                    // Loading more indicator
                    if isLoadingMore {
                        HStack {
                            Spacer()
                            ProgressView()
                                .controlSize(.small)
                                .tint(NubbleColors.muted(for: colorScheme))
                            Spacer()
                        }
                        .padding(.vertical, 12)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 96)
        }
        .refreshable {
            await refreshFeed()
        }
    }

    // MARK: - States

    private var loadingState: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 80)
            ProgressView()
                .tint(NubbleColors.muted(for: colorScheme))
            Text("Loading AI news...")
                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                .foregroundStyle(NubbleColors.muted(for: colorScheme))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 80)
            Image(systemName: "newspaper")
                .font(.system(size: 40, weight: .light))
                .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.4))

            Text("No articles yet")
                .font(Typography.sectionTitle)
                .foregroundStyle(NubbleColors.foreground(for: colorScheme))

            Text("Pull down to refresh the feed")
                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                .foregroundStyle(NubbleColors.muted(for: colorScheme))

            if let error = feedState.error {
                Text(error)
                    .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                    .foregroundStyle(.red.opacity(0.7))
                    .padding(.top, 8)
            }
        }
    }

    private var processingBanner: some View {
        HStack(spacing: 8) {
            ProgressView()
                .controlSize(.small)
                .tint(NubbleColors.foreground(for: colorScheme))
            Text("Processing \(feedState.processingQueue.count) article\(feedState.processingQueue.count == 1 ? "" : "s")...")
                .font(.custom("Satoshi-Medium", size: 12, relativeTo: .caption))
                .foregroundStyle(NubbleColors.foreground(for: colorScheme))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            Capsule()
                .fill(NubbleColors.card(for: colorScheme))
                .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
        )
    }

    // MARK: - Actions

    private func tapArticle(_ article: NewsArticle) {
        feedState.markAsRead(article.id)
        Haptics.light()
        selectedArticle = article
    }

    private func loadFeed() async {
        feedState.isRefreshing = true
        hasMorePages = true
        do {
            let topics = try await feedService.fetchTopics()
            feedState.topics = topics

            let (articles, lastRefreshed) = try await feedService.fetchFeed(limit: pageSize, offset: 0)
            // Merge with cached state (saved, read, documents)
            let existingById = Dictionary(uniqueKeysWithValues: feedState.articles.map { ($0.id, $0) })
            feedState.articles = articles.map { article in
                var merged = article
                if let existing = existingById[article.id] {
                    merged.isSaved = existing.isSaved
                    merged.isRead = existing.isRead
                    merged.readProgress = existing.readProgress
                    merged.document = existing.document
                    merged.processingState = existing.processingState
                }
                return merged
            }
            feedState.lastRefreshedAt = lastRefreshed
            hasMorePages = articles.count >= pageSize
        } catch {
            feedState.error = error.localizedDescription
        }
        feedState.isRefreshing = false
    }

    private func loadMoreIfNeeded() async {
        guard !isLoadingMore, hasMorePages, !feedState.isRefreshing else { return }
        isLoadingMore = true
        do {
            let offset = feedState.articles.count
            let (newArticles, _) = try await feedService.fetchFeed(limit: pageSize, offset: offset)
            if newArticles.isEmpty {
                hasMorePages = false
            } else {
                let existingIds = Set(feedState.articles.map(\.id))
                let unique = newArticles.filter { !existingIds.contains($0.id) }
                feedState.articles.append(contentsOf: unique)
                hasMorePages = newArticles.count >= pageSize
            }
        } catch {
            // Silently fail on pagination — user can still pull-to-refresh
        }
        isLoadingMore = false
    }

    private func refreshFeed() async {
        feedState.isRefreshing = true
        do {
            try await feedService.triggerRefresh()
            let (articles, lastRefreshed) = try await feedService.fetchFeed(limit: pageSize, offset: 0)
            // Merge: keep processing state and saved status of existing articles
            let existingById = Dictionary(uniqueKeysWithValues: feedState.articles.map { ($0.id, $0) })
            feedState.articles = articles.map { article in
                var merged = article
                if let existing = existingById[article.id] {
                    merged.isSaved = existing.isSaved
                    merged.isRead = existing.isRead
                    merged.readProgress = existing.readProgress
                    merged.document = existing.document
                    merged.processingState = existing.processingState
                }
                return merged
            }
            feedState.lastRefreshedAt = lastRefreshed
            feedState.error = nil
            hasMorePages = articles.count >= pageSize
        } catch {
            feedState.error = error.localizedDescription
        }
        feedState.isRefreshing = false
    }
}
