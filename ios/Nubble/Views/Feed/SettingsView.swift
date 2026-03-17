import SwiftUI

struct SettingsView: View {
    @State private var feedState: FeedState
    @State private var showTopicManager = false
    @State private var refreshInterval: Int = 15
    @Environment(\.colorScheme) private var colorScheme

    init(feedState: FeedState = FeedState()) {
        _feedState = State(initialValue: feedState)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                NubbleColors.background(for: colorScheme)
                    .ignoresSafeArea()

                List {
                    // Feed settings
                    Section {
                        Button {
                            showTopicManager = true
                        } label: {
                            HStack {
                                Label("Manage Topics", systemImage: "tag")
                                    .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.4))
                            }
                        }
                        .foregroundStyle(NubbleColors.foreground(for: colorScheme))

                        HStack {
                            Label("Refresh Interval", systemImage: "arrow.clockwise")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                            Spacer()
                            Picker("", selection: $refreshInterval) {
                                Text("15 min").tag(15)
                                Text("30 min").tag(30)
                                Text("1 hour").tag(60)
                                Text("Manual").tag(0)
                            }
                            .pickerStyle(.menu)
                            .tint(NubbleColors.primary(for: colorScheme))
                        }
                    } header: {
                        sectionHeader("Feed")
                    }
                    .listRowBackground(NubbleColors.card(for: colorScheme))

                    // Reading settings
                    Section {
                        HStack {
                            Label("Default Depth", systemImage: "slider.horizontal.3")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                            Spacer()
                            Picker("", selection: .constant(2)) {
                                Text("Summary").tag(0)
                                Text("Condensed").tag(1)
                                Text("Standard").tag(2)
                                Text("Expanded").tag(3)
                            }
                            .pickerStyle(.menu)
                            .tint(NubbleColors.primary(for: colorScheme))
                        }

                        Toggle(isOn: .constant(true)) {
                            Label("Haptic Feedback", systemImage: "hand.tap")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                        }
                        .tint(NubbleColors.Light.primary)
                    } header: {
                        sectionHeader("Reading")
                    }
                    .listRowBackground(NubbleColors.card(for: colorScheme))

                    // AI settings
                    Section {
                        HStack {
                            Label("Depth Generation", systemImage: "brain")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                            Spacer()
                            Text("On-Device")
                                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                        }

                        HStack {
                            Label("Cloud Fallback", systemImage: "cloud")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                            Spacer()
                            Text("GPT-4o-mini")
                                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                        }
                    } header: {
                        sectionHeader("AI Processing")
                    } footer: {
                        Text("On-device AI requires iPhone 15 Pro or newer with Apple Intelligence enabled. Older devices use the cloud fallback.")
                            .font(.custom("Satoshi-Regular", size: 12, relativeTo: .caption))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.6))
                    }
                    .listRowBackground(NubbleColors.card(for: colorScheme))

                    // About
                    Section {
                        HStack {
                            Label("Version", systemImage: "info.circle")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                            Spacer()
                            Text("1.0.0")
                                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                        }

                        HStack {
                            Label("Feed Sources", systemImage: "antenna.radiowaves.left.and.right")
                                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
                            Spacer()
                            Text("12 active")
                                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme))
                        }
                    } header: {
                        sectionHeader("About")
                    }
                    .listRowBackground(NubbleColors.card(for: colorScheme))
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showTopicManager) {
                TopicManagerView(topics: $feedState.topics)
            }
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
            .foregroundStyle(NubbleColors.muted(for: colorScheme))
            .tracking(1.5)
            .textCase(.uppercase)
    }
}
