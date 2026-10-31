import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, ArrowLeftRight, Loader2 } from "lucide-react";
import { NubbleReader } from "@/components/NubbleReader";
import type { ContentDocument } from "@/lib/sample-content";

/**
 * Landing page for founders. Vercel-style: Geist, black on white, hairline
 * borders, 8-point spacing, 1200px container. The demo is the real reader
 * reading the real latest edition, nothing is mocked.
 */

interface FeedStory {
  id: string;
  rank: number;
  title: string;
  sections: { summary: string; condensed: string; standard: string; expanded: string }[];
}
interface FeedResponse {
  date: string;
  stories: FeedStory[];
}

const DEMO_FEED = "/data/feed/ai-news/latest.json";
const CONTACT = "ceo@pokpok.ai";

function feedToDocument(feed: FeedResponse): ContentDocument {
  return {
    title: "AI News — latest edition",
    author: "nubble",
    sections: [...feed.stories]
      .sort((a, b) => a.rank - b.rank)
      .map((s) => ({
        id: s.id,
        title: s.title,
        summary: s.sections[0].summary,
        condensed: s.sections[0].condensed,
        standard: s.sections[0].standard,
        expanded: s.sections[0].expanded,
      })),
  };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/* ─── Primitives in the Vercel idiom ─── */

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-6 ${className}`}>{children}</div>;
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`border-t border-[#eaeaea] dark:border-[#333] ${className}`}>
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="[font-family:'Geist_Mono',monospace] text-[12px] uppercase tracking-[0.08em] text-[#666] dark:text-[#888]">{children}</p>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-black dark:text-white">
      {children}
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-[620px] text-[17px] leading-[1.6] text-[#666] dark:text-[#a1a1a1]">{children}</p>;
}

function ButtonPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-black px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc]"
    >
      {children}
    </a>
  );
}

function ButtonSecondary({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const cls =
    "inline-flex h-10 items-center gap-2 rounded-md border border-[#eaeaea] bg-white px-4 text-[14px] font-medium text-black transition-colors hover:border-black dark:border-[#333] dark:bg-black dark:text-white dark:hover:border-white";
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/* ─── Sections ─── */

function Label({ kind }: { kind: "code red" | "weakened" | "worth knowing" }) {
  const cls =
    kind === "code red"
      ? "bg-[#e5484d] text-white"
      : kind === "weakened"
        ? "bg-[#f5a623] text-black"
        : "bg-[#eaeaea] text-[#444] dark:bg-[#333] dark:text-[#ccc]";
  return (
    <span className={`[font-family:'Geist_Mono',monospace] inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${cls}`}>
      {kind}
    </span>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#eaeaea] bg-white/80 backdrop-blur dark:border-[#333] dark:bg-black/80">
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <span className="inline-block h-5 w-5 rounded-full bg-black dark:bg-white" aria-hidden />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-black dark:text-white">nubble</span>
        </a>
        <nav className="hidden items-center gap-6 text-[14px] text-[#666] dark:text-[#a1a1a1] md:flex">
          <a href="#brief" className="hover:text-black dark:hover:text-white">The brief</a>
          <a href="#setup" className="hover:text-black dark:hover:text-white">Setup</a>
          <a href="#sources" className="hover:text-black dark:hover:text-white">Sources</a>
          <a href="#demo" className="hover:text-black dark:hover:text-white">Three depths</a>
          <a href="#outputs" className="hover:text-black dark:hover:text-white">What you get</a>
        </nav>
        <ButtonPrimary href="#start">Get early access</ButtonPrimary>
      </Container>
    </header>
  );
}

const PEEC_RELEASE = "https://uk.finance.yahoo.com/news/peec-ai-launches-peec-agent-161300906.html";

/** The brief, as a founder would receive it. Real company (ours), real rival, real stories. */
function BriefPreview() {
  return (
    <div className="rounded-lg border border-[#eaeaea] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-[#333] dark:bg-black">
      <div className="flex items-center justify-between border-b border-[#eaeaea] px-5 py-3 dark:border-[#333]">
        <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">
          Brief for pokpok.ai · week of 20 Oct 2026
        </p>
        <p className="[font-family:'Geist_Mono',monospace] text-[11px] text-[#888]">3 of 212 stories</p>
      </div>

      <article className="border-b border-[#eaeaea] p-5 dark:border-[#333]">
        <div className="flex flex-wrap items-center gap-2">
          <Label kind="code red" />
          <span className="text-[12px] text-[#888]">Peec AI · competitor · 16 Sep 2026</span>
        </div>
        <h3 className="mt-2 text-[16px] font-semibold leading-snug text-black dark:text-white">
          Peec AI adds “brand perception” to its tracker
        </h3>
        <p className="mt-2 text-[14px] leading-[1.55] text-black dark:text-white">
          <span className="font-semibold">So what: </span>
          A rival now uses your main claim, word for word. Buyers comparing the two will see the same promise twice.
        </p>
        <p className="mt-2 text-[14px] leading-[1.55] text-[#666] dark:text-[#a1a1a1]">
          <span className="font-semibold text-black dark:text-white">Your move: </span>
          Check whether theirs reads people or only AI answers. If only AI, say so on your comparison page this week.
        </p>
      </article>

      <article className="border-b border-[#eaeaea] p-5 dark:border-[#333]">
        <div className="flex flex-wrap items-center gap-2">
          <Label kind="weakened" />
          <span className="text-[12px] text-[#888]">Peec AI · competitor · 22 Oct 2026</span>
        </div>
        <h3 className="mt-2 text-[16px] font-semibold leading-snug text-black dark:text-white">
          Peec AI ships ranked fixes with evidence, plus an agent
        </h3>
        <p className="mt-2 text-[14px] leading-[1.55] text-black dark:text-white">
          <span className="font-semibold">So what: </span>
          Your table row “ranked list of what to fix first, most trackers: partial” is no longer true for Peec. Your
          “reads people and AI on one method” row is now the only one they don't match.
        </p>
        <p className="mt-2 text-[14px] leading-[1.55] text-[#666] dark:text-[#a1a1a1]">
          <span className="font-semibold text-black dark:text-white">Your move: </span>
          One wording change on the comparison table. No engineering work is justified by this.{" "}
          <a href={PEEC_RELEASE} target="_blank" rel="noreferrer" className="underline">Source</a>
        </p>
      </article>

      <article className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Label kind="worth knowing" />
          <span className="text-[12px] text-[#888]">OpenAI · lab release · this week</span>
        </div>
        <h3 className="mt-2 text-[16px] font-semibold leading-snug text-black dark:text-white">
          GPT-5.5 ships autonomous multi-step agents
        </h3>
        <p className="mt-2 text-[14px] leading-[1.55] text-black dark:text-white">
          <span className="font-semibold">So what: </span>
          Touches how Dr HAOS could run tasks, touches none of your claims. No change needed.
        </p>
      </article>

      <div className="border-t border-[#eaeaea] bg-[#fafafa] px-5 py-3 text-[12px] text-[#888] dark:border-[#333] dark:bg-[#0a0a0a]">
        209 other stories this week did not touch POKPOK. You never saw them.
      </div>
    </div>
  );
}

function Hero() {
  const [url, setUrl] = useState("");
  const subject = encodeURIComponent("Nubble early access");
  const body = encodeURIComponent(`My project: ${url || "(paste your website)"}\n\nTell me when Nubble can read the news for it.`);
  const mailto = `mailto:${CONTACT}?subject=${subject}&body=${body}`;

  return (
    <div id="top">
      <Container className="grid grid-cols-1 gap-12 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-6">
          <Eyebrow>For founders of AI startups</Eyebrow>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.04] tracking-[-0.04em] text-black dark:text-white md:text-[60px]">
            Your competitors moved this week. Here is what it means for you.
          </h1>
          <p className="mt-6 max-w-[540px] text-[19px] leading-[1.55] text-[#666] dark:text-[#a1a1a1]">
            Nubble watches the labs and your competitors every day, throws away everything that doesn't touch your company,
            and tells you what changed and what to do. One line, a short version, or the full story. Every claim with its
            source.
          </p>

          <form
            id="start"
            className="mt-10 flex max-w-[540px] flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = mailto;
            }}
          >
            <label className="sr-only" htmlFor="site">Your website</label>
            <input
              id="site"
              type="url"
              inputMode="url"
              placeholder="https://your-ai-startup.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 flex-1 rounded-md border border-[#eaeaea] bg-white px-4 text-[15px] text-black outline-none placeholder:text-[#999] focus:border-black dark:border-[#333] dark:bg-black dark:text-white dark:focus:border-white"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-black px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc]"
            >
              Read my market <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-3 text-[13px] text-[#888]">
            Paste your website. That is the whole setup. Early access is free while we build.
          </p>
        </div>

        <div className="md:col-span-6" id="brief">
          <BriefPreview />
          <p className="mt-3 text-[12px] text-[#888]">
            This is our own brief. POKPOK is the company we run, Peec AI is our rival. Stories and dates are real. The
            “so what” lines were written by hand in the shape Nubble is being built to produce.
          </p>
        </div>
      </Container>
    </div>
  );
}

/** What Nubble reads from a pasted website, shown as the founder sees it. */
function Setup() {
  return (
    <Section id="setup" className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="grid grid-cols-1 gap-12 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Eyebrow>Setup</Eyebrow>
          <H2>Paste your website. We read it and build your picture.</H2>
          <Lead>
            Products, who they are for, your category, and the competitors and major players in it. Competitors come from a
            live search, not from a model's memory, so each one carries the link we found it at. You correct what we got
            wrong. Usually one thing.
          </Lead>
        </div>
        <div className="md:col-span-7">
          <div className="rounded-lg border border-[#eaeaea] bg-white dark:border-[#333] dark:bg-black">
            <div className="flex items-center gap-2 border-b border-[#eaeaea] px-5 py-3 dark:border-[#333]">
              <span className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">Read from</span>
              <span className="[font-family:'Geist_Mono',monospace] text-[12px] text-black dark:text-white">https://pokpok.ai</span>
            </div>
            <dl className="divide-y divide-[#eaeaea] dark:divide-[#333]">
              <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[140px_1fr]">
                <dt className="text-[13px] text-[#888]">Products</dt>
                <dd className="text-[14px] leading-[1.6] text-black dark:text-white">
                  Brand Perception Truth, a €150 one-off report. AI Visibility Truth, daily tracking of how AI answers describe
                  a brand. Dr HAOS, an agent in Slack, Telegram and Claude.
                </dd>
              </div>
              <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[140px_1fr]">
                <dt className="text-[13px] text-[#888]">Sells to</dt>
                <dd className="text-[14px] leading-[1.6] text-black dark:text-white">Brand and marketing teams that want to know how people and AI read their brand.</dd>
              </div>
              <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[140px_1fr]">
                <dt className="text-[13px] text-[#888]">Category</dt>
                <dd className="text-[14px] leading-[1.6] text-black dark:text-white">Brand perception and AI visibility measurement.</dd>
              </div>
              <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[140px_1fr]">
                <dt className="text-[13px] text-[#888]">Main claim</dt>
                <dd className="text-[14px] leading-[1.6] text-black dark:text-white">“Reads how people perceive the brand. Most trackers: no.”</dd>
              </div>
              <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-[140px_1fr]">
                <dt className="text-[13px] text-[#888]">Competitors</dt>
                <dd className="text-[14px] leading-[1.6] text-black dark:text-white">
                  <a href="https://peec.ai" target="_blank" rel="noreferrer" className="underline">Peec AI</a>, found by live
                  search, and the other AI visibility trackers it found, each with the link it found them at.
                  <span className="mt-2 block text-[13px] text-[#888]">You add the ones we missed and delete the ones that don't matter.</span>
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 border-t border-[#eaeaea] px-5 py-3 dark:border-[#333]">
              <span className="rounded-md border border-black px-3 py-1 text-[12px] text-black dark:border-white dark:text-white">Looks right</span>
              <span className="rounded-md border border-[#eaeaea] px-3 py-1 text-[12px] text-[#666] dark:border-[#333] dark:text-[#a1a1a1]">Fix something</span>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Where the news comes from, and what the filter throws away. */
function Sources() {
  const sources = [
    { name: "Lab releases", detail: "OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek. Release notes and model cards, read the day they appear." },
    { name: "Competitor websites", detail: "Their homepage, pricing page and changelog, re-read every day. A changed sentence is a story." },
    { name: "Launches and press", detail: "Launch posts, press releases, Product Hunt, the founder's own announcements." },
    { name: "Funding and pricing", detail: "Rounds, acquisitions, price changes, free tiers that used to be paid." },
  ];
  return (
    <Section id="sources">
      <Container className="py-20">
        <Eyebrow>Where the news comes from</Eyebrow>
        <H2>We read everything in your category. You see only what touches you.</H2>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#eaeaea] bg-[#eaeaea] dark:border-[#333] dark:bg-[#333] sm:grid-cols-2 md:grid-cols-4">
          {sources.map((s) => (
            <div key={s.name} className="bg-white p-6 dark:bg-black">
              <h3 className="text-[16px] font-semibold text-black dark:text-white">{s.name}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#666] dark:text-[#a1a1a1]">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#eaeaea] bg-[#eaeaea] dark:border-[#333] dark:bg-[#333] md:grid-cols-3">
          <div className="bg-white p-6 dark:bg-black">
            <p className="[font-family:'Geist_Mono',monospace] text-[12px] uppercase tracking-[0.08em] text-[#888]">Read</p>
            <p className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.03em] text-black dark:text-white">212</p>
            <p className="mt-2 text-[14px] text-[#666] dark:text-[#a1a1a1]">stories in the category, one example week</p>
          </div>
          <div className="bg-white p-6 dark:bg-black">
            <p className="[font-family:'Geist_Mono',monospace] text-[12px] uppercase tracking-[0.08em] text-[#888]">Touch your company</p>
            <p className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.03em] text-black dark:text-white">9</p>
            <p className="mt-2 text-[14px] text-[#666] dark:text-[#a1a1a1]">shown, each with a so what. The other 203 are never shown.</p>
          </div>
          <div className="bg-white p-6 dark:bg-black">
            <p className="[font-family:'Geist_Mono',monospace] text-[12px] uppercase tracking-[0.08em] text-[#888]">Need a move</p>
            <p className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.03em] text-black dark:text-white">3</p>
            <p className="mt-2 text-[14px] text-[#666] dark:text-[#a1a1a1]">labelled code red or weakened. The rest say “no change needed”, and mean it.</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-[#888]">
          Labels: <Label kind="code red" /> a rival copied your main claim or shipped your product.{" "}
          <Label kind="weakened" /> one of your claims is now less true. <Label kind="worth knowing" /> relevant, no move needed.
          A quiet week is an empty message. We don't invent news to look busy.
        </p>
      </Container>
    </Section>
  );
}

function Demo() {
  const { data, isLoading, isError } = useQuery<FeedResponse>({
    queryKey: [DEMO_FEED],
    queryFn: async () => {
      const r = await fetch(DEMO_FEED);
      if (!r.ok) throw new Error("feed");
      return r.json();
    },
  });

  const depths = [
    {
      name: "So what?",
      text: "A rival now uses your main claim, word for word. Check whether theirs reads people or only AI answers.",
    },
    {
      name: "Short",
      text: "Peec AI added a “brand perception” view that shows how AI models describe a brand. The release describes evidence from AI answers and cited sources, nothing about human readers.",
    },
    {
      name: "Full",
      text: "The original announcement, dated, with its source, and the sentences each claim above rests on.",
    },
  ];

  return (
    <Section id="demo" className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="py-20">
        <Eyebrow>Three depths</Eyebrow>
        <H2>One line, a few sentences, or the whole story. Swipe to choose.</H2>
        <Lead>
          Every story exists at three depths. Read the so what and move on, or go all the way to the source. You decide
          per story, with a swipe.
        </Lead>

        <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {depths.map((d, i) => (
            <li key={d.name} className="rounded-lg border border-[#eaeaea] bg-white p-5 dark:border-[#333] dark:bg-black">
              <div className="flex items-center justify-between">
                <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">{d.name}</p>
                <div className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((k) => (
                    <span key={k} className={`h-1.5 w-4 rounded-full ${k <= i ? "bg-black dark:bg-white" : "bg-[#eaeaea] dark:bg-[#333]"}`} />
                  ))}
                </div>
              </div>
              <p className={`mt-3 leading-[1.55] ${i === 0 ? "text-[16px] font-medium text-black dark:text-white" : "text-[14px] text-[#444] dark:text-[#ccc]"}`}>{d.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Live, try it</Eyebrow>
            <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-black dark:text-white">
              The real reader with this week's AI news{data ? `, ${formatDate(data.date)}` : ""}.
            </h3>
            <p className="mt-1 text-[14px] text-[#666] dark:text-[#a1a1a1]">
              Swipe a story left or right, or use the minus and plus at the top. Nothing here is mocked.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#666] dark:text-[#a1a1a1]">
            <ArrowLeftRight size={14} /> Swipe or press Shift + arrow keys
          </div>
        </div>

        <div className="mt-6 h-[560px] overflow-hidden rounded-lg border border-[#eaeaea] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-[#333] dark:bg-black">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#888]" />
            </div>
          )}
          {isError && (
            <div className="flex h-full items-center justify-center text-[14px] text-[#888]">
              The edition could not be loaded.{" "}
              <Link href="/" className="ml-1 underline">Open the reader</Link>
            </div>
          )}
          {data && data.stories?.length > 0 && <NubbleReader document={feedToDocument(data)} />}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonSecondary href="/">Open the full reader</ButtonSecondary>
          <ButtonSecondary href="/ai-branding">AI and branding edition</ButtonSecondary>
          <ButtonSecondary href="/ai-ecommerce">AI e-commerce edition</ButtonSecondary>
        </div>
      </Container>
    </Section>
  );
}

function Outputs() {
  const items = [
    {
      title: "This month's investor update paragraph",
      example: "“Two model releases touched our category. One makes our data layer more valuable, one makes our chat layer a commodity. We're moving pricing to the data layer.”",
    },
    {
      title: "The why-now slide",
      example: "A dated timeline of the moves in your category, each with its source. The slide every seed deck has and most seed decks fake.",
    },
    {
      title: "The answer to “isn't this just a wrapper?”",
      example: "Their sentence, your sentence, the exact difference. For the sales call, the partner meeting, and the comment under your launch post.",
    },
    {
      title: "A post your rival can't write",
      example: "Your angle on this week's release, with their own pricing page as the proof. Post it or don't. It's yours.",
    },
  ];
  return (
    <Section id="outputs">
      <Container className="py-20">
        <Eyebrow>What you get back</Eyebrow>
        <H2>Every brief turns into something you can send.</H2>
        <Lead>
          For every story that matters, Nubble hands you the piece you'd otherwise write at midnight. Each one starts from
          your company, not from the article.
        </Lead>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((it) => (
            <div key={it.title} className="rounded-lg border border-[#eaeaea] bg-white p-6 dark:border-[#333] dark:bg-black">
              <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-black dark:text-white">{it.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#666] dark:text-[#a1a1a1]">{it.example}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Where() {
  const places = [
    { name: "Slack", status: "coming", body: "The brief in the channel you already argue in. Ask it questions in a thread." },
    { name: "Telegram", status: "coming", body: "Same brief, same agent, on your phone at 11pm." },
    { name: "Inside Claude and ChatGPT", status: "coming", body: "Connect Nubble as a tool and ask “what changed for us this week?” from the window you already have open." },
    { name: "This reader", status: "live", body: "For the day you want to go deep on one story at your own pace." },
  ];
  return (
    <Section id="where" className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="py-20">
        <Eyebrow>Where it lives</Eyebrow>
        <H2>You will not open another dashboard. Neither would we.</H2>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#eaeaea] bg-[#eaeaea] dark:border-[#333] dark:bg-[#333] sm:grid-cols-2 md:grid-cols-4">
          {places.map((p) => (
            <div key={p.name} className="bg-white p-6 dark:bg-black">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-semibold text-black dark:text-white">{p.name}</h3>
                <span className={`[font-family:'Geist_Mono',monospace] rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${p.status === "live" ? "border-black text-black dark:border-white dark:text-white" : "border-[#eaeaea] text-[#888] dark:border-[#333]"}`}>
                  {p.status}
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#666] dark:text-[#a1a1a1]">{p.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function FinalCall() {
  return (
    <Section>
      <Container className="py-24 text-center">
        <H2>Paste your site. We'll send the first brief.</H2>
        <Lead>
          <span className="mx-auto block">If it's wrong, tell us and it gets less wrong. Early access is free while we build, and we'll tell you before it costs anything.</span>
        </Lead>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonPrimary href="#start">Get early access</ButtonPrimary>
          <ButtonSecondary href="/">Try the reader</ButtonSecondary>
        </div>
      </Container>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#eaeaea] dark:border-[#333]">
      <Container className="flex flex-col gap-4 py-10 text-[13px] text-[#888] md:flex-row md:items-center md:justify-between">
        <p>
          nubble.me · The method behind Nubble is open and published as a research paper. The reader is real. The rest is
          being built, and we say so.
        </p>
        <p>
          By{" "}
          <a href="https://pokpok.ai" className="underline hover:text-black dark:hover:text-white" target="_blank" rel="noreferrer">
            POKPOK
          </a>{" "}
          · <a href={`mailto:${CONTACT}`} className="underline hover:text-black dark:hover:text-white">{CONTACT}</a>
        </p>
      </Container>
    </footer>
  );
}

export default function FoundersLanding() {
  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-white text-black antialiased [-webkit-overflow-scrolling:touch] dark:bg-black dark:text-white" style={{ fontFamily: "Geist, 'Satoshi', Inter, sans-serif" }}>
      <Nav />
      <main>
        <Hero />
        <Setup />
        <Sources />
        <Demo />
        <Outputs />
        <Where />
        <FinalCall />
      </main>
      <Footer />
    </div>
  );
}
