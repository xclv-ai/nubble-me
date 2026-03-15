import SwiftUI

enum Springs {
    /// UI feedback — buttons, indicators
    static let snappy: Animation = .spring(response: 0.25, dampingFraction: 0.75)

    /// Content transitions — depth changes
    static let gentle: Animation = .spring(response: 0.35, dampingFraction: 0.65)

    /// Section entrance — reveal on scroll
    static let reveal: Animation = .spring(response: 0.55, dampingFraction: 0.55)
}
