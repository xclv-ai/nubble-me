import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Newspaper, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface FeedSection {
  id: string;
  title: string;
  summary: string;
  condensed: string;
  standard: string;
  expanded: string;
}

interface FeedStory {
  id: string;
  rank: number;
  title: string;
  source: string;
  source_url: string;
  why_it_matters: string;
  sections: FeedSection[];
}

interface FeedResponse {
  date: string;
  generated_at: string;
  stories: FeedStory[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-semibold shrink-0">
      {rank}
    </span>
  );
}

function DepthDots({ sections }: { sections: FeedSection[] }) {
  return (
    <div className="flex gap-1 items-center">
      {sections.map((_, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
        />
      ))}
    </div>
  );
}

function SkeletonCard({ large }: { large?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 animate-pulse ${
        large ? "col-span-full" : ""
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-6 h-6 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className={`h-5 bg-muted rounded ${large ? "w-3/4" : "w-full"}`} />
          {large && <div className="h-5 bg-muted rounded w-1/2" />}
        </div>
      </div>
      <div className="h-3 bg-muted rounded w-1/4 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        {large && <div className="h-3 bg-muted rounded w-2/3" />}
      </div>
    </div>
  );
}

function FeaturedCard({
  story,
  onClick,
}: {
  story: FeedStory;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors p-6 sm:p-8 cursor-pointer group"
    >
      <div className="flex items-start gap-3 mb-4">
        <RankBadge rank={story.rank} />
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
          {story.title}
        </h2>
      </div>

      <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
        <a
          href={story.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {story.source}
          <ExternalLink className="w-3 h-3" />
        </a>
        <DepthDots sections={story.sections} />
      </div>

      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {story.why_it_matters}
      </p>
    </motion.button>
  );
}

function GridCard({
  story,
  onClick,
  index,
}: {
  story: FeedStory;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors p-5 cursor-pointer group flex flex-col"
    >
      <div className="flex items-start gap-2.5 mb-3">
        <RankBadge rank={story.rank} />
        <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
          {story.title}
        </h3>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <span>{story.source}</span>
        <DepthDots sections={story.sections} />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mt-auto">
        {story.why_it_matters}
      </p>
    </motion.button>
  );
}

function ListCard({
  story,
  onClick,
  index,
}: {
  story: FeedStory;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.03 * index, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="w-full text-left flex items-start gap-4 py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
    >
      <RankBadge rank={story.rank} />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {story.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{story.source}</span>
          <span className="text-border">|</span>
          <span className="line-clamp-1">{story.why_it_matters}</span>
        </div>
      </div>
    </motion.button>
  );
}

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Override body overflow:hidden (set globally for NubbleReader)
  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const {
    data: feed,
    isLoading,
    isError,
    refetch,
  } = useQuery<FeedResponse>({
    queryKey: ["/data/feed/latest.json"],
    queryFn: async () => {
      const res = await fetch("/data/feed/latest.json");
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });

  const navigateToStory = (storyId: string) => {
    setLocation(`/read-feed/${storyId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8 animate-pulse">
            <div className="h-7 bg-muted rounded w-24 mb-2" />
            <div className="h-4 bg-muted rounded w-48" />
          </div>
          <div className="space-y-4">
            <SkeletonCard large />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Newspaper className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-1">
            No feed available
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Could not load the daily feed. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!feed || !feed.stories || feed.stories.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Newspaper className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-1">
            Feed not generated yet
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Today's AI news feed hasn't been created. Check back soon.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const stories = [...feed.stories].sort((a, b) => a.rank - b.rank);
  const featured = stories[0];
  const gridStories = stories.slice(1, 4);
  const listStories = stories.slice(4);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              nubble
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(feed.date)} &middot; {feed.stories.length} stories
            </p>
          </div>
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reader
          </button>
        </motion.header>

        {/* Featured card (rank 1) */}
        {featured && (
          <div className="mb-6">
            <FeaturedCard
              story={featured}
              onClick={() => navigateToStory(featured.id)}
            />
          </div>
        )}

        {/* Grid cards (ranks 2-4) */}
        {gridStories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {gridStories.map((story, i) => (
              <GridCard
                key={story.id}
                story={story}
                onClick={() => navigateToStory(story.id)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* List cards (ranks 5+) */}
        {listStories.length > 0 && (
          <div className="border-t border-border pt-2">
            {listStories.map((story, i) => (
              <ListCard
                key={story.id}
                story={story}
                onClick={() => navigateToStory(story.id)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
