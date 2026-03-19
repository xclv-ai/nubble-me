function log(message: string, source = "feed") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "atom";
  topicIds: string[];
  refreshIntervalMinutes: number;
  lastFetchedAt?: Date;
  isActive: boolean;
}

export interface FeedArticle {
  id: string; // SHA256 of canonical URL
  title: string;
  sourceName: string;
  sourceId: string;
  author: string | null;
  publishedAt: string; // ISO 8601
  articleUrl: string;
  imageUrl: string | null;
  snippet: string;
  topics: string[];
  wordCount: number | null;
}

export interface NewsTopic {
  id: string;
  label: string;
  emoji: string;
  isEnabled: boolean;
  sortOrder: number;
}

// ── Default AI-focused RSS feeds ───────────────────────────────────────────

export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  // Breaking AI news
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    type: "rss",
    topicIds: ["ai-news", "ai-releases"],
    refreshIntervalMinutes: 15,
    isActive: true,
  },
  {
    id: "the-verge-ai",
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    type: "rss",
    topicIds: ["ai-news"],
    refreshIntervalMinutes: 15,
    isActive: true,
  },
  {
    id: "ars-technica-ai",
    name: "Ars Technica AI",
    url: "https://feeds.arstechnica.com/arstechnica/technology-lab",
    type: "rss",
    topicIds: ["ai-news", "ai-research"],
    refreshIntervalMinutes: 30,
    isActive: true,
  },
  {
    id: "venturebeat-ai",
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/feed/",
    type: "rss",
    topicIds: ["ai-news", "ai-releases"],
    refreshIntervalMinutes: 15,
    isActive: true,
  },
  // Research & Labs
  {
    id: "openai-blog",
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss.xml",
    type: "rss",
    topicIds: ["ai-research", "ai-releases"],
    refreshIntervalMinutes: 60,
    isActive: true,
  },
  {
    id: "anthropic-news",
    name: "Anthropic News",
    url: "https://www.anthropic.com/rss.xml",
    type: "rss",
    topicIds: ["ai-research", "ai-releases", "ai-policy"],
    refreshIntervalMinutes: 60,
    isActive: true,
  },
  {
    id: "google-ai-blog",
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
    type: "rss",
    topicIds: ["ai-research", "ai-releases"],
    refreshIntervalMinutes: 60,
    isActive: true,
  },
  {
    id: "deepmind-blog",
    name: "DeepMind Blog",
    url: "https://deepmind.google/blog/rss.xml",
    type: "rss",
    topicIds: ["ai-research"],
    refreshIntervalMinutes: 60,
    isActive: true,
  },
  {
    id: "mit-tech-review",
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/feed/",
    type: "rss",
    topicIds: ["ai-research", "ai-policy"],
    refreshIntervalMinutes: 30,
    isActive: true,
  },
  // Community & analysis
  {
    id: "huggingface-blog",
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    type: "rss",
    topicIds: ["ai-research", "ai-releases"],
    refreshIntervalMinutes: 60,
    isActive: true,
  },
  {
    id: "import-ai",
    name: "Import AI",
    url: "https://importai.substack.com/feed",
    type: "rss",
    topicIds: ["ai-research", "ai-policy"],
    refreshIntervalMinutes: 120,
    isActive: true,
  },
  {
    id: "the-gradient",
    name: "The Gradient",
    url: "https://thegradient.pub/rss/",
    type: "rss",
    topicIds: ["ai-research"],
    refreshIntervalMinutes: 120,
    isActive: true,
  },
];

export const DEFAULT_TOPICS: NewsTopic[] = [
  { id: "ai-news", label: "AI News", emoji: "🤖", isEnabled: true, sortOrder: 0 },
  { id: "ai-research", label: "Research", emoji: "🔬", isEnabled: true, sortOrder: 1 },
  { id: "ai-releases", label: "Releases", emoji: "🚀", isEnabled: true, sortOrder: 2 },
  { id: "ai-policy", label: "Policy", emoji: "⚖️", isEnabled: true, sortOrder: 3 },
];

// ── RSS Parsing ────────────────────────────────────────────────────────────

import * as cheerio from "cheerio";
import { createHash } from "crypto";

function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Strip tracking params
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
      "fbclid", "gclid", "ref", "source",
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    // Remove trailing slash
    let href = parsed.href;
    if (href.endsWith("/")) href = href.slice(0, -1);
    return href;
  } catch {
    return url;
  }
}

function articleId(url: string): string {
  return createHash("sha256").update(canonicalUrl(url)).digest("hex").slice(0, 16);
}

function extractImageUrl(item: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string | null {
  // Check media:content, media:thumbnail, enclosure
  const mediaContent = item.find("media\\:content, content").attr("url");
  if (mediaContent) return mediaContent;

  const mediaThumbnail = item.find("media\\:thumbnail, thumbnail").attr("url");
  if (mediaThumbnail) return mediaThumbnail;

  const enclosure = item.find("enclosure[type^='image']").attr("url");
  if (enclosure) return enclosure;

  // Try to extract from description/content HTML
  const descHtml = item.find("description, content\\:encoded").html();
  if (descHtml) {
    const $desc = cheerio.load(descHtml);
    const img = $desc("img").first().attr("src");
    if (img) return img;
  }

  return null;
}

function stripHtml(html: string): string {
  return cheerio.load(html).text().trim();
}

export async function parseFeed(source: FeedSource): Promise<FeedArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Nubble/1.0 (https://nubble.me)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });

    if (!res.ok) {
      log(`Feed fetch failed for ${source.name}: HTTP ${res.status}`, "feed");
      return [];
    }

    const xml = await res.text();
    const $ = cheerio.load(xml, { xml: true });

    const articles: FeedArticle[] = [];

    // RSS 2.0 items
    const rssItems = $("item");
    // Atom entries
    const atomEntries = $("entry");

    const items = rssItems.length > 0 ? rssItems : atomEntries;
    const isAtom = rssItems.length === 0;

    items.each((_i, el) => {
      const item = $(el);

      const title = item.find("title").first().text().trim();
      if (!title) return;

      let link: string;
      if (isAtom) {
        link = item.find("link[rel='alternate']").attr("href")
          || item.find("link").attr("href")
          || "";
      } else {
        link = item.find("link").first().text().trim()
          || item.find("guid").first().text().trim()
          || "";
      }
      if (!link) return;

      const pubDateStr = item.find("pubDate, published, updated").first().text().trim();
      const parsedDate = pubDateStr ? new Date(pubDateStr) : null;
      const publishedAt = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

      // Skip articles older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (publishedAt < sevenDaysAgo) return;

      const descriptionHtml = item.find("description, summary, content\\:encoded").first().html() || "";
      const snippet = stripHtml(descriptionHtml).slice(0, 300);

      const author = item.find("dc\\:creator, author name, author").first().text().trim() || null;
      const imageUrl = extractImageUrl(item, $);

      // Estimate word count from snippet
      const wordCount = snippet ? snippet.split(/\s+/).length : null;

      articles.push({
        id: articleId(link),
        title,
        sourceName: source.name,
        sourceId: source.id,
        author,
        publishedAt: publishedAt.toISOString(),
        articleUrl: canonicalUrl(link),
        imageUrl,
        snippet,
        topics: source.topicIds,
        wordCount,
      });
    });

    return articles;
  } catch (err: any) {
    if (err.name === "AbortError") {
      log(`Feed fetch timeout for ${source.name}`, "feed");
    } else {
      log(`Feed parse error for ${source.name}: ${err.message}`, "feed");
    }
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

// ── Deduplication ──────────────────────────────────────────────────────────

function jaccard(a: string, b: string): number {
  const setA: Set<string> = new Set(a.toLowerCase().split(/\s+/));
  const setB: Set<string> = new Set(b.toLowerCase().split(/\s+/));
  let intersectionCount = 0;
  Array.from(setA).forEach((word) => {
    if (setB.has(word)) intersectionCount++;
  });
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

export function deduplicateArticles(articles: FeedArticle[]): FeedArticle[] {
  const seen = new Map<string, FeedArticle>(); // canonical URL → article
  const result: FeedArticle[] = [];

  for (const article of articles) {
    const canonical = canonicalUrl(article.articleUrl);

    // Exact URL match
    if (seen.has(canonical)) continue;

    // Title similarity check against existing articles
    let isDuplicate = false;
    for (const existing of result) {
      if (jaccard(article.title, existing.title) > 0.7) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    seen.set(canonical, article);
    result.push(article);
  }

  return result;
}

// ── Feed Aggregator ────────────────────────────────────────────────────────

export class FeedAggregator {
  private sources: FeedSource[];
  private cachedArticles: FeedArticle[] = [];
  private lastRefreshAt: Date | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private isRefreshing = false;

  constructor(sources: FeedSource[] = DEFAULT_FEED_SOURCES) {
    this.sources = sources;
  }

  async refreshAll(): Promise<{ total: number; errors: string[] }> {
    if (this.isRefreshing) {
      log("Refresh already in progress, skipping", "feed");
      return { total: this.cachedArticles.length, errors: [] };
    }
    this.isRefreshing = true;

    try {
      log(`Refreshing ${this.sources.filter((s) => s.isActive).length} feed sources...`, "feed");

      const errors: string[] = [];
      const allArticles: FeedArticle[] = [];

      // Fetch all feeds concurrently (max 4 at a time)
      const activeSources = this.sources.filter((s) => s.isActive);
      const batchSize = 4;

      for (let i = 0; i < activeSources.length; i += batchSize) {
        const batch = activeSources.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((source) => parseFeed(source)),
        );

        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            allArticles.push(...result.value);
          } else {
            errors.push(`${batch[idx].name}: ${result.reason}`);
          }
        });
      }

      // Deduplicate
      const deduplicated = deduplicateArticles(allArticles);

      // Sort by publish date (newest first)
      deduplicated.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );

      // Auto-prune articles older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const pruned = deduplicated.filter(
        (a) => new Date(a.publishedAt) > thirtyDaysAgo,
      );

      this.cachedArticles = pruned;
      this.lastRefreshAt = new Date();

      log(
        `Feed refresh complete: ${deduplicated.length} articles from ${activeSources.length} sources (${errors.length} errors)`,
        "feed",
      );

      return { total: deduplicated.length, errors };
    } finally {
      this.isRefreshing = false;
    }
  }

  getArticles(options?: {
    topics?: string[];
    limit?: number;
    offset?: number;
  }): { articles: FeedArticle[]; total: number; lastRefreshedAt: string | null } {
    let articles = this.cachedArticles;

    // Filter by topics
    if (options?.topics?.length) {
      articles = articles.filter((a) =>
        a.topics.some((t) => options.topics!.includes(t)),
      );
    }

    const total = articles.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    articles = articles.slice(offset, offset + limit);

    return {
      articles,
      total,
      lastRefreshedAt: this.lastRefreshAt?.toISOString() ?? null,
    };
  }

  getSources(): FeedSource[] {
    return this.sources;
  }

  getTopics(): NewsTopic[] {
    return DEFAULT_TOPICS;
  }

  addSource(opts: { name: string; url: string; topicIds: string[] }): FeedSource {
    // Validate URL
    const parsed = new URL(opts.url); // throws if invalid

    // Check for duplicate URL
    const normalizedUrl = canonicalUrl(opts.url);
    if (this.sources.some((s) => canonicalUrl(s.url) === normalizedUrl)) {
      throw new Error(`Feed source with URL "${opts.url}" already exists`);
    }

    const source: FeedSource = {
      id: `custom-${Date.now()}`,
      name: opts.name,
      url: opts.url,
      type: "rss",
      topicIds: opts.topicIds,
      refreshIntervalMinutes: 30,
      isActive: true,
    };

    this.sources.push(source);
    log(`Added custom source: ${source.name} (${source.url})`, "feed");
    return source;
  }

  removeSource(id: string): boolean {
    const index = this.sources.findIndex((s) => s.id === id);
    if (index === -1) return false;
    const removed = this.sources.splice(index, 1)[0];
    log(`Removed source: ${removed.name}`, "feed");
    return true;
  }

  startAutoRefresh(intervalMinutes: number = 15): void {
    if (this.refreshTimer) return;
    this.refreshTimer = setInterval(
      () => this.refreshAll(),
      intervalMinutes * 60 * 1000,
    );
    log(`Auto-refresh started: every ${intervalMinutes} minutes`, "feed");
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
