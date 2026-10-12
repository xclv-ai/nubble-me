import SwiftUI

struct NewsFeedView: View {
    @Environment(FeedState.self) private var feedState
    @State private var selectedArticle: NewsArticle?
    @State private var processingArticle: NewsArticle?
    @State private var showSaved = false
    @State private var showTopicManager = false
    @State private var showProduct = false
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
                if let doc = article.document, !isProductLevelStale(doc) {
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
                TopicManagerView(topics: Bindable(feedState).topics)
            }
            .sheet(isPresented: $showProduct) {
                NavigationStack { ProductView() }
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
            selectedTopics: Bindable(feedState).selectedTopics,
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

                    if feedState.product == nil {
                        productPrompt
                    }

                    if let error = feedState.error {
                        Text(error)
                            .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                            .foregroundStyle(.red.opacity(0.7))
                    }

                    if let product = feedState.product, !feedState.mostRelevant.isEmpty {
                        listHeader("Most relevant to \(product.name)")
                        ForEach(Array(feedState.mostRelevant.enumerated()), id: \.element.id) { index, article in
                            NewsCardView(
                                article: article,
                                style: index == 0 ? .featured : .compact,
                                onTap: { tapArticle(article) },
                                onSave: { feedState.toggleSaved(article.id) }
                            )
                            .matchedTransitionSource(id: article.id, in: namespace)
                        }
                        listHeader("Latest")
                    }

                    let latest = feedState.latest
                    ForEach(Array(latest.enumerated()), id: \.element.id) { index, article in
                        NewsCardView(
                            article: article,
                            style: index == 0 && feedState.mostRelevant.isEmpty ? .featured : .compact,
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
            await feedState.refresh()
        }
    }

    // MARK: - States

    private var loadingState: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 80)
            ProgressView()
                .tint(NubbleColors.muted(for: colorScheme))
            Text("Reading your news sources…")
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

    /// The story was written for an older product description (or before a product was set).
    private func isProductLevelStale(_ doc: ContentDocument) -> Bool {
        guard let product = feedState.product else { return false }
        return doc.productStamp != product.updatedAt
    }

    private var productPrompt: some View {
        Button { showProduct = true } label: {
            HStack(spacing: 12) {
                Image(systemName: "scope")
                    .font(.system(size: 18))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Add your product")
                        .font(.custom("Satoshi-Medium", size: 14, relativeTo: .body))
                    Text("Paste its web address. Stories get ranked by relevance and each one explains how it hits your product.")
                        .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                        .foregroundStyle(NubbleColors.muted(for: colorScheme))
                        .multilineTextAlignment(.leading)
                }
                Spacer()
            }
            .foregroundStyle(NubbleColors.foreground(for: colorScheme))
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 12).fill(NubbleColors.primary(for: colorScheme).opacity(0.08)))
        }
        .buttonStyle(.plain)
    }

    private func listHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                .tracking(1.5)
                .textCase(.uppercase)
            Spacer()
        }
        .padding(.top, 8)
    }
}
