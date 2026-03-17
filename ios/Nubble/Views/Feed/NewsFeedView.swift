import SwiftUI

struct NewsFeedView: View {
    @State private var feedState = FeedState()
    @State private var feedService = FeedService()
    @State private var selectedArticle: NewsArticle?
    @State private var processingArticle: NewsArticle?
    @Namespace private var namespace
    @Environment(\.colorScheme) private var colorScheme

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
            .task {
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
                    ForEach(feedState.filteredArticles.dropFirst()) { article in
                        NewsCardView(
                            article: article,
                            style: .compact,
                            onTap: { tapArticle(article) },
                            onSave: { feedState.toggleSaved(article.id) }
                        )
                        .matchedTransitionSource(id: article.id, in: namespace)
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
        do {
            let topics = try await feedService.fetchTopics()
            feedState.topics = topics

            let (articles, lastRefreshed) = try await feedService.fetchFeed()
            feedState.articles = articles
            feedState.lastRefreshedAt = lastRefreshed
        } catch {
            feedState.error = error.localizedDescription
        }
        feedState.isRefreshing = false
    }

    private func refreshFeed() async {
        feedState.isRefreshing = true
        do {
            try await feedService.triggerRefresh()
            let (articles, lastRefreshed) = try await feedService.fetchFeed()
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
        } catch {
            feedState.error = error.localizedDescription
        }
        feedState.isRefreshing = false
    }
}
