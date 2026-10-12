import SwiftUI

struct ArticleProcessingView: View {
    let article: NewsArticle
    let feedState: FeedState
    let onComplete: (ContentDocument) -> Void

    @State private var pipeline = NewsConversionPipeline()
    @State private var hasStarted = false
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            NubbleColors.background(for: colorScheme)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Animated icon
                Image(systemName: stageIcon)
                    .font(.system(size: 48))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                    .symbolEffect(.pulse)
                    .contentTransition(.symbolEffect(.replace))

                // Stage label
                Text(pipeline.stage.rawValue)
                    .font(.custom("Satoshi-Medium", size: 16, relativeTo: .headline))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                    .contentTransition(.numericText())

                // Progress bar
                ProgressView(value: pipeline.progress)
                    .progressViewStyle(.linear)
                    .tint(NubbleColors.foreground(for: colorScheme))
                    .frame(maxWidth: 280)

                Text("Written on your iPhone by Apple Intelligence")
                    .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                    .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.6))

                // Article info
                VStack(spacing: 4) {
                    Text(article.title)
                        .font(.custom("Satoshi-Medium", size: 13, relativeTo: .caption))
                        .foregroundStyle(NubbleColors.muted(for: colorScheme))
                        .lineLimit(2)
                        .multilineTextAlignment(.center)

                    Text(article.sourceName)
                        .font(Typography.uiSmall)
                        .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.5))
                }
                .padding(.top, 8)

                Spacer()
            }
            .padding(40)
        }
        .navigationBarBackButtonHidden(pipeline.stage != .done)
        .task {
            guard !hasStarted else { return }
            hasStarted = true
            await processArticle()
        }
    }

    private var stageIcon: String {
        switch pipeline.stage {
        case .fetching: "globe"
        case .readingArticle: "doc.text.magnifyingglass"
        case .brief, .expanded: "brain"
        case .product: "scope"
        case .done: "checkmark.circle"
        }
    }

    private func processArticle() async {
        feedState.processingQueue.insert(article.id)
        defer { feedState.processingQueue.remove(article.id) }

        do {
            let document: ContentDocument
            if let existing = article.document, let product = feedState.product {
                // Levels 0-3 exist; only "My product" is out of date
                document = await pipeline.refreshProductLevel(article: article, document: existing, feedState: feedState, product: product)
            } else {
                document = try await pipeline.convert(article: article, feedState: feedState, product: feedState.product)
            }
            Haptics.medium()
            onComplete(document)
        } catch {
            feedState.setError(article.id, message: error.localizedDescription)
        }
    }
}
