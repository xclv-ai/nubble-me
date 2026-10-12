import Foundation

struct ContentDocument: Sendable {
    let title: String
    let author: String
    var sections: [ContentSection]
    /// When the "My product" level was written: the product description's date at that moment.
    var productStamp: Date? = nil

    static var sample: ContentDocument {
        SampleContent.paradoxOfChoice
    }
}
