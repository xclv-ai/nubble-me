import SwiftUI

struct NubbleReaderView: View {
    let document: ContentDocument
    var onImportTapped: (() -> Void)? = nil
    @State private var state = ReaderState()
    @Environment(\.colorScheme) private var colorScheme
    @State private var scrollPosition: String?

    private var readingTime: Int {
        ReadingTime.estimate(for: document, at: state.globalDepth)
    }

    private var activeSectionIndex: Int {
        document.sections.firstIndex { $0.id == state.activeSectionId } ?? 0
    }

    var body: some View {
        ZStack {
            // Background
            NubbleColors.background(for: colorScheme)
                .ignoresSafeArea()

            // Boundary flash overlay
            if state.boundaryFlash != nil {
                BoundaryFlash(direction: state.boundaryFlash)
                    .ignoresSafeArea()
                    .zIndex(50)
            }

            VStack(spacing: 0) {
                header
                mainContent
                footer
            }
        }
        .onAppear {
            state.activeSectionId = document.sections.first?.id ?? ""
        }
        .onKeyPress(keys: [.leftArrow, .rightArrow], phases: .down) { keyPress in
            if keyPress.modifiers.contains(.shift) {
                if keyPress.key == .leftArrow { state.changeGlobalDepth(by: -1) }
                else { state.changeGlobalDepth(by: 1) }
            } else {
                if keyPress.key == .leftArrow { state.changeSectionDepth(id: state.activeSectionId, by: -1) }
                else { state.changeSectionDepth(id: state.activeSectionId, by: 1) }
            }
            return .handled
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 0) {
            ZStack {
                // Left: Logo + import
                HStack {
                    HStack(spacing: 10) {
                        NubbleLogo()
                        Text("nubble")
                            .font(.custom("Satoshi-Medium", size: 11, relativeTo: .caption))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme))
                            .tracking(2.5)
                            .textCase(.uppercase)
                    }

                    if let onImportTapped {
                        Button(action: onImportTapped) {
                            Image(systemName: "doc.badge.plus")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.6))
                        }
                        .padding(.leading, 4)
                    }

                    Spacer()
                }

                // Center: Depth control (− indicator +)
                HStack(spacing: 6) {
                    Button {
                        state.changeGlobalDepth(by: -1)
                    } label: {
                        Image(systemName: "minus")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.5))
                    }
                    .disabled(state.globalDepth == 0)
                    .opacity(state.globalDepth == 0 ? 0.2 : 1)

                    DepthIndicator(depth: state.globalDepth, size: .md)

                    Button {
                        state.changeGlobalDepth(by: 1)
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.5))
                    }
                    .disabled(state.globalDepth == 3)
                    .opacity(state.globalDepth == 3 ? 0.2 : 1)
                }

                // Right: Depth label + reading time
                HStack {
                    Spacer()

                    VStack(alignment: .trailing, spacing: 1) {
                        Text(DepthLevel(rawValue: state.globalDepth)?.label ?? "")
                            .font(.custom("Satoshi-Medium", size: 10, relativeTo: .caption2))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.5))
                            .tracking(2)
                            .textCase(.uppercase)
                            .contentTransition(.numericText())

                        Text("\(readingTime) min")
                            .font(.custom("Satoshi-Medium", size: 10, relativeTo: .caption2))
                            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.3))
                            .contentTransition(.numericText())
                    }
                    .frame(width: 90, alignment: .trailing)
                    .animation(Springs.snappy, value: state.globalDepth)
                }
            }
            .padding(.horizontal, 20)
            .frame(height: 48)

            // Progress bar
            ReadingProgressBar(progress: state.scrollProgress)
        }
        .background(NubbleColors.background(for: colorScheme))
    }

    // MARK: - Main Content

    private var mainContent: some View {
        HStack(spacing: 0) {
            // Section nav rail
            sectionNavRail

            // Scrollable content
            ScrollView(.vertical) {
                LazyVStack(spacing: 4) {
                    // Document header
                    documentHeader

                    // Sections
                    ForEach(Array(document.sections.enumerated()), id: \.element.id) { index, section in
                        SectionView(
                            section: section,
                            index: index,
                            total: document.sections.count,
                            isActive: section.id == state.activeSectionId,
                            isFirst: index == 0,
                            hasSwipedOnce: state.hasSwipedOnce,
                            onChangeDepth: { delta in
                                state.changeSectionDepth(id: section.id, by: delta)
                            },
                            onResetToGlobal: {
                                state.resetSectionDepth(id: section.id)
                            },
                            onFirstSwipe: {
                                if !state.hasSwipedOnce {
                                    state.hasSwipedOnce = true
                                }
                            },
                            depth: state.effectiveDepth(for: section.id),
                            globalDepth: state.globalDepth,
                            isOverridden: state.sectionOverrides[section.id] != nil
                        )
                        .id(section.id)
                        .onAppear {
                            // Update active section as sections appear
                            state.activeSectionId = section.id
                        }
                    }
                }
                .padding(.bottom, 96)
                .scrollTargetLayout()
            }
            .scrollPosition(id: $scrollPosition, anchor: UnitPoint(x: 0.5, y: 0.35))
            .onScrollGeometryChange(for: Double.self) { geo in
                let scrollable = geo.contentSize.height - geo.containerSize.height
                return scrollable > 0 ? geo.contentOffset.y / scrollable : 0
            } action: { oldValue, newValue in
                let clamped = max(0, min(1, newValue))
                if abs(clamped - oldValue) > 0.001 {
                    state.scrollProgress = clamped
                }
            }
            .gesture(
                MagnifyGesture()
                    .onEnded { value in
                        if value.magnification > 1.15 {
                            state.changeGlobalDepth(by: 1)
                        } else if value.magnification < 0.85 {
                            state.changeGlobalDepth(by: -1)
                        }
                    }
            )
        }
    }

    private var documentHeader: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(document.title)
                .font(Typography.documentTitle)
                .foregroundStyle(NubbleColors.foreground(for: colorScheme))
                .lineSpacing(2)

            HStack(spacing: 12) {
                Text(document.author)
                    .font(.custom("Satoshi-Medium", size: 12, relativeTo: .caption))
                    .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.5))

                Text("\(readingTime) min read")
                    .font(.custom("Satoshi-Medium", size: 12, relativeTo: .caption))
                    .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.3))
                    .contentTransition(.numericText())
                    .animation(Springs.snappy, value: state.globalDepth)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.top, 32)
        .padding(.bottom, 40)
    }

    // MARK: - Section Nav Rail

    private var sectionNavRail: some View {
        VStack(spacing: 6) {
            ForEach(Array(document.sections.enumerated()), id: \.element.id) { index, section in
                Button {
                    withAnimation(Springs.gentle) {
                        scrollPosition = section.id
                    }
                } label: {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(NubbleColors.primary(for: colorScheme))
                        .frame(width: 6, height: section.id == state.activeSectionId ? 20 : 6)
                        .opacity(section.id == state.activeSectionId ? 1 : 0.15)
                        .animation(Springs.snappy, value: state.activeSectionId)
                }
                .accessibilityLabel("Jump to: \(section.title)")
            }
        }
        .frame(width: 32)
        .padding(.vertical, 16)
    }

    // MARK: - Footer

    private var footer: some View {
        HStack {
            HStack(spacing: 8) {
                Text("scroll to read")
                Rectangle()
                    .fill(NubbleColors.border(for: colorScheme).opacity(0.3))
                    .frame(width: 1, height: 10)
                Text("swipe for depth")
                Rectangle()
                    .fill(NubbleColors.border(for: colorScheme).opacity(0.3))
                    .frame(width: 1, height: 10)
                Text("pinch to zoom")
            }
            .font(.custom("Satoshi-Regular", size: 9, relativeTo: .caption2))
            .foregroundStyle(NubbleColors.muted(for: colorScheme).opacity(0.4))
            .tracking(0.5)

            Spacer()
        }
        .padding(.horizontal, 20)
        .frame(height: 36)
        .background(NubbleColors.background(for: colorScheme))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(NubbleColors.border(for: colorScheme).opacity(0.4))
                .frame(height: 1)
        }
    }
}
