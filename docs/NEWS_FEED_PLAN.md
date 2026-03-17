# AI News Feed — Implementation Plan

> **Goal:** Automatic news parsing + on-device conversion into nubble's 4-depth format.
> Turn nubble into a daily AI/industry news reader where every article is instantly explorable at 4 levels of depth.
> **Reference UX:** Perplexity Discover — curated cards, AI summaries, tap to dive deeper.

---

## 1. Architecture

### 1.1 Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  FEED SOURCES                                                    │
│  RSS Feeds (primary, free) + NewsAPI.org (trending discovery)    │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  FEED AGGREGATOR (FeedService)                                   │
│  Fetch RSS XML → parse → deduplicate → rank/filter               │
│  Background refresh via BGAppRefreshTask                         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  ARTICLE EXTRACTION (ArticleExtractor)                           │
│  URL → fetch HTML → SwiftSoup readability → clean text + meta    │
│  Reuses EPubParser.htmlToStructuredText() pattern                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  NEWS CHUNKING (ChunkingEngine — reused, tuned params)           │
│  Article text → semantic sections (150-500 words for news)       │
│  Shorter ranges than books; news articles are 300-2000 words     │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  DEPTH GENERATION (DepthGenerator — reused, news-tuned prompts)  │
│  Each chunk → 4 depth variants via Apple Foundation Models       │
│  Cloud fallback: OpenAI GPT-4o-mini (already implemented)        │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  STORAGE (SwiftData)                                             │
│  NewsArticle model + cached ContentDocument per article          │
│  Topic preferences, read state, saved articles                   │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  UI LAYER                                                        │
│  NewsFeedView (card list) → tap → NubbleReaderView (existing)    │
│  Topic filter chips, pull-to-refresh, processing indicators      │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 New Files / Module Structure

```
ios/Nubble/
├── Models/
│   ├── ContentDocument.swift          (existing — no changes)
│   ├── ContentSection.swift           (existing — no changes)
│   ├── ReaderState.swift              (existing — no changes)
│   ├── NewsArticle.swift              (NEW)
│   ├── NewsTopic.swift                (NEW)
│   └── FeedSource.swift               (NEW)
├── Services/
│   ├── ConversionPipeline.swift       (existing — extract shared protocol)
│   ├── ChunkingEngine.swift           (existing — add parameterized init)
│   ├── DepthGenerator.swift           (existing — add news prompt variants)
│   ├── EPubParser.swift               (existing — extract htmlToStructuredText)
│   ├── FeedService.swift              (NEW — RSS/API fetching + aggregation)
│   ├── ArticleExtractor.swift         (NEW — URL → clean text, readability)
│   ├── NewsConversionPipeline.swift   (NEW — orchestrates article → nubble)
│   ├── FeedRefreshScheduler.swift     (NEW — BGAppRefreshTask management)
│   └── DuplicateDetector.swift        (NEW — fingerprinting + dedup)
├── Views/
│   ├── Reader/                        (existing — no changes)
│   ├── Import/                        (existing — no changes)
│   └── Feed/                          (NEW)
│       ├── NewsFeedView.swift
│       ├── NewsCardView.swift
│       ├── TopicChipsBar.swift
│       ├── TopicManagerView.swift
│       ├── ArticleProcessingView.swift
│       └── FeedEmptyState.swift
├── NubbleApp.swift                    (MODIFY — add TabView)
```

### 1.3 Integration with Existing Pipeline

**Reused directly:**
- `ChunkingEngine` — with adjusted `minWords`/`maxWords` for news
- `DepthGenerator` — with news-specific prompt variants
- `ContentDocument` / `ContentSection` — output format is identical
- `NubbleReaderView` / `SectionView` — reader is content-agnostic

**New extraction layer:**
- `ArticleExtractor` replaces `EPubParser`/`PDFExtractor` for web articles
- Reuses `EPubParser.htmlToStructuredText()` for HTML→text conversion

**Key decision:** `NewsConversionPipeline` composes `ChunkingEngine` + `DepthGenerator` (same as `ConversionPipeline`). No subclassing — both compose the same services.

### 1.4 Backend vs On-Device

**Everything on-device:**
- RSS feed fetching (direct HTTP)
- HTML extraction (SwiftSoup — already a dependency)
- Chunking (pure Swift — already implemented)
- Depth generation (Apple Foundation Models — already implemented)
- Storage (SwiftData, local)

**Lightweight server needed only for:**
- NewsAPI.org API key proxy (single serverless function on Vercel/CloudFlare Worker)
- Optional: curated feed list JSON hosted on CDN (updatable without app releases)

---

## 2. Data Model

### 2.1 NewsArticle

```swift
// ios/Nubble/Models/NewsArticle.swift

enum ArticleProcessingState: String, Codable, Sendable {
    case pending        // Fetched metadata only
    case extracting     // Downloading + extracting full text
    case chunking       // Splitting into sections
    case generating     // Generating depth variants
    case ready          // ContentDocument available
    case failed         // Processing error
}

struct NewsArticle: Identifiable, Sendable {
    let id: String                          // SHA256 of canonical URL
    let title: String
    let sourceName: String                  // "TechCrunch", "The Verge"
    let sourceLogoURL: URL?
    let author: String?
    let publishedAt: Date
    let articleURL: URL
    let imageURL: URL?
    let snippet: String                     // RSS description or first ~100 words
    let topics: [NewsTopic]
    let wordCount: Int?
    var processingState: ArticleProcessingState
    var document: ContentDocument?           // nil until processed
    var isSaved: Bool
    var isRead: Bool
    var readProgress: Double                // 0.0–1.0
    var lastReadAt: Date?
    var processedAt: Date?
    var errorMessage: String?
}
```

### 2.2 NewsTopic

```swift
struct NewsTopic: Identifiable, Hashable, Codable, Sendable {
    let id: String                          // "ai", "ecommerce", "startups"
    let label: String                       // "AI & Machine Learning"
    let emoji: String                       // for chip display
    let feedSources: [FeedSource]
    var isEnabled: Bool
    var sortOrder: Int
}
```

### 2.3 FeedSource

```swift
enum FeedSourceType: String, Codable, Sendable {
    case rss
    case atom
    case newsAPI
}

struct FeedSource: Identifiable, Codable, Sendable, Hashable {
    let id: String
    let name: String
    let url: URL
    let type: FeedSourceType
    let topicIds: [String]
    let refreshIntervalMinutes: Int
    var lastFetchedAt: Date?
    var isActive: Bool
}
```

### 2.4 Feed State

```swift
@Observable
@MainActor
final class FeedState {
    var articles: [NewsArticle] = []
    var selectedTopics: Set<String> = []    // empty = show all
    var isRefreshing: Bool = false
    var lastRefreshedAt: Date?
    var processingQueue: [String] = []      // article IDs being processed

    var filteredArticles: [NewsArticle] {
        if selectedTopics.isEmpty { return articles }
        return articles.filter { article in
            article.topics.contains { selectedTopics.contains($0.id) }
        }
    }
}
```

### 2.5 Caching Strategy

**Three-tier cache:**

| Tier | What | Size/article | Retention |
|------|------|-------------|-----------|
| Feed metadata | Title, snippet, source, date | ~2 KB | 30 days, auto-prune |
| Extracted text | Raw HTML-to-text output | ~5–15 KB | Permanent (source doesn't change) |
| ContentDocument | Full 4-depth sections | ~20–60 KB | Permanent until user deletes |

**500 cached articles ≈ 15–35 MB** — very manageable on-device.

---

## 3. News Sourcing Strategy

### 3.1 Recommended: RSS (primary) + NewsAPI.org (trending)

**Default curated RSS feeds:**

| Topic | Feeds |
|-------|-------|
| AI & ML | TechCrunch AI, The Verge AI, Ars Technica AI, MIT Technology Review, BAIR Blog |
| Ecommerce | Shopify Engineering Blog, Practical Ecommerce, Digital Commerce 360 |
| Startups | TechCrunch Startups, Y Combinator Blog |
| General Tech | Hacker News (top stories), Techmeme, The Verge |

Start with **15–20 curated feeds**. Users can add custom RSS URLs later.

**NewsAPI.org** for "Trending" section:
- Free tier: 100 requests/day, 24h delay — sufficient for MVP
- Query: `q=artificial+intelligence OR AI OR ecommerce&sortBy=popularity`
- Upgrade to paid ($449/mo) only at scale (10K+ users)

**Why not others:**
- Bing News API: requires Azure, more setup
- NewsAPI.ai: overkill for v1 (entity detection not needed yet)
- Connexun: smaller coverage

### 3.2 Cost Analysis

| Component | Free Tier | Paid | When to upgrade |
|-----------|-----------|------|-----------------|
| RSS feeds | $0 | $0 | Never |
| NewsAPI.org | $0 (100 req/day) | $449/mo | >5K users |
| API key proxy (Vercel) | $0 (hobby) | $20/mo | >100K req/mo |
| AI depth gen | $0 (on-device) | ~$0.001/article (cloud) | Older devices |
| **Total MVP** | **$0/mo** | | |

### 3.3 Rate Limiting

- Per-source: check HTTP `ETag`/`Last-Modified`; default refresh every 15 min; back off to 30 min if 3 empty fetches
- NewsAPI.org: max 4 requests/hour; cache 1 hour minimum; track daily count, stop at 90
- Global: max 4 concurrent feed fetches, max 2 concurrent extractions, max 1 concurrent depth generation

### 3.4 Fallback Chain

```
RSS unavailable        → skip source, show cached articles
NewsAPI quota exhausted → rely on RSS only
Article 404/paywall    → mark "unavailable", show snippet-only card
Network offline        → show all cached articles, disable refresh
Depth gen fails        → use passthroughDepths() (already in DepthGenerator.swift)
```

---

## 4. Content Pipeline for News

### 4.1 Article Extraction (new)

News articles need a **readability algorithm** — unlike ePub/PDF which are structured:

```swift
struct ArticleExtractor: Sendable {

    struct ExtractedArticle: Sendable {
        let title: String
        let author: String?
        let publishedDate: Date?
        let bodyText: String
        let imageURL: URL?
        let wordCount: Int
        let siteName: String?
    }

    func extract(from url: URL) async throws -> ExtractedArticle {
        // 1. Fetch HTML via URLSession
        // 2. Parse with SwiftSoup
        // 3. Extract metadata from <meta> OG tags, JSON-LD, <title>
        // 4. Score each <div>/<article>/<section> by:
        //    - Text density (text length / tag count)
        //    - Positive classes: "article", "content", "post", "entry"
        //    - Negative classes: "comment", "sidebar", "nav", "footer", "ad"
        //    - Paragraph count, link density
        // 5. Extract winning content node
        // 6. Reuse EPubParser.htmlToStructuredText() for HTML→text
        // 7. Return clean ExtractedArticle
    }
}
```

### 4.2 Chunking Tuning for News

Existing `ChunkingEngine` targets 200–800 words (books). News needs shorter sections:

```swift
extension ChunkingEngine {
    static var newsConfig: ChunkingEngine {
        ChunkingEngine(minWords: 100, maxWords: 500, splitTarget: 300)
    }
}
```

Requires changing `ChunkingEngine`'s `let` properties to a parameterized init.

**Heuristic:**
- < 500 words → single section (all 4 depths apply to whole article)
- 500–1500 words → 2–4 sections on heading/paragraph boundaries
- 1500+ words → standard chunking with news parameters

### 4.3 News-Optimized Depth Prompts

```swift
enum DepthPromptStyle: Sendable {
    case general    // current prompts (books, articles)
    case news       // news-optimized
}

// Depth 0 — Summary (headline rewrite)
"Write a single-sentence summary (max 20 words) of this news section.
Focus on: what happened, who is involved, and why it matters."

// Depth 1 — Condensed (key facts)
"Condense to 2-3 sentences. Lead with the most newsworthy fact.
Include key numbers, names, or dates. Drop background context."

// Depth 3 — Expanded (analysis + context)
"Expand with:
- Historical context: what led to this
- Industry implications: who is affected
- Expert perspective: what analysts are saying
- Related developments: broader trends
Keep journalistic tone. Add 50-100% more content."
```

### 4.4 Processing Times

For a typical 800-word news article:
- Fetch HTML: 0.5–2s
- SwiftSoup extraction: < 0.1s
- Chunking: < 0.01s
- Depth generation (on-device): 2–8s per section × 2–4 sections = **4–32s**
- **Total: 5–35 seconds**

### 4.5 Background Processing

```swift
// ios/Nubble/Services/FeedRefreshScheduler.swift

enum FeedRefreshScheduler {
    static let feedRefreshIdentifier = "me.nubble.feed.refresh"
    static let articleProcessIdentifier = "me.nubble.article.process"

    static func register() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: feedRefreshIdentifier, using: nil
        ) { task in handleFeedRefresh(task as! BGAppRefreshTask) }

        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: articleProcessIdentifier, using: nil
        ) { task in handleArticleProcessing(task as! BGProcessingTask) }
    }

    static func scheduleFeedRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: feedRefreshIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    static func scheduleArticleProcessing() {
        let request = BGProcessingTaskRequest(identifier: articleProcessIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        try? BGTaskScheduler.shared.submit(request)
    }
}
```

**Strategy:**
- **On-demand** (default): process when user taps a card, show progress overlay
- **Pre-processing**: background-process top 5–10 articles during idle/charging
- **Saved articles**: always pre-process so they're ready offline

---

## 5. UX Design

### 5.1 App Navigation — TabView

```swift
// Modified NubbleApp.swift
@main
struct NubbleApp: App {
    var body: some Scene {
        WindowGroup {
            TabView {
                Tab("Feed", systemImage: "newspaper") {
                    NewsFeedView()
                }
                Tab("Library", systemImage: "books.vertical") {
                    LibraryView()  // current reader + import
                }
                Tab("Settings", systemImage: "gearshape") {
                    SettingsView()
                }
            }
        }
    }
}
```

### 5.2 Feed Screen Layout

```
┌─────────────────────────────────────┐
│  nubble                    ●●●●     │  ← Header + unread count
│  ─────────────────────────────────  │
│  [AI] [Ecommerce] [Startups] [All] │  ← Topic chips (horizontal scroll)
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────┐   │  ← Featured card (hero)
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   │
│  │                             │   │
│  │  OpenAI Announces GPT-5     │   │     Title
│  │  The new model achieves...  │   │     Depth-0 summary
│  │  TechCrunch · 2h · 5 min   │   │     Source + time + read time
│  │  ●●○○ depth preview         │   │     Depth indicator
│  └─────────────────────────────┘   │
│                                     │
│  ┌────────────┐ ┌────────────┐     │  ← 2-column grid
│  │ ▓▓▓▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓▓▓▓ │     │
│  │ Shopify    │ │ Apple MLX  │     │
│  │ launches.. │ │ powers..   │     │
│  │ 3h · 3min │ │ 5h · 4min │     │
│  └────────────┘ └────────────┘     │
│                                     │
│  ┌─────────────────────────────┐   │  ← List cards
│  │ ▓▓▓  Google DeepMind...     │   │
│  │ ▓▓▓  New research shows..  │   │
│  │      The Verge · 1h · 6min │   │
│  └─────────────────────────────┘   │
│                                     │
│  ╭─ Processing 2 articles... ──╮   │  ← Floating indicator
│  ╰─────────────────────────────╯   │
│                                     │
│  [Feed]    [Library]    [Settings]  │  ← Tab bar
└─────────────────────────────────────┘
```

### 5.3 Card → Reader Transition

```swift
.navigationDestination(for: NewsArticle.self) { article in
    if let document = article.document {
        NubbleReaderView(document: document)
            .navigationTransition(.zoom(sourceID: article.id, in: namespace))
    } else {
        ArticleProcessingView(article: article) { document in
            // auto-navigate to reader once processed
        }
    }
}
```

`NubbleReaderView` already accepts a `ContentDocument` — news articles plug in directly. Zero reader changes needed.

### 5.4 Interactions

- **Pull-to-refresh**: `.refreshable { await feedService.refreshAllFeeds() }`
- **Infinite scroll**: load more when last item appears
- **Context menu**: Save for later, Share (using `ShareLink`)
- **Topic chips**: horizontal scroll, multi-select, "All" default

---

## 6. Implementation Phases

### Phase 6A: Feed Infrastructure (Week 1–2)

**Dependencies:** None — can start immediately

1. Create `NewsArticle`, `NewsTopic`, `FeedSource` models
2. Build `FeedService` — RSS XML parsing with SwiftSoup
3. RSS fetcher with URLSession, ETags, conditional GET
4. `DuplicateDetector` — URL normalization + title similarity
5. Default curated feed list (hardcoded initially)
6. Wire up `FeedState` observable

**Reused:** SwiftSoup (already in project)

### Phase 6B: Article Extraction (Week 2–3)

**Dependencies:** Phase 6A

1. Build `ArticleExtractor` with readability algorithm
2. Extract `EPubParser.htmlToStructuredText()` into shared utility
3. Metadata extraction (OG tags, JSON-LD)
4. Add parameterized init to `ChunkingEngine`
5. Add `DepthPromptStyle.news` to `DepthGenerator`
6. Build `NewsConversionPipeline`

**Reused:** `ChunkingEngine`, `DepthGenerator`, `htmlToStructuredText()`

### Phase 6C: Feed UI (Week 3–4)

**Dependencies:** Phase 6A (can use mock data before 6B)

1. Restructure `NubbleApp.swift` → TabView
2. `NewsFeedView` with ScrollView + LazyVStack
3. `NewsCardView` (featured + compact variants)
4. `TopicChipsBar`
5. `ArticleProcessingView` (progress overlay)
6. `FeedEmptyState`
7. Pull-to-refresh + navigation to `NubbleReaderView`
8. Save/unsave context menu

**Reused:** `NubbleReaderView`, `DepthIndicator`, `NubbleColors`, `Typography`, `Springs`

### Phase 6D: Background Processing + Offline (Week 4–5)

**Dependencies:** Phase 6B + 6C

1. Register `BGAppRefreshTask` + `BGProcessingTask`
2. Background task identifiers in `Info.plist`
3. Background feed refresh
4. Background article pre-processing (top 5–10)
5. Offline reading from cache
6. Processing queue management

### Phase 6E: Topic Management + Settings (Week 5–6)

**Dependencies:** Phase 6A + 6C

1. `TopicManagerView` — toggle/reorder topics
2. Custom feed source management (add/remove RSS URLs)
3. Persist topic preferences
4. Optional: NewsAPI.org integration for "Trending"
5. Refresh interval settings

### Phase 6F: Polish + Edge Cases (Week 6–7)

**Dependencies:** All above

1. Paywall detection and graceful handling
2. Error states for all failure modes
3. Article age indicators and auto-pruning (30 days)
4. Read/unread state
5. Haptic feedback (reuse existing `Haptics`)
6. Performance (image caching, lazy processing)
7. Accessibility (VoiceOver, dynamic type)

---

## 7. Edge Cases

### Paywalled Articles
- Detect: short body + "subscribe"/"sign in" keywords, HTTP 402/403, `.paywall` class names
- Handle: show card with "Paywall" badge, process available text if 300+ words, link to original

### Large Articles (5000+ words)
- Cap extraction at 10,000 words, truncate with "Read full article in browser"
- Batch depth generation (3 sections at a time) to manage memory
- Show progressive results — display sections as they finish

### Duplicate Detection
```swift
struct DuplicateDetector: Sendable {
    // 1. URL normalization: strip utm_*, fbclid, etc.
    // 2. Canonical URL: check <link rel="canonical">
    // 3. Title similarity: Jaccard similarity, threshold 0.7
    // 4. Keep article from higher-priority source
    func isDuplicate(_ article: NewsArticle, existingArticles: [NewsArticle]) -> Bool
}
```

### Content Quality Filtering
- Skip articles < 100 words (press releases)
- Skip podcast/gallery pages (audio embed / low text-to-image ratio)
- Skip non-English content (unless user opted in)
- Skip articles older than 7 days (except curated evergreen sources)

### Memory Pressure
- Process one article at a time (never parallel depth generation)
- Release `LanguageModelSession` between articles
- Fall back to `passthroughDepths()` on devices with < 4GB available RAM

---

## 8. SwiftData Integration Note

This plan assumes Phase 3 (SwiftData Persistence) runs alongside or before the news feed. If Phase 3 isn't ready, MVP can use:
- In-memory storage + `Codable` JSON serialization to Documents directory
- `UserDefaults` for topic preferences
- `PersistedArticle` SwiftData model storing `ContentDocument` as JSON data

---

## 9. Summary

| Metric | Value |
|--------|-------|
| New Swift files | ~12 |
| Modified existing files | 3–4 |
| Total new code | ~2,000–3,000 lines |
| Existing code reused | ~60% of pipeline |
| MVP cost | $0/mo |
| Time to MVP | 6–7 weeks |
| Key dependency | Phase 3 (SwiftData) for persistence |
