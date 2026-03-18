import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
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

type Category = "ai-news" | "ai-branding";

const categories: { id: Category; title: string; subtitle: string; path: string; dot: string; accent: string; activeAccent: string }[] = [
  {
    id: "ai-news",
    title: "AI News Nubs",
    subtitle: "Daily AI briefing",
    path: "/data/feed/ai-news/latest.json",
    dot: "bg-amber-500",
    accent: "border-transparent hover:bg-amber-500/10",
    activeAccent: "bg-amber-500/15 border-amber-500/30",
  },
  {
    id: "ai-branding",
    title: "AI and Strategic Branding Nubs",
    subtitle: "How top agencies use AI",
    path: "/data/feed/ai-branding/latest.json",
    dot: "bg-violet-500",
    accent: "border-transparent hover:bg-violet-500/10",
    activeAccent: "bg-violet-500/15 border-violet-500/30",
  },
  {
    id: "ai-ecommerce",
    title: "AI Ecommerce Nubs",
    subtitle: "AI transforming DTC & ecomm",
    path: "/data/feed/ai-ecommerce/latest.json",
    dot: "bg-emerald-500",
    accent: "border-transparent hover:bg-emerald-500/10",
    activeAccent: "bg-emerald-500/15 border-emerald-500/30",
  },
  {
    id: "a16z-portfolio",
    title: "a16z AI Portfolio",
    subtitle: "Latest from a16z startups",
    path: "/data/feed/a16z-portfolio/latest.json",
    dot: "bg-rose-500",
    accent: "border-transparent hover:bg-rose-500/10",
    activeAccent: "bg-rose-500/15 border-rose-500/30",
  },
];

function feedToDocument(feed: FeedResponse, title: string): ContentDocument {
  return {
    title: `${title} — ${feed.date}`,
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
}

function CategoryBar({ active, onSelect }: { active: Category; onSelect: (c: Category) => void }) {
  return (
    <div className="flex-shrink-0 px-5 py-2.5 border-b border-border/40 flex items-center justify-center gap-2 overflow-x-auto">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition-all duration-200 cursor-pointer whitespace-nowrap ${
            active === cat.id ? cat.activeAccent : cat.accent
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${cat.dot} flex-shrink-0`} />
          <span className="text-xs font-semibold text-foreground">{cat.title}</span>
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category>("ai-news");
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const cat = categories.find((c) => c.id === activeCategory)!;

  const { data: feed, isLoading } = useQuery<FeedResponse>({
    queryKey: [cat.path],
    queryFn: async () => {
      const res = await fetch(cat.path);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
  });

  if (isLoading || !feed || !feed.stories?.length) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const doc = feedToDocument(feed, cat.title);

  return (
    <div className="h-screen w-screen">
      <NubbleReader
        document={doc}
        subHeader={<CategoryBar active={activeCategory} onSelect={setActiveCategory} />}
      />
    </div>
  );
}
