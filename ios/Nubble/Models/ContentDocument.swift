import Foundation

struct ContentDocument: Sendable {
    let title: String
    let author: String
    let sections: [ContentSection]

    static var sample: ContentDocument {
        SampleContent.paradoxOfChoice
    }
}
