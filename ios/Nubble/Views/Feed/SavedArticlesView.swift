import SwiftUI

struct SavedArticlesView: View {
    let feedState: FeedState
    let onArticleTap: (NewsArticle) -> Void
    @Environment(\.colorScheme) private var colorScheme

    private var savedArticles: [NewsArticle] {
        feedState.articles.filter { $0.isSaved }
    }

    var body: some View {
        ZStack {
            NubbleColors.background(for: colorScheme)
                .ignoresSafeArea()

            if savedArticles.isEmpty {
                emptyState
            } else {
                ScrollView(.vertical) {
                    LazyVStack(spacing: 12) {
                        ForEach(savedArticles) { article in
                            NewsCardView(
                                article: article,
                                style: .compact,
                                onTap: { onArticleTap(article) },
                                onSave: { feedState.toggleSaved(article.id) }
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 16)
                }
            }
        }
        .navigationTitle("Saved")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "bookmark")
                .font(.system(size: 36, weight: .light))
                .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.4))

            Text("No saved articles")
                .font(Typography.sectionTitle)
                .foregroundStyle(NubbleColors.foreground(for: colorScheme))

            Text("Long-press any article card and tap\n\"Save for Later\" to save it here.")
                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                .multilineTextAlignment(.center)
        }
    }
}
