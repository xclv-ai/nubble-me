import Foundation

/// Reads RSS 2.0 and Atom feeds with Foundation's built-in XMLParser.
struct RSSItem: Sendable {
    var title: String = ""
    var link: String = ""
    var summary: String = ""
    var author: String?
    var published: Date?
    var imageUrl: String?
}

final class RSSParser: NSObject, XMLParserDelegate {
    private var items: [RSSItem] = []
    private var current: RSSItem?
    private var text = ""
    private var feedTitle = ""
    private var inChannelTitle = false

    static func parse(_ data: Data) -> (title: String, items: [RSSItem]) {
        let delegate = RSSParser()
        let parser = XMLParser(data: data)
        parser.delegate = delegate
        parser.shouldResolveExternalEntities = false
        parser.parse()
        return (delegate.feedTitle, delegate.items)
    }

    func parser(_ parser: XMLParser, didStartElement name: String, namespaceURI: String?, qualifiedName qName: String?, attributes: [String: String] = [:]) {
        text = ""
        switch name {
        case "item", "entry":
            current = RSSItem()
        case "link":
            // Atom: <link rel="alternate" href="…"/>
            if current != nil, let href = attributes["href"], (attributes["rel"] ?? "alternate") == "alternate" {
                current?.link = href
            }
        case "media:content", "media:thumbnail", "enclosure":
            if current != nil, current?.imageUrl == nil, let url = attributes["url"] {
                let type = attributes["type"] ?? attributes["medium"] ?? "image"
                if type.hasPrefix("image") { current?.imageUrl = url }
            }
        default:
            break
        }
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        text += string
    }

    func parser(_ parser: XMLParser, foundCDATA CDATABlock: Data) {
        text += String(data: CDATABlock, encoding: .utf8) ?? ""
    }

    func parser(_ parser: XMLParser, didEndElement name: String, namespaceURI: String?, qualifiedName qName: String?) {
        let value = text.trimmingCharacters(in: .whitespacesAndNewlines)
        defer { text = "" }

        guard current != nil else {
            if name == "title", feedTitle.isEmpty { feedTitle = value }
            return
        }

        switch name {
        case "title":
            current?.title = Self.plain(value)
        case "link":
            if current?.link.isEmpty == true, !value.isEmpty { current?.link = value }
        case "guid", "id":
            if current?.link.isEmpty == true, value.hasPrefix("http") { current?.link = value }
        case "description", "summary", "content", "content:encoded":
            // Keep the longest text the feed gives for the item
            let plain = Self.plain(value)
            if plain.count > (current?.summary.count ?? 0) { current?.summary = plain }
        case "author", "dc:creator", "name":
            if current?.author == nil, !value.isEmpty { current?.author = Self.plain(value) }
        case "pubDate", "published", "updated", "dc:date":
            if current?.published == nil { current?.published = Self.date(value) }
        case "item", "entry":
            if let item = current, !item.title.isEmpty, !item.link.isEmpty { items.append(item) }
            current = nil
        default:
            break
        }
    }

    // MARK: - Helpers

    /// Strips HTML tags and decodes the common entities.
    static func plain(_ html: String) -> String {
        var s = html.replacingOccurrences(of: "<br\\s*/?>|</p>", with: "\n", options: .regularExpression)
        s = s.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        let entities = ["&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'", "&#039;": "'", "&apos;": "'", "&nbsp;": " ", "&#8217;": "’", "&#8216;": "‘", "&#8220;": "“", "&#8221;": "”", "&#8211;": "–", "&#8212;": "—", "&hellip;": "…", "&#8230;": "…"]
        for (k, v) in entities { s = s.replacingOccurrences(of: k, with: v) }
        s = s.replacingOccurrences(of: "[ \\t]+", with: " ", options: .regularExpression)
        s = s.replacingOccurrences(of: "\\n\\s*\\n+", with: "\n\n", options: .regularExpression)
        return s.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    nonisolated(unsafe) private static let rfc822: [DateFormatter] = {
        ["EEE, dd MMM yyyy HH:mm:ss Z", "EEE, dd MMM yyyy HH:mm:ss zzz", "dd MMM yyyy HH:mm:ss Z", "EEE, dd MMM yyyy HH:mm Z"].map {
            let f = DateFormatter()
            f.locale = Locale(identifier: "en_US_POSIX")
            f.dateFormat = $0
            return f
        }
    }()

    static func date(_ value: String) -> Date? {
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = iso.date(from: value) { return d }
        iso.formatOptions = [.withInternetDateTime]
        if let d = iso.date(from: value) { return d }
        for f in rfc822 { if let d = f.date(from: value) { return d } }
        return nil
    }
}
