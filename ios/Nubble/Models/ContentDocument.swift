import Foundation

struct ContentDocument: Sendable {
    let title: String
    let author: String
    var sections: [ContentSection]
    /// When the "My product" level was written: the product description's date at that moment.
    var productStamp: Date? = nil
    /// The writer version that produced the levels and Dr HAOS's lines.
    var writerVersion: Int = 0

    static var sample: ContentDocument {
        SampleContent.paradoxOfChoice
    }
}
