import SwiftUI

/// The product tab (e.g. "pokpok.ai"): only the stories that matter to the user's product,
/// each opening on the "My product" level — how relevant, how it applies, impact, what to do.
struct ProductNewsView: View {
    @Environment(FeedState.self) private var feedState
    @Environment(\.colorScheme) private var colorScheme
    @State private var selected: NewsArticle?
    @State private var showProduct = false

    /// High first, then medium; newest first within each.
    private var stories: [NewsArticle] {
        feedState.articles
            .filter { ($0.relevance ?? 0) >= 0.5 }
            .sorted { a, b in
                if a.relevance != b.relevance { return (a.relevance ?? 0) > (b.relevance ?? 0) }
                return a.publishedAt > b.publishedAt
            }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                NubbleColors.background(for: colorScheme).ignoresSafeArea()
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        header
                        if feedState.product == nil {
                            addProduct
                        } else if stories.isEmpty {
                            Text(feedState.isRanking || feedState.isRefreshing
                                 ? "Apple Intelligence is reading today's stories for \(feedState.product?.name ?? "")…"
                                 : "No stories that matter to \(feedState.product?.name ?? "your product") yet. Pull to refresh.")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                                .padding(.top, 40)
                        } else {
                            ForEach(stories) { article in
                                VStack(alignment: .leading, spacing: 6) {
                                    relevanceBadge(article.relevance ?? 0)
                                    NewsCardView(
                                        article: article,
                                        style: .compact,
                                        onTap: { feedState.markAsRead(article.id); selected = article },
                                        onSave: { feedState.toggleSaved(article.id) }
                                    )
                                    signalView(article)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 96)
                }
                .refreshable { await feedState.refresh() }
            }
            .preferredColorScheme(.dark)
            .navigationDestination(item: $selected) { article in
                if let doc = article.document, doc.productStamp == feedState.product?.updatedAt {
                    NubbleReaderView(document: doc, initialDepth: 4)
                } else {
                    ArticleProcessingView(article: article, feedState: feedState) { _ in
                        selected = nil
                        Task { @MainActor in
                            try? await Task.sleep(for: .milliseconds(300))
                            selected = feedState.articles.first { $0.id == article.id }
                        }
                    }
                }
            }
            .sheet(isPresented: $showProduct) { NavigationStack { ProductView() } }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(feedState.product?.name ?? "My product")
                .font(Typography.documentTitle)
                .foregroundStyle(NubbleColors.foreground(for: colorScheme))
            Text("News that matters to your product — each story opens on how it applies, its impact and what to do.")
                .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                .foregroundStyle(NubbleColors.muted(for: colorScheme))
        }
        .padding(.top, 16)
        .padding(.bottom, 8)
    }

    /// The signal under the headline: why it matters and the first thing to do.
    @ViewBuilder
    private func signalView(_ article: NewsArticle) -> some View {
        if let signal = Signal(article.document), article.document?.productStamp == feedState.product?.updatedAt {
            VStack(alignment: .leading, spacing: 6) {
                Text(signal.relevance)
                    .font(.custom("Satoshi-Regular", size: 17, relativeTo: .body))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme).opacity(0.85))
                if !signal.firstMove.isEmpty {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Image(systemName: "arrow.forward.circle.fill")
                            .foregroundStyle(Color(red: 1.0, green: 0.55, blue: 0.2))
                        Text(signal.firstMove)
                            .font(.custom("Satoshi-Medium", size: 17, relativeTo: .body))
                            .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 4)
        } else if feedState.writingSignalFor == article.id {
            HStack(spacing: 6) {
                ProgressView().controlSize(.mini)
                Text("Apple Intelligence is writing what this means for \(feedState.product?.name ?? "you")…")
                    .font(.custom("Satoshi-Regular", size: 11, relativeTo: .caption2))
                    .foregroundStyle(NubbleColors.muted(for: colorScheme))
            }
            .padding(.horizontal, 12)
        }
    }

    private func relevanceBadge(_ value: Double) -> some View {
        Text(value >= 1 ? "HIGH RELEVANCE" : "MEDIUM RELEVANCE")
            .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
            .tracking(1.5)
            .foregroundStyle(value >= 1 ? Color(red: 1.0, green: 0.55, blue: 0.2) : NubbleColors.muted(for: colorScheme))
            .padding(.leading, 4)
    }

    private var addProduct: some View {
        Button { showProduct = true } label: {
            Label("Add your product's web address", systemImage: "scope")
                .font(.custom("Satoshi-Medium", size: 15, relativeTo: .body))
                .padding(16)
                .frame(maxWidth: .infinity)
                .background(RoundedRectangle(cornerRadius: 12).fill(NubbleColors.primary(for: colorScheme).opacity(0.12)))
        }
        .buttonStyle(.plain)
        .padding(.top, 24)
    }
}
