import Foundation
import SwiftSoup

/// Extracts clean article text from a URL using readability-style scoring.
struct ArticleExtractor: Sendable {

    struct ExtractedArticle: Sendable {
        let title: String
        let author: String?
        let publishedDate: Date?
        let bodyText: String
        let imageUrl: URL?
        let wordCount: Int
        let siteName: String?
    }

    func extract(from url: URL) async throws -> ExtractedArticle {
        // 1. Fetch HTML
        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 15

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw ExtractionError.cannotOpenFile
        }

        let encoding = httpResponse.textEncodingName.flatMap { String.Encoding(cfEncoding: CFStringConvertIANACharSetNameToEncoding($0 as CFString)) } ?? .utf8
        guard let html = String(data: data, encoding: encoding) ?? String(data: data, encoding: .utf8) else {
            throw ExtractionError.cannotOpenFile
        }

        // 2. Parse with SwiftSoup
        let doc = try SwiftSoup.parse(html, url.absoluteString)

        // 3. Extract metadata
        let title = try extractTitle(doc)
        let author = try extractMeta(doc, properties: ["author", "article:author", "dc.creator"])
        let siteName = try extractMeta(doc, properties: ["og:site_name"])
        let imageUrlStr = try extractMeta(doc, properties: ["og:image", "twitter:image"])
        let imageUrl = imageUrlStr.flatMap { URL(string: $0) }

        let dateStr = try extractMeta(doc, properties: ["article:published_time", "date", "datePublished"])
        let publishedDate = dateStr.flatMap { ISO8601DateFormatter().date(from: $0) }

        // 4. Remove non-content elements
        try doc.select("script, style, nav, header, footer, aside, .sidebar, .nav, .footer, .header, .comments, .comment, .ad, .advertisement, .social-share, .related, .newsletter, [role=navigation], [role=banner], [role=complementary]").remove()

        // 5. Find main content via readability scoring
        let contentElement = try findMainContent(doc)

        // 6. Convert to structured text
        let bodyText = try htmlToStructuredText(contentElement)

        let wordCount = bodyText.split(whereSeparator: { $0.isWhitespace }).count

        return ExtractedArticle(
            title: title,
            author: author,
            publishedDate: publishedDate,
            bodyText: bodyText,
            imageUrl: imageUrl,
            wordCount: wordCount,
            siteName: siteName
        )
    }

    // MARK: - Title Extraction

    private func extractTitle(_ doc: Document) throws -> String {
        // Try OG title first, then <title>, then first <h1>
        if let ogTitle = try doc.select("meta[property=og:title]").first()?.attr("content"),
           !ogTitle.isEmpty {
            return ogTitle
        }
        if let titleEl = try doc.select("title").first()?.text(),
           !titleEl.isEmpty {
            // Strip " - Site Name" suffixes
            let parts = titleEl.components(separatedBy: " | ")
            return parts.first ?? titleEl
        }
        if let h1 = try doc.select("h1").first()?.text(), !h1.isEmpty {
            return h1
        }
        return "Untitled"
    }

    // MARK: - Meta Extraction

    private func extractMeta(_ doc: Document, properties: [String]) throws -> String? {
        for prop in properties {
            if let el = try doc.select("meta[property=\(prop)], meta[name=\(prop)]").first(),
               let content = try? el.attr("content"),
               !content.isEmpty {
                return content
            }
        }
        return nil
    }

    // MARK: - Readability Scoring

    private func findMainContent(_ doc: Document) throws -> Element {
        guard let body = doc.body() else { return doc }

        // Score candidates: <article>, <main>, or high-scoring <div>/<section>
        if let article = try body.select("article").first() {
            return article
        }
        if let main = try body.select("main, [role=main]").first() {
            return main
        }

        // Score all container elements
        var bestElement: Element = body
        var bestScore: Double = 0

        let candidates = try body.select("div, section")
        for candidate in candidates {
            let score = try scoreElement(candidate)
            if score > bestScore {
                bestScore = score
                bestElement = candidate
            }
        }

        return bestElement
    }

    private func scoreElement(_ element: Element) throws -> Double {
        var score: Double = 0

        // Text density: more text relative to children = likely content
        let textLength = try element.text().count
        let childCount = max(1, element.children().size())
        score += Double(textLength) / Double(childCount) / 10

        // Paragraph count
        let paragraphs = try element.select("p")
        score += Double(paragraphs.size()) * 5

        // Positive class/id signals
        let classId = (try? element.attr("class") ?? "") ?? "" + " " + ((try? element.attr("id") ?? "") ?? "")
        let positivePatterns = ["article", "content", "post", "entry", "story", "text", "body"]
        let negativePatterns = ["comment", "sidebar", "nav", "footer", "ad", "banner", "menu", "social", "related", "promo"]

        for pattern in positivePatterns {
            if classId.localizedCaseInsensitiveContains(pattern) { score += 15 }
        }
        for pattern in negativePatterns {
            if classId.localizedCaseInsensitiveContains(pattern) { score -= 20 }
        }

        // Link density penalty: high link-to-text ratio = navigation, not content
        let linkText = try element.select("a").text().count
        let linkDensity = textLength > 0 ? Double(linkText) / Double(textLength) : 1.0
        if linkDensity > 0.5 { score -= 30 }

        return score
    }

    // MARK: - HTML to Structured Text (matches EPubParser pattern)

    private func htmlToStructuredText(_ element: Element) throws -> String {
        var result = ""

        for child in element.children() {
            let tag = child.tagName().lowercased()
            let text = try child.text().trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else { continue }

            switch tag {
            case "h1": result += "\n# \(text)\n\n"
            case "h2": result += "\n## \(text)\n\n"
            case "h3": result += "\n### \(text)\n\n"
            case "h4", "h5", "h6": result += "\n### \(text)\n\n"
            case "blockquote": result += "> \(text)\n\n"
            case "ul", "ol":
                for li in try child.select("li") {
                    result += "\u{2022} \(try li.text())\n"
                }
                result += "\n"
            case "figure":
                let caption = try child.select("figcaption").text()
                if !caption.isEmpty { result += "[\(caption)]\n\n" }
            case "pre", "code":
                result += "```\n\(text)\n```\n\n"
            default:
                result += "\(text)\n\n"
            }
        }
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

// String.Encoding helper
private extension String.Encoding {
    init?(cfEncoding: CFStringEncoding) {
        guard cfEncoding != kCFStringEncodingInvalidId else { return nil }
        self.init(rawValue: CFStringConvertEncodingToNSStringEncoding(cfEncoding))
    }
}
