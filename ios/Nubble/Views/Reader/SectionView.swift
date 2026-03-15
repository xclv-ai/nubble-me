import SwiftUI

struct SectionView: View {
    let section: ContentSection
    let index: Int
    let total: Int
    let isActive: Bool
    let isFirst: Bool
    let hasSwipedOnce: Bool
    let onChangeDepth: (Int) -> Void
    let onResetToGlobal: () -> Void
    let onFirstSwipe: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    @State private var dragOffset: CGFloat = 0
    @State private var isDragging: Bool = false

    var depth: Int
    var globalDepth: Int
    var isOverridden: Bool

    private let swipeThreshold: CGFloat = 50
    private let velocityThreshold: CGFloat = 180

    private var depthStyle: Typography.DepthStyle {
        Typography.style(for: depth)
    }

    var body: some View {
        VStack(spacing: 0) {
            sectionContent
                .offset(x: dragOffset)
                .rotationEffect(.degrees(Double(dragOffset) / 200 * 1.5))
                .scaleEffect(1.0 - abs(dragOffset) / 200 * 0.015)
                .gesture(swipeGesture)

            // Divider
            if index < total - 1 {
                Rectangle()
                    .fill(NubbleColors.border(for: colorScheme).opacity(0.25))
                    .frame(height: 1)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 4)
            }
        }
    }

    private var sectionContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section meta row
            HStack {
                HStack(spacing: 8) {
                    Text(String(format: "%02d", index + 1))
                        .font(.custom("Satoshi-Bold", size: 10, relativeTo: .caption2))
                        .foregroundStyle(NubbleColors.primary(for: colorScheme).opacity(0.7))
                        .tracking(3)
                        .textCase(.uppercase)

                    if isOverridden {
                        HStack(spacing: 8) {
                            Rectangle()
                                .fill(NubbleColors.border(for: colorScheme).opacity(0.6))
                                .frame(width: 1, height: 10)

                            Text(DepthLevel(rawValue: depth)?.label ?? "")
                                .font(.custom("Satoshi-Medium", size: 9, relativeTo: .caption2))
                                .foregroundStyle(NubbleColors.primary(for: colorScheme).opacity(0.5))
                                .tracking(1.5)
                                .textCase(.uppercase)
                        }
                        .transition(.move(edge: .leading).combined(with: .opacity))
                    }
                }

                Spacer()

                // Per-section depth indicator + reset
                HStack(spacing: 6) {
                    if isOverridden {
                        Button {
                            onResetToGlobal()
                        } label: {
                            Text("reset")
                                .font(.custom("Satoshi-Regular", size: 9, relativeTo: .caption2))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.4))
                                .tracking(1.5)
                                .textCase(.uppercase)
                        }
                        .transition(.scale(scale: 0.8).combined(with: .opacity))
                    }

                    DepthIndicator(depth: depth, size: .sm)
                }
                .opacity(isOverridden || isActive ? 1 : 0)
                .animation(.easeOut(duration: 0.25), value: isActive)
                .animation(.easeOut(duration: 0.25), value: isOverridden)
            }
            .padding(.bottom, 10)

            // Title
            Text(section.title)
                .font(Typography.sectionTitle)
                .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                .lineSpacing(2)
                .padding(.bottom, 12)

            // Content body with depth-dependent styling
            contentBody

            // Swipe hints (after first swipe)
            if isActive && hasSwipedOnce {
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left.2")
                            .font(.system(size: 8))
                        Text("less")
                            .font(.custom("Satoshi-Regular", size: 9, relativeTo: .caption2))
                            .tracking(1.5)
                            .textCase(.uppercase)
                    }

                    Spacer()

                    HStack(spacing: 4) {
                        Text("more")
                            .font(.custom("Satoshi-Regular", size: 9, relativeTo: .caption2))
                            .tracking(1.5)
                            .textCase(.uppercase)
                        Image(systemName: "chevron.right.2")
                            .font(.system(size: 8))
                    }
                }
                .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.3))
                .padding(.top, 12)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(isActive
                    ? NubbleColors.card(for: colorScheme).opacity(0.6)
                    : Color.clear
                )
                .animation(.easeInOut(duration: 0.4), value: isActive)
        )
        .overlay {
            // Onboarding overlay on first section
            if isFirst && !hasSwipedOnce && isActive {
                SwipeOnboarding()
                    .transition(.scale(scale: 0.8).combined(with: .opacity))
            }
        }
        .animation(Springs.gentle, value: isOverridden)
    }

    @ViewBuilder
    private var contentBody: some View {
        let text = section.text(at: depth)
        let paragraphs = text.components(separatedBy: "\n\n")

        VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(paragraphs.enumerated()), id: \.offset) { pIndex, paragraph in
                Text(paragraph)
                    .font(depthStyle.font)
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme).opacity(depthStyle.opacity))
                    .lineSpacing(depthStyle.lineSpacing)
                    .fixedSize(horizontal: false, vertical: true)
                    .transition(.blurReplace.combined(with: .opacity))
            }
        }
        .id(depth) // Force view recreation on depth change
        .transition(.blurReplace.combined(with: .opacity))
        .animation(Springs.gentle, value: depth)
    }

    private var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 15)
            .onChanged { value in
                // Direction gating: only process horizontal movement
                guard abs(value.translation.width) > abs(value.translation.height) else { return }
                isDragging = true
                withAnimation(Springs.snappy) {
                    dragOffset = value.translation.width * 0.15
                }
            }
            .onEnded { value in
                let dx = value.translation.width
                let vx = value.predictedEndTranslation.width - value.translation.width

                if isDragging {
                    if dx > swipeThreshold || vx > velocityThreshold {
                        // Swipe right → more depth
                        onChangeDepth(1)
                        onFirstSwipe()
                    } else if dx < -swipeThreshold || vx < -velocityThreshold {
                        // Swipe left → less depth
                        onChangeDepth(-1)
                        onFirstSwipe()
                    }
                }

                isDragging = false
                withAnimation(Springs.snappy) {
                    dragOffset = 0
                }
            }
    }
}
