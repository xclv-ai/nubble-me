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

                // Section counter during depth generation
                if pipeline.stage == .generatingDepths && pipeline.totalSections > 0 {
                    Text("\(pipeline.sectionsCompleted) / \(pipeline.totalSections) sections")
                        .font(.custom("Satoshi-Regular", size: 13, relativeTo: .caption))
                        .foregroundStyle(NubbleColors.muted(for: colorScheme))
                }

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
        case .extracting: "doc.text.magnifyingglass"
        case .chunking: "scissors"
        case .generatingDepths: "brain"
        case .done: "checkmark.circle"
        }
    }

    private func processArticle() async {
        feedState.processingQueue.insert(article.id)
        defer { feedState.processingQueue.remove(article.id) }

        do {
            let document = try await pipeline.convert(article: article, feedState: feedState)
            Haptics.medium()
            onComplete(document)
        } catch {
            feedState.setError(article.id, message: error.localizedDescription)
        }
    }
}
