import SwiftUI

struct SettingsView: View {
    @Environment(FeedState.self) private var feedState
    @State private var showTopicManager = false
    @State private var showProduct = false
    @Environment(\.colorScheme) private var colorScheme

    private var version: String {
        let v = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""
        let b = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? ""
        return "\(v) (\(b))"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                NubbleColors.background(for: colorScheme)
                    .ignoresSafeArea()

                List {
                    Section {
                        Button { showProduct = true } label: {
                            row("My product", icon: "scope", value: feedState.product?.name ?? "Not set")
                        }
                        .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                        NavigationLink {
                            WatchlistView()
                        } label: {
                            row("Watchlist · competitors", icon: "exclamationmark.triangle", value: feedState.watchlist.isEmpty ? "none" : "\(feedState.watchlist.count)")
                        }
                    } header: {
                        sectionHeader("Personalisation")
                    } footer: {
                        Text("Stories are ranked by how close they are to your product, and each story gets a \"My product\" level.")
                    }
                    .listRowBackground(NubbleColors.card(for: colorScheme))

                    Section {
                        NavigationLink {
                            SourcesView()
                        } label: {
                            row("Sources", icon: "antenna.radiowaves.left.and.right", value: "\(feedState.sources.filter(\.isActive).count) on")
                        }

                        Button { showTopicManager = true } label: {
                            row("Topics", icon: "tag", value: "")
                        }
                        .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                    } header: {
                        sectionHeader("Feed")
                    } footer: {
                        Text("The iPhone reads these sources itself: stories from the last \(LocalFeedService.newsWindowDays) days. It refreshes in the background, and while charging it writes the levels for the stories most relevant to your product.")
                    }
                    .listRowBackground(NubbleColors.card(for: colorScheme))

                    Section {
                        row("Depth writing", icon: "brain", value: "On this iPhone")
                        if let reason = OnDeviceModel.unavailableReason {
                            Text(reason)
                                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                                .foregroundStyle(.red)
                        } else {
                            row("Apple Intelligence", icon: "checkmark.seal", value: "Ready")
                        }
                    } header: {
                        sectionHeader("AI")
                    } footer: {
                        Text("Every level is written by Apple's on-device model. No paid AI service, nothing leaves the phone except reading the news pages.")
                    }
                    .listRowBackground(NubbleColors.card(for: colorScheme))

                    Section {
                        row("Version", icon: "info.circle", value: version)
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
                TopicManagerView(topics: Bindable(feedState).topics)
            }
            .sheet(isPresented: $showProduct) {
                NavigationStack { ProductView() }
            }
        }
    }

    private func row(_ title: String, icon: String, value: String) -> some View {
        HStack {
            Label(title, systemImage: icon)
                .font(.custom("Satoshi-Regular", size: 14, relativeTo: .body))
            Spacer()
            Text(value)
                .font(.custom("Satoshi-Regular", size: 13, relativeTo: .body))
                .foregroundStyle(NubbleColors.muted(for: colorScheme))
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


/// The patient list: competitors. A story naming one becomes a code red.
struct WatchlistView: View {
    @Environment(FeedState.self) private var feedState
    @State private var name = ""
    var body: some View {
        @Bindable var feedState = feedState
        List {
            Section {
                HStack {
                    TextField("Competitor name, e.g. Jungle Scout", text: $name).autocorrectionDisabled()
                    Button("Add") { let n = name.trimmingCharacters(in: .whitespaces); if !n.isEmpty { feedState.watchlist.append(n); name = "" } }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            } footer: { Text("Any story that names one of them is pinned first in the rounds as a code red.") }
            Section {
                ForEach(feedState.watchlist, id: \.self) { Text($0) }
                    .onDelete { feedState.watchlist.remove(atOffsets: $0) }
            } header: { Text("\(feedState.watchlist.count) watched") }
        }
        .navigationTitle("Watchlist")
        .toolbar { EditButton() }
    }
}
