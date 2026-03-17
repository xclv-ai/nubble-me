import Foundation

struct DuplicateDetector: Sendable {

    /// Check if an article is a duplicate of any existing article.
    func isDuplicate(_ article: NewsArticle, existingArticles: [NewsArticle]) -> Bool {
        let candidateUrl = canonicalUrl(article.articleUrl)

        for existing in existingArticles {
            // Exact URL match
            if canonicalUrl(existing.articleUrl) == candidateUrl { return true }

            // Title similarity
            if titleSimilarity(article.title, existing.title) > 0.7 { return true }
        }

        return false
    }

    /// Normalize a URL by stripping tracking parameters.
    func canonicalUrl(_ url: URL) -> String {
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return url.absoluteString
        }

        let trackingParams: Set<String> = [
            "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
            "fbclid", "gclid", "ref", "source", "ncid",
        ]

        components.queryItems = components.queryItems?.filter { item in
            !trackingParams.contains(item.name)
        }

        // Remove empty query
        if components.queryItems?.isEmpty == true {
            components.queryItems = nil
        }

        // Remove trailing slash
        if components.path.hasSuffix("/") && components.path.count > 1 {
            components.path = String(components.path.dropLast())
        }

        return components.url?.absoluteString ?? url.absoluteString
    }

    /// Jaccard similarity between two titles (word-level).
    func titleSimilarity(_ a: String, _ b: String) -> Double {
        let setA = Set(a.lowercased().split(separator: " ").map(String.init))
        let setB = Set(b.lowercased().split(separator: " ").map(String.init))

        let intersection = setA.intersection(setB)
        let union = setA.union(setB)

        guard !union.isEmpty else { return 0 }
        return Double(intersection.count) / Double(union.count)
    }
}
