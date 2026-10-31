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
          <Eyebrow>We run an AI company. This is the brief we wanted and nobody sold us.</Eyebrow>
          <h1 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.04em] text-black dark:text-white md:text-[64px]">
            OpenAI shipped your feature on Tuesday.
          </h1>
          <p className="mt-4 text-[22px] font-medium leading-[1.3] tracking-[-0.02em] text-black dark:text-white md:text-[26px]">
            Here's what it covers, what it doesn't, and whether you should care.
          </p>
          <p className="mt-6 max-w-[560px] text-[19px] leading-[1.55] text-[#666] dark:text-[#a1a1a1]">
            Every week a lab ships something that might be your roadmap, and three competitors raise. You can't read it all
            and still ship. Nubble reads it, bins everything that doesn't touch your company, and gives you one line: what
            changed and what it means for your plan.
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
            That's the setup. We read your site and work out what you ship, who pays for it, and who's coming for you. You fix
            what we got wrong, usually one thing. No call, no forms.
          </p>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-lg border border-[#eaeaea] bg-[#fafafa] p-6 dark:border-[#333] dark:bg-[#0a0a0a]">
            <Eyebrow>One story. Three depths. Your call.</Eyebrow>
            <ol className="mt-4 space-y-4">
              <li className="rounded-md border border-[#eaeaea] bg-white p-4 dark:border-[#333] dark:bg-black">
                <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">So what?</p>
                <p className="mt-1 text-[15px] font-medium leading-snug text-black dark:text-white">
                  OpenAI just shipped the feature you charge $200 a month for, as a free tier. Your wedge is now your demo.
                  Check their limits before you touch pricing.
                </p>
              </li>
              <li className="rounded-md border border-[#eaeaea] bg-white p-4 dark:border-[#333] dark:bg-black">
                <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">Short</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[#444] dark:text-[#ccc]">
                  The release covers single-document extraction, no API access, a 10-file cap. Your multi-document, API-first
                  pipeline is not covered. Not yet.
                </p>
              </li>
              <li className="rounded-md border border-[#eaeaea] bg-white p-4 dark:border-[#333] dark:bg-black">
                <p className="[font-family:'Geist_Mono',monospace] text-[11px] uppercase tracking-[0.08em] text-[#888]">Full</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[#666] dark:text-[#a1a1a1]">
                  The original post, with its date, its source, and the sentences each claim above rests on.
                </p>
              </li>
            </ol>
            <p className="mt-4 text-[12px] text-[#888]">Illustration. The demo below is real. The reader is built; the rest is being built, and we say so.</p>
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
            <H2>This week's AI news. One line, three sentences, or the whole thing.</H2>
            <Lead>
              You pick, per story. This is the real reader with the latest AI News edition{data ? `, ${formatDate(data.date)}` : ""}.
              Swipe a story left or right, or use the minus and plus at the top. Nothing here is mocked.
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
      body: "We read your site and work out what you ship, who pays for it, which category you're in, and who's coming for you. You fix what we got wrong. Usually one thing.",
    },
    {
      n: "02",
      title: "We read everything. You see what touches you.",
      body: "Model releases, competitor launches, pricing changes, who just raised. Anything that doesn't touch your company dies before you see it. A quiet week is an empty message. We don't invent news to look busy.",
    },
    {
      n: "03",
      title: "You get the so what, and the sentence it came from",
      body: "What changed for you, in one line. Swipe for the short version or the full story. Tap a claim and see where it came from. Guesses say \"guess\".",
    },
  ];
  return (
    <Section id="how">
      <Container className="py-20">
        <Eyebrow>How it works</Eyebrow>
        <H2>Three steps. You do one.</H2>
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
      title: "The answer to “isn't this just a wrapper?”",
      example: "Their sentence, your sentence, the exact difference. For the sales call, the partner meeting, and the comment under your launch post.",
    },
    {
      title: "This month's investor update paragraph",
      example: "“Two model releases touched our category. One makes our data layer more valuable, one makes our chat layer a commodity. We're moving pricing to the data layer.”",
    },
    {
      title: "The why-now slide",
      example: "A dated timeline of the moves in your category, each with its source. The slide every seed deck has and most seed decks fake.",
    },
    {
      title: "A take your rival can't make",
      example: "Your angle on this week's release, with their own pricing page as the proof. Post it or don't. It's yours.",
    },
  ];
  return (
    <Section id="outputs" className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="py-20">
        <Eyebrow>What you get back</Eyebrow>
        <H2>The answer to “isn't this just ChatGPT?”, ready before the partner meeting.</H2>
        <Lead>
          Nubble doesn't stop at reading. For every story that matters, it hands you the piece you'd otherwise write at
          midnight. Each one starts from your company, not from the article.
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
    { name: "Slack", status: "coming", body: "A brief in the channel you already argue in. Ask it questions in a thread." },
    { name: "Telegram", status: "coming", body: "Same brief, same agent, on your phone at 11pm." },
    { name: "Inside Claude and ChatGPT", status: "coming", body: "Connect Nubble as a tool and ask “what changed for us this week?” from the window you already have open." },
    { name: "This reader", status: "live", body: "For the day you want to go deep on one story at your own pace." },
  ];
  return (
    <Section id="where">
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

function Promise() {
  const rules = [
    "Nothing irrelevant is ever shown. A quiet week is a quiet week.",
    "Every claim links to the sentence it rests on. Guesses are labelled.",
    "We never invent urgency. “Keep your plan” is a real answer, and sometimes the right one.",
    "Say “ignore this” once. It stays ignored.",
  ];
  return (
    <Section className="bg-[#fafafa] dark:bg-[#0a0a0a]">
      <Container className="grid grid-cols-1 gap-12 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <Eyebrow>Four rules</Eyebrow>
          <H2>We built this because we were drowning too.</H2>
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
