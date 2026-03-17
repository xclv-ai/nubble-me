import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NubbleReader } from "@/components/NubbleReader";
import type { ContentDocument, ContentSection } from "@/lib/sample-content";
import { Loader2, ArrowLeft } from "lucide-react";

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

function storyToDocument(story: FeedStory): ContentDocument {
  const sections: ContentSection[] = story.sections.map((s) => ({
    id: s.id,
    title: s.title,
    summary: s.summary,
    condensed: s.condensed,
    standard: s.standard,
    expanded: s.expanded,
  }));

  return {
    title: story.title,
    author: story.source,
    sections,
  };
}

export default function ReadFeedPage() {
  const [, params] = useRoute("/read-feed/:id");
  const [, setLocation] = useLocation();

  const {
    data: feed,
    isLoading,
    isError,
  } = useQuery<FeedResponse>({
    queryKey: ["/api/nubble-feed"],
    queryFn: async () => {
      const res = await fetch("/api/nubble-feed");
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });

  const story = useMemo(() => {
    if (!feed || !params?.id) return null;
    return feed.stories.find((s) => s.id === params.id) ?? null;
  }, [feed, params?.id]);

  const document = useMemo(() => {
    if (!story) return null;
    return storyToDocument(story);
  }, [story]);

  useEffect(() => {
    const isDark =
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (document) {
      window.document.documentElement.classList.toggle("dark", isDark);
    }
  }, [document]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">
            {isError ? "Failed to load feed" : "Story not found"}
          </p>
          <button
            onClick={() => setLocation("/feed")}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Back button overlay */}
      <button
        onClick={() => setLocation("/feed")}
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Feed
      </button>

      <NubbleReader document={document} />
    </div>
  );
}
