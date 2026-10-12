import Foundation
import SwiftSoup

/// Reads the visible text of any web page (the user's product page).
struct PageReader: Sendable {
    func text(of url: URL) async throws -> (finalUrl: URL, title: String, text: String) {
        var request = URLRequest(url: url)
        request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 20
        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
            throw URLError(.badServerResponse)
        }
        let finalUrl = response.url ?? url
        let doc = try SwiftSoup.parse(String(decoding: data, as: UTF8.self), finalUrl.absoluteString)
        let title = try doc.title()
        let description = try doc.select("meta[name=description], meta[property=og:description]").first()?.attr("content") ?? ""
        try doc.select("script, style, noscript, svg, iframe, nav, footer").remove()
        var lines: [String] = []
        for element in try doc.select("h1, h2, h3, h4, p, li, a[class*=button], button, td").array() {
            let line = try element.text().trimmingCharacters(in: .whitespacesAndNewlines)
            if line.count > 2, lines.last != line { lines.append(line) }
        }
        // Keep each line once, in page order
        var seen = Set<String>()
        let unique = lines.filter { seen.insert($0).inserted }
        let body = ([title, description] + unique).filter { !$0.isEmpty }.joined(separator: "\n")
        return (finalUrl, title, body)
    }
}
