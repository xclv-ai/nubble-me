import { useLocation } from "wouter";

const categories = [
  {
    title: "AI News Nubs",
    subtitle: "Daily AI briefing at your depth",
    href: "/ai-digest",
    accent: "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20",
    dot: "bg-amber-500",
  },
  {
    title: "AI and Strategic Branding Nubs",
    subtitle: "How top agencies use AI daily",
    href: "/ai-branding",
    accent: "bg-violet-500/10 hover:bg-violet-500/15 border-violet-500/20",
    dot: "bg-violet-500",
  },
];

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-semibold tracking-[0.3em] text-foreground">
          NUBBLE
        </h1>
        <p className="mt-2 text-xs tracking-wider text-muted-foreground uppercase">
          More is Less
        </p>
      </div>

      {/* Category cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat) => (
          <button
            key={cat.href}
            onClick={() => navigate(cat.href)}
            className={`group relative rounded-2xl border p-8 text-left transition-all duration-200 ${cat.accent} cursor-pointer`}
          >
            <div className={`w-2 h-2 rounded-full ${cat.dot} mb-4`} />
            <h2 className="text-lg font-semibold text-foreground leading-tight mb-2">
              {cat.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cat.subtitle}
            </p>
            <div className="mt-6 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Read today's nubs &rarr;
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
