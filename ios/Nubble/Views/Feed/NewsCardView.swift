import SwiftUI

struct NewsCardView: View {
    let article: NewsArticle
    let style: CardStyle
    let onTap: () -> Void
    let onSave: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    enum CardStyle {
        case featured
        case compact
    }

    var body: some View {
        Button(action: onTap) {
            Group {
                switch style {
                case .featured: featuredLayout
                case .compact: compactLayout
                }
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(NubbleColors.card(for: colorScheme))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(NubbleColors.border(for: colorScheme).opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .opacity(article.isRead ? 0.7 : 1.0)
        .overlay(alignment: .bottom) {
            // Reading progress indicator for partially-read articles
            if article.readProgress > 0 && article.readProgress < 1 {
                GeometryReader { geo in
                    Rectangle()
                        .fill(NubbleColors.primary(for: colorScheme).opacity(0.4))
                        .frame(width: geo.size.width * article.readProgress, height: 2)
                }
                .frame(height: 2)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .contextMenu {
            Button { onSave() } label: {
                Label(
                    article.isSaved ? "Unsave" : "Save for Later",
                    systemImage: article.isSaved ? "bookmark.fill" : "bookmark"
                )
            }

            if article.processingState == .failed {
                Button {
                    // Reset for retry
                    onTap()
                } label: {
                    Label("Retry", systemImage: "arrow.clockwise")
                }
            }

            ShareLink(item: article.articleUrl)
        }
    }

    // MARK: - Featured Layout

    private var featuredLayout: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Hero image
            if let imageUrl = article.imageUrl {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        Rectangle()
                            .fill(NubbleColors.border(for: colorScheme).opacity(0.2))
                    }
                }
                .frame(height: 180)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            // Title
            Text(article.title)
                .font(Typography.sectionTitle)
                .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                .lineLimit(3)
                .multilineTextAlignment(.leading)

            // Snippet (depth-0 preview)
            Text(article.snippet)
                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                .lineLimit(2)

            // Meta row
            metaRow
        }
    }

    // MARK: - Compact Layout

    private var compactLayout: some View {
        HStack(alignment: .top, spacing: 12) {
            // Thumbnail
            if let imageUrl = article.imageUrl {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    default:
                        Rectangle()
                            .fill(NubbleColors.border(for: colorScheme).opacity(0.2))
                    }
                }
                .frame(width: 72, height: 72)
                .clipShape(RoundedRectangle(cornerRadius: 6))
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(article.title)
                    .font(.custom("Satoshi-Medium", size: 14, relativeTo: .body))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                    .lineLimit(2)

                Text(article.snippet)
                    .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                    .foregroundStyle(NubbleColors.muted(for: colorScheme))
                    .lineLimit(1)

                metaRow
            }
        }
    }

    // MARK: - Meta Row

    private var metaRow: some View {
        HStack(spacing: 6) {
            Text(article.sourceName)
                .font(Typography.uiSmall)
                .foregroundStyle(NubbleColors.primary(for: colorScheme))

            Text("·")
            Text(article.publishedAt.timeAgo)
                .font(Typography.uiSmall)

            Text("·")
            Text("\(article.estimatedReadTime) min")
                .font(Typography.uiSmall)

            if article.isPaywalled {
                Text("PAYWALL")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 4)
                    .padding(.vertical, 1)
                    .background(
                        Capsule().fill(.orange.opacity(0.12))
                    )
            }

            Spacer()

            if article.processingState == .ready {
                DepthIndicator(depth: 0, size: .sm)
            } else if article.processingState == .failed {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 9))
                    .foregroundStyle(.red.opacity(0.6))
            } else if article.isSaved {
                Image(systemName: "bookmark.fill")
                    .font(.system(size: 9))
                    .foregroundStyle(NubbleColors.primary(for: colorScheme))
            }
        }
        .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.5))
    }
}

// MARK: - Date Extension

extension Date {
    var timeAgo: String {
        let interval = Date().timeIntervalSince(self)
        let minutes = Int(interval / 60)
        let hours = Int(interval / 3600)
        let days = Int(interval / 86400)

        if minutes < 1 { return "now" }
        if minutes < 60 { return "\(minutes)m" }
        if hours < 24 { return "\(hours)h" }
        if days < 7 { return "\(days)d" }
        return "\(days / 7)w"
    }
}
