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

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#eaeaea] bg-white/80 backdrop-blur dark:border-[#333] dark:bg-black/80">
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <span className="inline-block h-5 w-5 rounded-full bg-black dark:bg-white" aria-hidden />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-black dark:text-white">nubble</span>
        </a>
        <nav className="hidden items-center gap-6 text-[14px] text-[#666] dark:text-[#a1a1a1] md:flex">
          <a href="#demo" className="hover:text-black dark:hover:text-white">Demo</a>
          <a href="#how" className="hover:text-black dark:hover:text-white">How it works</a>
          <a href="#outputs" className="hover:text-black dark:hover:text-white">What you get</a>
          <a href="#where" className="hover:text-black dark:hover:text-white">Where it lives</a>
        </nav>
        <ButtonPrimary href="#start">Get early access</ButtonPrimary>
      </Container>
    </header>
  );
}

function Hero() {
  const [url, setUrl] = useState("");
  const subject = encodeURIComponent("Nubble early access");
  const body = encodeURIComponent(`My project: ${url || "(paste your website)"}\n\nTell me when Nubble can read the news for it.`);
  const mailto = `mailto:${CONTACT}?subject=${subject}&body=${body}`;

  return (
    <div id="top">
      <Container className="grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-7">
          <Eyebrow>For founders</Eyebrow>
          <h1 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.04em] text-black dark:text-white md:text-[64px]">
            You don't have time to read the news.
          </h1>
          <p className="mt-6 max-w-[560px] text-[19px] leading-[1.55] text-[#666] dark:text-[#a1a1a1]">
            Nubble reads it for you, keeps only what touches your company, and tells you what changed and what to do.
            In one line, in a short version, or in full. Your choice, every story.
          </p>

          <form
            id="start"
            className="mt-10 flex max-w-[560px] flex-col gap-3 sm:flex-row"
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
              placeholder="https://yourstartup.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 flex-1 rounded-md border border-[#eaeaea] bg-white px-4 text-[15px] text-black outline-none placeholder:text-[#999] focus:border-black dark:border-[#333] dark:bg-black dark:text-white dark:focus:border-white"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-black px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc]"
            >
              Paste your link <ArrowRight size={16} />
            </button>
          </form>
          <p className="mt-3 text-[13px] text-[#888]">
            That's the whole setup. Nubble reads your site, works out what you sell and who you're up against. You only correct it.
          </p>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-lg border border-[#eaeaea] bg-[#fafafa] p-6 dark:border-[#333] dark:bg-[#0a0a0a]">
            <Eyebrow>One story, three depths</Eyebrow>
            <ol className="mt-4 space-y-4">
              <li className="rounded-md border border-[#eaeaea] bg-white p-4 dark:border-[#333] dark:bg-black">
                <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">So what?</p>
                <p className="mt-1 text-[15px] font-medium leading-snug text-black dark:text-white">
                  A rival now says your main claim in your words. Verify their page, then change one sentence on yours.
                </p>
              </li>
              <li className="rounded-md border border-[#eaeaea] bg-white p-4 dark:border-[#333] dark:bg-black">
                <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">Short</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[#444] dark:text-[#ccc]">
                  The release describes ranked fixes with evidence behind each one. It says nothing about how people read the brand, which is still your difference.
                </p>
              </li>
              <li className="rounded-md border border-[#eaeaea] bg-white p-4 dark:border-[#333] dark:bg-black">
                <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">Full</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[#666] dark:text-[#a1a1a1]">
                  The original announcement, with its date, source and the sentences each claim rests on.
                </p>
              </li>
            </ol>
            <p className="mt-4 text-[12px] text-[#888]">Illustration. The demo below is real.</p>
          </div>
        </div>
      </Container>
    </div>
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

  return (
    <Section id="demo" className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="py-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Live demo</Eyebrow>
            <H2>The same stories, at the depth you want.</H2>
            <Lead>
              This is the real reader with the latest AI News edition{data ? `, ${formatDate(data.date)}` : ""}. Swipe a story left or right,
              or use the minus and plus at the top, to go from one line to the full story.
            </Lead>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#666] dark:text-[#a1a1a1]">
            <ArrowLeftRight size={14} /> Swipe or press Shift + arrow keys
          </div>
        </div>

        <div className="mt-10 h-[680px] overflow-hidden rounded-lg border border-[#eaeaea] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:border-[#333] dark:bg-black">
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

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Paste your link",
      body: "Nubble reads your website and works out what you sell, who it's for, which category you play in, and who your rivals are. You confirm or fix it in a minute. No forms.",
    },
    {
      n: "02",
      title: "We read everything, you see almost nothing",
      body: "Every day Nubble reads the news and your rivals' announcements. Anything that doesn't touch your company is thrown away before you see it. A quiet week is a quiet week.",
    },
    {
      n: "03",
      title: "You get the so what, with proof",
      body: "For each story that matters: what changed for you and what to do, in one line. Swipe for the short version or the full story. Every claim points at the sentence it came from.",
    },
  ];
  return (
    <Section id="how">
      <Container className="py-20">
        <Eyebrow>How it works</Eyebrow>
        <H2>Three steps. The first one is the only one you do.</H2>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#eaeaea] bg-[#eaeaea] dark:border-[#333] dark:bg-[#333] md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="bg-white p-8 dark:bg-black">
              <p className="[font-family:'Geist_Mono',monospace] text-[12px] text-[#888]">{s.n}</p>
              <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-black dark:text-white">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#666] dark:text-[#a1a1a1]">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Outputs() {
  const items = [
    {
      title: "Investor update paragraph",
      example: "“Three things moved in our market this month. One rival now offers ranked fixes with evidence; we verified their page and sharpened one line on ours. Nothing else changes our plan.”",
    },
    {
      title: "Deck slide: why now",
      example: "A dated timeline of category moves, each with its source. The market-timing slide, written from what actually happened.",
    },
    {
      title: "LinkedIn post, in your voice",
      example: "Your take on the week's news with the angle that sets you apart built in, and the rival's own words as the proof.",
    },
    {
      title: "The answer to “isn't X the same?”",
      example: "Their sentence, your sentence, and the exact difference. Ready before the sales call, not after it.",
    },
  ];
  return (
    <Section id="outputs" className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="py-20">
        <Eyebrow>What you get back</Eyebrow>
        <H2>Not a summary. Something you can send today.</H2>
        <Lead>
          Reading is the input. The output is a piece you paste somewhere without rewriting it. Every piece starts from your
          company, not from the article, so the angle is always why this makes you different.
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
    { name: "Slack", body: "A short brief in the channel you already read. Ask it questions in a thread." },
    { name: "Telegram", body: "The same brief and the same agent, on your phone." },
    { name: "Inside Claude and ChatGPT", body: "Connect Nubble as a tool and ask “what changed for us this week?” from where you already work." },
    { name: "The reader", body: "This website, for when you want to go deep on a story at your own pace." },
  ];
  return (
    <Section id="where">
      <Container className="py-20">
        <Eyebrow>Where it lives</Eyebrow>
        <H2>You don't open another app. It comes to you.</H2>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[#eaeaea] bg-[#eaeaea] dark:border-[#333] dark:bg-[#333] sm:grid-cols-2 md:grid-cols-4">
          {places.map((p) => (
            <div key={p.name} className="bg-white p-6 dark:bg-black">
              <h3 className="text-[16px] font-semibold text-black dark:text-white">{p.name}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#666] dark:text-[#a1a1a1]">{p.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Promise() {
  const rules = [
    "Nothing irrelevant is ever shown. If a week is quiet, we say nothing.",
    "Every claim links to the sentence it rests on. Guesses are marked as guesses.",
    "Nubble never invents urgency. “Keep your plan” is a real answer.",
    "Say “ignore this” once and it stays ignored.",
  ];
  return (
    <Section className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="grid grid-cols-1 gap-12 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Eyebrow>Four rules</Eyebrow>
          <H2>Information should earn your attention.</H2>
        </div>
        <ul className="md:col-span-7 divide-y divide-[#eaeaea] rounded-lg border border-[#eaeaea] bg-white dark:divide-[#333] dark:border-[#333] dark:bg-black">
          {rules.map((r, i) => (
            <li key={r} className="flex gap-4 p-5">
              <span className="[font-family:'Geist_Mono',monospace] text-[12px] text-[#888]">0{i + 1}</span>
              <span className="text-[15px] leading-[1.6] text-black dark:text-white">{r}</span>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

function FinalCall() {
  return (
    <Section>
      <Container className="py-24 text-center">
        <H2>Read less. Miss nothing. Send something.</H2>
        <Lead>
          <span className="mx-auto block">Paste your website and we'll set Nubble up for your company.</span>
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
          nubble.me · The method behind Nubble is open and described in a research paper. Nothing here promises a measured
          result yet; the reading experience is real, the rest is being built.
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
    <div className="min-h-screen bg-white text-black antialiased dark:bg-black dark:text-white" style={{ fontFamily: "Geist, 'Satoshi', Inter, sans-serif" }}>
      <Nav />
      <main>
        <Hero />
        <Demo />
        <HowItWorks />
        <Outputs />
        <Where />
        <Promise />
        <FinalCall />
      </main>
      <Footer />
    </div>
  );
}
