import { useQuery } from "@tanstack/react-query";
import { Loader2, Newspaper, RefreshCw } from "lucide-react";
import { NubbleReader } from "@/components/NubbleReader";
import type { ContentDocument } from "@/lib/sample-content";

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

export default function A16zPortfolioPage() {
  const {
    data: feed,
    isLoading,
    isError,
    refetch,
  } = useQuery<FeedResponse>({
    queryKey: ["/data/feed/a16z-portfolio/latest.json"],
    queryFn: async () => {
      const res = await fetch("/data/feed/a16z-portfolio/latest.json");
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !feed || !feed.stories || feed.stories.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Newspaper className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-1">
            {isError ? "Could not load feed" : "Feed not generated yet"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">Check back soon.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const doc: ContentDocument = {
    title: `a16z AI Portfolio — ${feed.date}`,
    author: "nubble",
    sections: [...feed.stories]
      .sort((a, b) => a.rank - b.rank)
      .map((story) => ({
        id: story.id,
        title: story.title,
        summary: story.sections[0].summary,
        condensed: story.sections[0].condensed,
        standard: story.sections[0].standard,
        expanded: story.sections[0].expanded,
      })),
  };

  return (
    <div className="h-screen w-screen">
      <NubbleReader document={doc} />
    </div>
  );
}
