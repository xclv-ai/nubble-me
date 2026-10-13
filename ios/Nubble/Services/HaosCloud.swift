import Foundation

/// The three daily lines from a frontier model (one call, ≤12 candidates, ≈ $0.001) through the Vercel AI Gateway.
/// The on-device writer still does the levels; without network or key the on-device lines stand.
enum HaosCloud {
    static let model = "openai/gpt-5.4-nano"
    static let endpoint = URL(string: "https://ai-gateway.vercel.sh/v1/chat/completions")!
    static let maxCandidates = 12
    static let maxCallsPerDay = 4

    struct Line: Decodable { let story: Int; let relevance: String; let headline: String; let verdict: String; let rx: String }

    static var available: Bool { !Secrets.aiGatewayKey.isEmpty }

    /// Returns lines keyed by article id. Throws on network/parse errors; the caller keeps the on-device lines.
    static func lines(for candidates: [NewsArticle], product: ProductProfile, voice: String) async throws -> [String: CloudLines] {
        let list = candidates.enumerated().map { i, a in
            "STORY \(i + 1) — \(a.sourceName): \(a.title)\nTEXT: \(String((a.section?.summary ?? a.snippet).prefix(400)).replacingOccurrences(of: "\n", with: " "))"
        }.joined(separator: "\n\n")
        let names = (product.products ?? []).joined(separator: ", ")
        let system = """
            You are DR HAOS, \(product.name)'s brand perception agent. \(voice)
            You write for a founder with no patience: short, concrete, with receipts. Never praise the news. \
            Never say game-changer, wake-up call, leverage, unlock. No exclamation marks. No markdown.
            """
        let user = """
            ABOUT \(product.name.uppercased()):
            \(product.description)
            \(names.isEmpty ? "" : "Products: \(names).")

            TODAY'S CANDIDATE STORIES:
            \(list)

            For each story write a JSON object with keys story (its number), relevance, headline, verdict, rx:
            - relevance: high / medium / low for \(product.name)'s business — strict: high only if a founder must act this week;
            - headline: ≤7 words, what changed in the market (not the company name first);
            - verdict: one or two sentences (≤24 words): what the founder did not see, and what it costs;
            - rx: the one move \(product.name) makes today, ≤12 words, verb first, naming one of its products.
            Answer with a JSON array only.
            """
        var req = URLRequest(url: endpoint)
        req.httpMethod = "POST"
        req.setValue("Bearer \(Secrets.aiGatewayKey)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.timeoutInterval = 60
        req.httpBody = try JSONSerialization.data(withJSONObject: [
            "model": model, "temperature": 0.4, "max_tokens": 1600,
            "messages": [["role": "system", "content": system], ["role": "user", "content": user]],
        ])
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw NSError(domain: "HaosCloud", code: (resp as? HTTPURLResponse)?.statusCode ?? 0, userInfo: [NSLocalizedDescriptionKey: String(decoding: data.prefix(200), as: UTF8.self)])
        }
        let top = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let content = ((top?["choices"] as? [[String: Any]])?.first?["message"] as? [String: Any])?["content"] as? String ?? ""
        // the array, even when the model wraps it in a code fence
        guard let start = content.firstIndex(of: "["), let end = content.lastIndex(of: "]") else { throw NSError(domain: "HaosCloud", code: 1, userInfo: [NSLocalizedDescriptionKey: "no JSON array"]) }
        let parsed = try JSONDecoder().decode([Line].self, from: Data(content[start...end].utf8))
        var out: [String: CloudLines] = [:]
        for l in parsed where (1...candidates.count).contains(l.story) {
            let rel: Double = l.relevance.lowercased().contains("high") ? 1 : l.relevance.lowercased().contains("medium") ? 0.5 : 0
            out[candidates[l.story - 1].id] = CloudLines(relevance: rel, headline: l.headline.trimmingCharacters(in: .whitespaces), verdict: l.verdict, rx: l.rx, model: model, at: Date())
        }
        return out
    }
}
