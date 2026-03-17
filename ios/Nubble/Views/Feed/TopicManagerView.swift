import SwiftUI

struct TopicManagerView: View {
    @Binding var topics: [NewsTopic]
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                NubbleColors.background(for: colorScheme)
                    .ignoresSafeArea()

                List {
                    Section {
                        ForEach($topics) { $topic in
                            topicRow(topic: $topic)
                        }
                        .onMove { from, to in
                            topics.move(fromOffsets: from, toOffset: to)
                            // Re-assign sort orders
                            for (index, _) in topics.enumerated() {
                                topics[index].sortOrder = index
                            }
                        }
                    } header: {
                        Text("Topics")
                            .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme))
                            .tracking(1.5)
                            .textCase(.uppercase)
                    } footer: {
                        Text("Enabled topics appear as filter chips in the feed. Drag to reorder.")
                            .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.6))
                    }

                    Section {
                        customFeedRow
                    } header: {
                        Text("Custom Sources")
                            .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme))
                            .tracking(1.5)
                            .textCase(.uppercase)
                    } footer: {
                        Text("Add your own RSS feed URLs for custom news sources.")
                            .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.6))
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Manage Topics")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .font(.custom("Satoshi-Medium", size: 15, relativeTo: .body))
                }
                ToolbarItem(placement: .topBarLeading) {
                    EditButton()
                        .font(.custom("Satoshi-Regular", size: 15, relativeTo: .body))
                }
            }
        }
    }

    // MARK: - Topic Row

    private func topicRow(topic: Binding<NewsTopic>) -> some View {
        HStack(spacing: 12) {
            Text(topic.wrappedValue.emoji)
                .font(.system(size: 20))

            VStack(alignment: .leading, spacing: 2) {
                Text(topic.wrappedValue.label)
                    .font(.custom("Satoshi-Medium", size: 14, relativeTo: .body))
                    .foregroundStyle(NubbleColors.foreground(for: colorScheme))

                Text(topic.wrappedValue.id)
                    .font(.custom("Satoshi-Regular", size: 11, relativeTo: .caption))
                    .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.5))
            }

            Spacer()

            Toggle("", isOn: topic.isEnabled)
                .labelsHidden()
                .tint(NubbleColors.Light.primary)
        }
        .padding(.vertical, 2)
        .listRowBackground(NubbleColors.card(for: colorScheme))
    }

    // MARK: - Custom Feed

    @State private var customFeedUrl = ""
    @State private var isAddingFeed = false

    private var customFeedRow: some View {
        HStack {
            Image(systemName: "plus.circle")
                .foregroundStyle(NubbleColors.primary(for: colorScheme))
            Text("Add RSS Feed")
                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                .foregroundStyle(NubbleColors.primary(for: colorScheme))
        }
        .listRowBackground(NubbleColors.card(for: colorScheme))
        .onTapGesture {
            isAddingFeed = true
        }
        .alert("Add RSS Feed", isPresented: $isAddingFeed) {
            TextField("https://example.com/feed.xml", text: $customFeedUrl)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            Button("Add") {
                // Future: validate and add feed
                customFeedUrl = ""
            }
            Button("Cancel", role: .cancel) {
                customFeedUrl = ""
            }
        } message: {
            Text("Enter the URL of an RSS or Atom feed.")
        }
    }
}
