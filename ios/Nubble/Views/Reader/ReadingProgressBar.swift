import SwiftUI

struct ReadingProgressBar: View {
    let progress: Double

    var body: some View {
        GeometryReader { geo in
            Rectangle()
                .fill(.primary.opacity(0.25))
                .frame(width: geo.size.width * progress, height: 2)
                .animation(.linear(duration: 0.1), value: progress)
        }
        .frame(height: 2)
    }
}
