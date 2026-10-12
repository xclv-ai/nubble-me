import Foundation

/// One news source the phone reads directly (RSS or Atom). The user can switch, add and delete sources.
struct FeedSource: Identifiable, Codable, Sendable, Hashable {
    let id: String
    var name: String
    var url: URL
    var topicIds: [String]
    var isActive: Bool
    var lastFetchedAt: Date?
    var lastError: String?

    init(id: String, name: String, url: URL, topicIds: [String], isActive: Bool = true) {
        self.id = id
        self.name = name
        self.url = url
        self.topicIds = topicIds
        self.isActive = isActive
    }
}

extension FeedSource {
    /// Starting list: every URL answered with fresh items on 2026-10-12.
    static let defaults: [FeedSource] = [
        .init(id: "techcrunch-ai", name: "TechCrunch AI", url: URL(string: "https://techcrunch.com/category/artificial-intelligence/feed/")!, topicIds: ["ai-news", "ai-releases"]),
        .init(id: "the-verge-ai", name: "The Verge AI", url: URL(string: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml")!, topicIds: ["ai-news"]),
        .init(id: "ars-technica-ai", name: "Ars Technica", url: URL(string: "https://feeds.arstechnica.com/arstechnica/technology-lab")!, topicIds: ["ai-news", "ai-research"]),
        .init(id: "venturebeat-ai", name: "VentureBeat AI", url: URL(string: "https://venturebeat.com/category/ai/feed/")!, topicIds: ["ai-news", "ai-releases"]),
        .init(id: "openai-blog", name: "OpenAI", url: URL(string: "https://openai.com/blog/rss.xml")!, topicIds: ["ai-research", "ai-releases"]),
        .init(id: "google-ai-blog", name: "Google AI", url: URL(string: "https://blog.google/technology/ai/rss/")!, topicIds: ["ai-research", "ai-releases"]),
        .init(id: "deepmind-blog", name: "Google DeepMind", url: URL(string: "https://deepmind.google/blog/rss.xml")!, topicIds: ["ai-research"]),
        .init(id: "mit-tech-review", name: "MIT Technology Review", url: URL(string: "https://www.technologyreview.com/feed/")!, topicIds: ["ai-research", "ai-news"]),
        .init(id: "huggingface-blog", name: "Hugging Face", url: URL(string: "https://huggingface.co/blog/feed.xml")!, topicIds: ["ai-research", "ai-releases"]),
        .init(id: "import-ai", name: "Import AI", url: URL(string: "https://importai.substack.com/feed")!, topicIds: ["ai-research"]),
        .init(id: "the-gradient", name: "The Gradient", url: URL(string: "https://thegradient.pub/rss/")!, topicIds: ["ai-research"], isActive: false),
        .init(id: "marketing-dive", name: "Marketing Dive", url: URL(string: "https://www.marketingdive.com/feeds/news/")!, topicIds: ["marketing"]),
        .init(id: "retail-dive", name: "Retail Dive", url: URL(string: "https://www.retaildive.com/feeds/news/")!, topicIds: ["commerce"]),
        .init(id: "modern-retail", name: "Modern Retail", url: URL(string: "https://www.modernretail.co/feed/")!, topicIds: ["commerce", "marketing"]),
        .init(id: "digital-commerce-360", name: "Digital Commerce 360", url: URL(string: "https://www.digitalcommerce360.com/feed/")!, topicIds: ["commerce"]),
    ]
}
