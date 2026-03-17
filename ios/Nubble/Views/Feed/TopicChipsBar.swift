import SwiftUI

struct TopicChipsBar: View {
    @Binding var selectedTopics: Set<String>
    let topics: [NewsTopic]
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // "All" chip
                TopicChip(
                    label: "All",
                    emoji: nil,
                    isSelected: selectedTopics.isEmpty
                ) {
                    selectedTopics.removeAll()
                    Haptics.light()
                }

                ForEach(topics.sorted(by: { $0.sortOrder < $1.sortOrder })) { topic in
                    TopicChip(
                        label: topic.label,
                        emoji: topic.emoji,
                        isSelected: selectedTopics.contains(topic.id)
                    ) {
                        if selectedTopics.contains(topic.id) {
                            selectedTopics.remove(topic.id)
                        } else {
                            selectedTopics.insert(topic.id)
                        }
                        Haptics.light()
                    }
                }
            }
            .padding(.horizontal, 16)
        }
        .frame(height: 36)
    }
}

// MARK: - Individual Chip

struct TopicChip: View {
    let label: String
    let emoji: String?
    let isSelected: Bool
    let onTap: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 4) {
                if let emoji {
                    Text(emoji)
                        .font(.system(size: 12))
                }
                Text(label)
                    .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                    .tracking(1)
                    .textCase(.uppercase)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                Capsule().fill(
                    isSelected
                        ? NubbleColors.primary(for: colorScheme).opacity(0.15)
                        : NubbleColors.card(for: colorScheme)
                )
            )
            .overlay(
                Capsule().stroke(
                    isSelected
                        ? NubbleColors.primary(for: colorScheme).opacity(0.3)
                        : NubbleColors.border(for: colorScheme).opacity(0.3),
                    lineWidth: 1
                )
            )
            .foregroundStyle(
                isSelected
                    ? NubbleColors.primary(for: colorScheme)
                    : NubbleColors.muted(for: colorScheme)
            )
        }
        .animation(Springs.snappy, value: isSelected)
    }
}
