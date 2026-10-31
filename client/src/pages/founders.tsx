import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, motion, useInView, useReducedMotion, type PanInfo } from "framer-motion";
import { NubbleReader } from "@/components/NubbleReader";
import type { ContentDocument } from "@/lib/sample-content";
import {
  BRIEF,
  CONTACT,
  INVESTOR_ANSWERS,
  LABELS,
  OTHER_ANSWERS,
  PAINS,
  PLACES,
  PROFILE,
  RUN,
  SIZES,
  SOURCES,
  type Label,
} from "./founders-data";

/*
 * /founders: built section by section from the "Nubble positioning" document.
 * Design tokens (light only, set explicitly):
 *   paper #F3F4F1 · card #FFFFFF · ink #141518 · mute #5B5F66 · line #DCDDD8
 *   red #D42B1A  = Code red, and nothing else
 *   amber #C26F0C = the So what signal (Nubble's own amber), and the Weakened label
 * Type: Zodiak (display, Nubble's serif) + Satoshi (body), both already loaded in index.html.
 * Layout: left-aligned, 1120px column, hero splits promise | brief on desktop.
 */

const INK = "#141518";

/* ─── Small building blocks ─── */

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1120px] px-5 md:px-8 ${className}`}>{children}</div>;
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="max-w-[24ch] font-display text-[30px] font-bold leading-[1.08] tracking-[-0.01em] text-ink [text-wrap:balance] md:text-[44px]">
      {children}
    </h2>
  );
}

function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`max-w-[62ch] text-[17px] leading-[1.6] text-mute md:text-[19px] ${className}`}>{children}</p>;
}

function LabelChip({ label }: { label: Label }) {
  const cls =
    label === "code-red"
      ? "bg-red text-white"
      : label === "weakened"
        ? "border border-amber text-amber"
        : "border border-[#9a9ea5] text-mute";
  return (
    <span className={`inline-flex items-center rounded-[4px] px-2 py-[3px] text-[12px] font-bold tracking-[0.02em] ${cls}`}>
      {LABELS[label].name}
    </span>
  );
}

function SoWhat({ children, title = "So what" }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="border-l-[3px] border-amber pl-3">
      <p className="text-[12px] font-bold text-amber">{title}</p>
      <p className="mt-0.5 text-[16px] font-medium leading-[1.45] text-ink">{children}</p>
    </div>
  );
}

function Ext({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const internal = href.startsWith("#");
  return (
    <a
      href={href}
      {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className={`underline decoration-[#b9bbb5] underline-offset-[3px] hover:decoration-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      {children}
    </a>
  );
}

/** Counts from `from` to `to` once, when visible. Shows the final number at rest. */
function Count({ from, to, delay = 0 }: { from: number; to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(to);
  useEffect(() => {
    if (!inView || reduce) return;
    setN(from);
    const c = animate(from, to, {
      duration: 1.1,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => c.stop();
  }, [inView, reduce, from, to, delay]);
  return (
    <span ref={ref} className="tabular-nums">
      {n}
    </span>
  );
}

function EmailForm({ id, button }: { id: string; button: string }) {
  const [url, setUrl] = useState("");
  const subject = encodeURIComponent("Nubble: my first brief");
  const body = encodeURIComponent(`My website: ${url || "(paste it here)"}\n\nSend me my first Nubble brief.`);
  return (
    <form
      className="flex w-full max-w-[560px] flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = `mailto:${CONTACT}?subject=${subject}&body=${body}`;
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Your website
      </label>
      <input
        id={id}
        type="text"
        inputMode="url"
        autoComplete="url"
        placeholder="yourstartup.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-[50px] w-full min-w-0 rounded-[8px] sm:w-auto sm:flex-1 border-[1.5px] border-ink bg-white px-4 text-[17px] text-ink outline-none placeholder:text-[#8d9097] focus-visible:ring-2 focus-visible:ring-amber"
      />
      <button
        type="submit"
        className="h-[50px] whitespace-nowrap rounded-[8px] bg-ink px-6 text-[16px] font-bold text-white transition-colors hover:bg-[#2b2d33] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
      >
        {button}
      </button>
    </form>
  );
}

/* ─── 1. Opening ─── */

function BriefCard({ i, story }: { i: number; story: (typeof BRIEF)[number] }) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + i * 0.15, duration: 0.45, ease: "easeOut" }}
      className="flex flex-col gap-3 rounded-[10px] border border-line bg-white p-4 md:p-5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <LabelChip label={story.label} />
        <span className="text-[13px] text-mute">{story.date}</span>
      </div>
      <h3 className="text-[18px] font-bold leading-[1.3] text-ink">{story.title}</h3>
      <p className="text-[14px] leading-[1.5] text-mute">
        “{story.quote}” <Ext href={story.url}>{story.source}</Ext>
      </p>
      <SoWhat>{story.soWhat}</SoWhat>
      {story.move && (
        <p className="text-[15px] leading-[1.5] text-ink">
          <b>Your move:</b> {story.move}
        </p>
      )}
    </motion.article>
  );
}

function Opening() {
  const thrown = RUN.filter((r) => !r.kept).length;
  const kept = RUN.length - thrown;
  return (
    <section className="pb-16 pt-6 md:pb-24 md:pt-16">
      <Wrap className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4 md:gap-5 lg:pt-6">
          <p className="text-[15px] font-medium leading-[1.45] text-mute md:text-[16px]">You run an AI startup. Small team, one product, a homepage that says why you.</p>
          <h1 className="font-display text-[31px] font-bold leading-[1.06] tracking-[-0.015em] text-ink [text-wrap:balance] md:text-[58px]">
            Stop reading the news, competitors' blogs, and other founders' self-promoting B.S. posts on LinkedIn.
          </h1>
          <p className="max-w-[40ch] text-[18px] leading-[1.45] text-ink md:text-[22px]">
            Nubble tells you what the news means for your company, shows you the proof, and gives you something you can send.
          </p>
          <div className="mt-1 flex flex-col gap-2">
            <EmailForm id="site-top" button="Get my first brief" />
            <p className="text-[14px] text-mute">
              Free while we build. Today the reader at nubble.me is live. Slack, Telegram and Claude are being built.
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-[14px] bg-[#E7E8E3] p-3 md:p-4">
          <div className="px-1 pb-3 pt-1">
            <p className="text-[15px] font-bold text-ink">Example brief for pokpok.ai</p>
            <p className="text-[13px] leading-[1.45] text-mute">
              Run by hand today, the way Nubble does it. Rival posts, 15 Sep to 31 Oct 2026.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {BRIEF.map((s, i) => (
              <BriefCard key={s.title} i={i} story={s} />
            ))}
          </div>
          <p className="px-1 pt-3 text-[14px] text-ink">
            {RUN.length} rival posts read. {kept} kept. <b><Count from={0} to={thrown} delay={0.8} /> never shown.</b>{" "}
            <Ext href="#filter" className="text-mute">See all {RUN.length}</Ext>
          </p>
        </div>
      </Wrap>
      <Wrap>
        <p className="mt-10 max-w-[62ch] text-[17px] leading-[1.6] text-ink md:mt-14">
          We built it because we are that founder. POKPOK is our company. Everything below happened to us.
        </p>
      </Wrap>
    </section>
  );
}

/* ─── 2. Why ─── */

function PainCard({ p }: { p: (typeof PAINS)[number] }) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-[10px] border border-line bg-white p-5">
      {"group" in p && p.group && <p className="text-[13px] font-bold text-mute">{p.group}</p>}
      {"label" in p && p.label && (
        <div>
          <LabelChip label={p.label} />
        </div>
      )}
      <h3 className="text-[20px] font-bold leading-[1.25] text-ink [text-wrap:balance]">{p.head}</h3>
      <p className="text-[16px] leading-[1.6] text-[#33363b]">{p.body}</p>
      {"proof" in p && p.proof && (
        <p className="mt-auto pt-1 text-[14px] text-mute">
          Proof: <Ext href={p.proof.url}>{p.proof.text}</Ext>
        </p>
      )}
    </article>
  );
}

function Why() {
  return (
    <section className="border-t border-line py-16 md:py-24">
      <Wrap className="flex flex-col gap-10">
        <H2>Six things that happen to you (and to us at pokpok.ai).</H2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {PAINS.slice(0, 3).map((p) => (
            <PainCard key={p.head} p={p} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {PAINS.slice(3).map((p) => (
            <PainCard key={p.head} p={p} />
          ))}
        </div>
        <div className="rounded-[12px] bg-ink p-6 text-white md:p-10">
          <p className="max-w-[60ch] text-[18px] leading-[1.6] md:text-[21px]">
            <b>What you have today:</b> X, newsletters, investor group chats, a ChatGPT window. All of it tells you what
            happened to everyone. None of it tells you what it means for your company. None of it throws away the part that has
            nothing to do with you, which is most of it. So you read for two hours a day you do not have, or you skip it and get
            caught.
          </p>
        </div>
      </Wrap>
    </section>
  );
}

/* ─── 3. Setup ─── */

function Setup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState(PROFILE.site);
  const [shown, setShown] = useState(99);
  const [note, setNote] = useState(false);

  useEffect(() => {
    if (!inView || reduce) return;
    setTyped("");
    setShown(0);
    const timers: number[] = [];
    PROFILE.site.split("").forEach((_, i) => {
      timers.push(window.setTimeout(() => setTyped(PROFILE.site.slice(0, i + 1)), 90 * (i + 1)));
    });
    const base = 90 * PROFILE.site.length + 350;
    for (let r = 1; r <= PROFILE.rows.length + 1; r++) {
      timers.push(window.setTimeout(() => setShown(r), base + r * 260));
    }
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const scanning = shown === 0;

  return (
    <section className="border-t border-line py-16 md:py-24">
      <Wrap className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4">
          <H2>Paste your website. That is the whole setup.</H2>
          <Lead>
            Nubble reads it and works out what you sell, who buys it, what market you are in, and your main claim. Then it finds
            your competitors and the big players. It searches the web live. It does not answer from memory. Every company comes
            with the link where it was found.
          </Lead>
          <p className="font-display text-[24px] font-bold leading-[1.2] text-ink md:text-[28px]">You correct. You never fill in a form.</p>
        </div>

        <div ref={ref} className="min-w-0 rounded-[14px] border border-line bg-white p-4 md:p-6">
          <div className="relative flex h-[52px] items-center overflow-hidden rounded-[8px] border-[1.5px] border-ink px-4 text-[17px] text-ink">
            <span>{typed}</span>
            {!reduce && typed.length < PROFILE.site.length && <span className="ml-0.5 h-5 w-[2px] animate-pulse bg-ink" />}
            {scanning && !reduce && typed.length === PROFILE.site.length && (
              <motion.span
                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[#c26f0c33] to-transparent"
                initial={{ left: "-15%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              />
            )}
          </div>
          <p className="mt-5 text-[14px] font-bold text-mute">What Nubble read from pokpok.ai</p>
          <dl className="mt-2 flex flex-col">
            {PROFILE.rows.map((r, i) => (
              <motion.div
                key={r.k}
                initial={false}
                animate={{ opacity: shown > i ? 1 : 0.15 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-t border-line py-3 md:grid-cols-[120px_minmax(0,1fr)]"
              >
                <dt className="text-[14px] font-bold text-mute">{r.k}</dt>
                <dd className="text-[15px] leading-[1.5] text-ink">{r.v}</dd>
              </motion.div>
            ))}
            <motion.div
              initial={false}
              animate={{ opacity: shown > PROFILE.rows.length ? 1 : 0.15 }}
              transition={{ duration: 0.3 }}
              className="border-t border-line py-3"
            >
              <dt className="text-[14px] font-bold text-mute">Competitors and big players</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {PROFILE.competitors.map((c, i) => (
                  <motion.a
                    key={c.name}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={false}
                    animate={shown > PROFILE.rows.length ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0.4 }}
                    transition={{ delay: reduce ? 0 : i * 0.06, type: "spring", stiffness: 420, damping: 22 }}
                    className="group inline-flex flex-col rounded-[8px] border border-line px-3 py-1.5 hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                  >
                    <span className="text-[14px] font-bold text-ink">{c.name}</span>
                    <span className="text-[12px] text-mute group-hover:underline">found at {c.foundAt}</span>
                  </motion.a>
                ))}
              </dd>
            </motion.div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNote(true)}
              className="h-11 rounded-[8px] bg-ink px-5 text-[15px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              Looks right
            </button>
            <button
              type="button"
              onClick={() => setNote(true)}
              className="h-11 rounded-[8px] border-[1.5px] border-ink px-5 text-[15px] font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              Fix something
            </button>
          </div>
          {note && (
            <p role="status" className="mt-3 text-[14px] text-mute">
              This is the pokpok.ai example. Paste your own site above to get yours.
            </p>
          )}
        </div>
      </Wrap>
    </section>
  );
}

/* ─── 4. Sources and filter ─── */

function Filter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const [sorted, setSorted] = useState(true);
  useEffect(() => {
    if (!inView || reduce) return;
    setSorted(false);
    const t = window.setTimeout(() => setSorted(true), 900);
    return () => clearTimeout(t);
  }, [inView, reduce]);

  const kept = RUN.filter((r) => r.kept).length;
  const moves = RUN.filter((r) => r.kept && r.kept !== "worth-knowing").length;

  return (
    <section id="filter" className="scroll-mt-6 border-t border-line py-16 md:py-24">
      <Wrap className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <H2>Every day it reads the sources.</H2>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border border-line bg-[#DCDDD8] sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex min-w-0 flex-col gap-1.5 bg-white p-5 md:p-6">
              <h3 className="text-[18px] font-bold text-ink">{s.name}</h3>
              <p className="text-[16px] leading-[1.55] text-[#33363b]">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
            <h3 className="font-display text-[26px] font-bold leading-[1.15] text-ink md:text-[32px]">
              It throws away what does not concern you.
            </h3>
            <Lead>Silently. You never see it. There is no “nothing relevant today” message either. A quiet week is a quiet week.</Lead>
            <div className="mt-2 flex gap-8">
              <div>
                <p className="font-display text-[48px] font-bold leading-none text-ink">
                  <Count from={0} to={RUN.length} />
                </p>
                <p className="mt-1 text-[14px] text-mute">read</p>
              </div>
              <div>
                <p className="font-display text-[48px] font-bold leading-none text-ink">
                  <Count from={RUN.length} to={kept} delay={0.9} />
                </p>
                <p className="mt-1 text-[14px] text-mute">kept</p>
              </div>
              <div>
                <p className="font-display text-[48px] font-bold leading-none text-amber">
                  <Count from={kept} to={moves} delay={1.6} />
                </p>
                <p className="mt-1 text-[14px] text-mute">need a move</p>
              </div>
            </div>
          </div>

          <div ref={ref} className="min-w-0 rounded-[14px] border border-line bg-white p-4 md:p-6">
            <p className="text-[15px] font-bold text-ink">Example run for pokpok.ai</p>
            <p className="text-[13px] leading-[1.45] text-mute">
              Done by hand today, the way Nubble does it. Rival posts, 15 Sep to 31 Oct 2026.
            </p>
            <ol className="mt-3 flex flex-col">
              {RUN.map((r, i) => {
                const dim = sorted && !r.kept;
                return (
                  <motion.li
                    key={r.title}
                    initial={false}
                    animate={{ opacity: dim ? 0.5 : 1 }}
                    transition={{ duration: 0.35, delay: reduce ? 0 : i * 0.04 }}
                    className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-baseline gap-3 border-t border-line py-2.5"
                  >
                    <span className="text-[13px] tabular-nums text-mute">{r.date}</span>
                    <Ext href={r.url} className={`text-[15px] leading-[1.35] text-ink ${dim ? "line-through decoration-[#9a9ea5]" : ""}`}>
                      {r.title}
                    </Ext>
                    <span className="justify-self-end">
                      {r.kept ? (
                        <motion.span
                          initial={false}
                          animate={{ opacity: sorted ? 1 : 0, x: sorted ? 0 : 6 }}
                          transition={{ duration: 0.3 }}
                          className="inline-block"
                        >
                          <LabelChip label={r.kept} />
                        </motion.span>
                      ) : (
                        <span className="text-[12px] text-mute">thrown</span>
                      )}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
            <p className="mt-3 text-[13px] leading-[1.5] text-mute">
              This example read rivals' posts and press releases only, by headline and first paragraph. Not the labs, not X, not
              LinkedIn. Every row links its source.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-display text-[26px] font-bold leading-[1.15] text-ink md:text-[32px]">Stories carry labels.</h3>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border border-line bg-[#DCDDD8] md:grid-cols-3">
            {(Object.keys(LABELS) as Label[]).map((l) => (
              <div key={l} className="flex min-w-0 flex-col items-start gap-2 bg-white p-5 md:p-6">
                <LabelChip label={l} />
                <p className="text-[16px] leading-[1.5] text-ink">{LABELS[l].meaning}</p>
              </div>
            ))}
          </div>
          <Lead>
            A label is always tied to the rival's own sentence, which you can see. If we got one wrong, say so once and it stays
            ignored.
          </Lead>
        </div>
      </Wrap>
    </section>
  );
}

/* ─── 5. Three sizes ─── */

const SIZE_TABS = ["So what", "Executive summary", "Original"] as const;

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

function feedToDocument(feed: FeedResponse): ContentDocument {
  return {
    title: "AI News",
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

function isHeading(p: string) {
  return !/[.:”"]$/.test(p) && p.length < 70;
}

function ThreeSizes() {
  const [size, setSize] = useState(0);
  const reduce = useReducedMotion();
  const [dir, setDir] = useState(1);
  const hintRef = useRef<HTMLDivElement>(null);
  const hintInView = useInView(hintRef, { once: true, margin: "-120px" });

  const go = (n: number) => {
    const next = Math.max(0, Math.min(SIZE_TABS.length - 1, n));
    setDir(next > size ? 1 : -1);
    setSize(next);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) go(size + 1);
    else if (info.offset.x > 50) go(size - 1);
  };

  const { data, isLoading, isError } = useQuery<FeedResponse>({
    queryKey: ["founders-reader-feed"],
    queryFn: async () => {
      const res = await fetch("/data/feed/ai-news/latest.json");
      if (!res.ok) throw new Error("feed");
      return res.json();
    },
  });

  return (
    <section className="border-t border-line py-16 md:py-24">
      <Wrap className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <H2>Every story that stays comes in three sizes.</H2>
          <Lead>
            Original (the full story), Executive summary (the short one), and So what (the Nubble signal, made for one company
            only: yours). Swipe to switch. The So what is the story retold for your company: what changed and what it means for
            you.
          </Lead>
        </div>

        <div ref={hintRef} className="mx-auto w-full max-w-[720px]">
          <div role="tablist" aria-label="Story size" className="grid grid-cols-3 border-b border-line">
            {SIZE_TABS.map((t, i) => (
              <button
                key={t}
                role="tab"
                aria-selected={size === i}
                onClick={() => go(i)}
                className={`relative px-2 pb-3 pt-1 text-[15px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink md:text-[16px] ${
                  size === i ? (i === 0 ? "text-amber" : "text-ink") : "text-mute hover:text-ink"
                }`}
              >
                {t}
                {size === i && (
                  <motion.span layoutId="size-underline" className={`absolute inset-x-2 -bottom-px h-[2px] ${i === 0 ? "bg-amber" : "bg-ink"}`} />
                )}
              </button>
            ))}
          </div>

          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
            animate={hintInView && !reduce && size === 0 ? { x: [0, -22, 0] } : { x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-4 cursor-grab touch-pan-y rounded-[12px] border border-line bg-white p-5 active:cursor-grabbing md:p-7"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <LabelChip label="weakened" />
              <span className="text-[13px] text-mute">
                {SIZES.date} · <Ext href={SIZES.url}>GlobeNewswire</Ext>
              </span>
            </div>
            <h3 className="mt-3 text-[22px] font-bold leading-[1.25] text-ink">{SIZES.title}</h3>
            <motion.div
              key={size}
              initial={reduce ? false : { opacity: 0, x: 24 * dir }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="mt-4"
            >
              {size === 0 && <SoWhat title="So what · made for one company only: yours">{SIZES.soWhat}</SoWhat>}
              {size === 1 && <p className="text-[17px] leading-[1.6] text-ink">{SIZES.summary}</p>}
              {size === 2 && (
                <div className="max-h-[360px] overflow-y-auto pr-2 [overscroll-behavior:contain]">
                  <p className="mb-3 text-[13px] text-mute">
                    Peec AI's press release, as published. <Ext href={SIZES.url}>Read it at the source</Ext>.
                  </p>
                  <div className="flex flex-col gap-3">
                    {SIZES.original.map((p) =>
                      isHeading(p) ? (
                        <p key={p} className="pt-1 text-[16px] font-bold text-ink">
                          {p}
                        </p>
                      ) : (
                        <p key={p} className="text-[15px] leading-[1.6] text-[#33363b]">
                          {p}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              )}
            </motion.div>
            <p className="mt-5 text-[13px] text-mute">Swipe the card or tap a size.</p>
          </motion.div>
        </div>

        <Lead>
          Some stories need a move. Some are just worth knowing, and then the So what says “no change needed” and means it.
        </Lead>

        <div id="reader" className="scroll-mt-6 flex flex-col gap-3">
          <h3 className="font-display text-[26px] font-bold leading-[1.15] text-ink md:text-[32px]">The live reader. Swipe it yourself.</h3>
          <p className="text-[15px] text-mute">
            Nubble AI News{data ? `, edition of ${formatDate(data.date)}` : ""}. The latest one.
          </p>
          <div className="h-[540px] overflow-hidden rounded-[12px] md:h-[640px] border border-line bg-white">
            {isLoading && <div className="flex h-full items-center justify-center text-[14px] text-mute">Loading the edition…</div>}
            {isError && (
              <div className="flex h-full items-center justify-center px-6 text-center text-[14px] text-mute">
                The edition did not load. Open nubble.me to read it.
              </div>
            )}
            {data && data.stories?.length > 0 && <NubbleReader document={feedToDocument(data)} />}
          </div>
        </div>
      </Wrap>
    </section>
  );
}

/* ─── 6. What you get back ─── */

function GetBack() {
  return (
    <section className="border-t border-line py-16 md:py-24">
      <Wrap className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <H2>Every brief turns into something you can send, and into a sharper way to talk about your product.</H2>
          <Lead>
            After a few months you have something nobody else has: the dated record of every move in your market, what each one
            did to you, and what you said back. That is your answer on competitors, on your moat, and on where the industry is
            going.
          </Lead>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {INVESTOR_ANSWERS.map((a) => (
            <div key={a.who} className="flex min-w-0 flex-col gap-3 rounded-[12px] bg-ink p-6 text-white">
              <p className="text-[14px] font-bold text-[#e3a35a]">{a.who}</p>
              <p className="text-[19px] font-medium leading-[1.45]">{a.what}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border border-line bg-[#DCDDD8] sm:grid-cols-2 lg:grid-cols-3">
          {OTHER_ANSWERS.map((a) => (
            <div key={a.who} className="flex min-w-0 flex-col gap-1.5 bg-white p-5 md:p-6">
              <p className="text-[14px] font-bold text-mute">{a.who}</p>
              <p className="text-[16px] leading-[1.5] text-ink">{a.what}</p>
            </div>
          ))}
        </div>
        <p className="max-w-[62ch] text-[16px] leading-[1.6] text-mute">
          Each piece starts from your company, not from the article. We already do this at POKPOK with the tool we built for
          ourselves.
        </p>
      </Wrap>
    </section>
  );
}

/* ─── 7. Where it lives ─── */

function SlackBubble() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!inView || reduce) return;
    setTyping(true);
    const t = window.setTimeout(() => setTyping(false), 1300);
    return () => clearTimeout(t);
  }, [inView, reduce]);
  return (
    <div ref={ref} className="mt-3 h-[40px]">
      {typing ? (
        <span className="inline-flex h-[34px] items-center gap-1 rounded-[16px] bg-[#ECEDE9] px-3" aria-hidden>
          {[0, 1, 2].map((d) => (
            <motion.span
              key={d}
              className="h-1.5 w-1.5 rounded-full bg-mute"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
            />
          ))}
        </span>
      ) : (
        <motion.span
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block rounded-[16px] bg-[#ECEDE9] px-3 py-2 text-[14px] text-ink"
        >
          what changed for us this week?
        </motion.span>
      )}
    </div>
  );
}

function WhereItLives() {
  return (
    <section className="border-t border-line py-16 md:py-24">
      <Wrap className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <H2>You will not open another dashboard. Nubble comes to where you already are.</H2>
          <Lead>Today only the reader is live. The rest is being built, and the page says so.</Lead>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PLACES.map((p) => (
            <div key={p.name} className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                {p.live ? (
                  <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-2 py-[3px] text-[12px] font-bold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5fd38d]" /> Live
                  </span>
                ) : (
                  <span className="rounded-[4px] border border-dashed border-[#9a9ea5] px-2 py-[2px] text-[12px] font-bold text-mute">
                    Coming
                  </span>
                )}
                <h3 className="text-[18px] font-bold text-ink">{p.name}</h3>
              </div>
              <p className="text-[16px] leading-[1.55] text-[#33363b]">{p.body}</p>
              {p.name === "Slack" && <SlackBubble />}
            </div>
          ))}
        </div>
        <p className="text-[16px] text-mute">This is how we already deliver our own agent at POKPOK, so we know it works.</p>
      </Wrap>
    </section>
  );
}

/* ─── 8. Early access ─── */

function EarlyAccess() {
  return (
    <section className="bg-ink py-16 text-white md:py-24">
      <Wrap className="grid grid-cols-1 items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <h2 className="max-w-[20ch] font-display text-[34px] font-bold leading-[1.06] [text-wrap:balance] md:text-[52px]">
          Paste your site, we send the first brief.
        </h2>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="rounded-[10px] bg-white p-2">
            <EmailForm id="site-bottom" button="Send me my brief" />
          </div>
          <p className="text-[15px] text-[#c9cbc6]">
            Free while we build. Or write to <span className="select-all font-bold text-white">{CONTACT}</span>
          </p>
        </div>
      </Wrap>
    </section>
  );
}

/* ─── Page ─── */

export default function FoundersLanding() {
  useEffect(() => {
    document.title = "Nubble for AI founders";
  }, []);

  return (
    <div
      className="founders fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#F3F4F1] text-ink antialiased [-webkit-overflow-scrolling:touch]"
      style={{ fontFamily: "'Satoshi', Inter, system-ui, sans-serif", colorScheme: "light" }}
    >
      <style>{`
        .founders .font-display{font-family:'Zodiak',Georgia,serif}
        .founders .text-ink{color:${INK}} .founders .bg-ink{background-color:${INK}} .founders .border-ink{border-color:${INK}}
        .founders .text-mute{color:#5B5F66} .founders .border-line{border-color:#DCDDD8}
        .founders .text-red{color:#D42B1A} .founders .bg-red{background-color:#D42B1A}
        .founders .text-amber{color:#9E5A06} .founders .border-amber{border-color:#C26F0C} .founders .bg-amber{background-color:#C26F0C}
        .founders .ring-amber{--tw-ring-color:#C26F0C}
        .founders .outline-amber{outline-color:#C26F0C} .founders .outline-ink{outline-color:${INK}}
        .founders .decoration-ink{text-decoration-color:${INK}}
      `}</style>
      <header className="border-b border-line">
        <Wrap className="flex h-14 items-center justify-between">
          <a href="/" className="font-display text-[22px] font-bold text-ink">
            nubble
          </a>
          <a href="#site-top" onClick={(e) => { e.preventDefault(); const el = document.getElementById("site-top"); el?.scrollIntoView({ behavior: "smooth", block: "center" }); el?.focus({ preventScroll: true }); }} className="hidden rounded-[8px] bg-ink px-4 py-2 text-[14px] font-bold text-white sm:inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber">
            Get my first brief
          </a>
        </Wrap>
      </header>
      <main>
        <Opening />
        <Why />
        <Setup />
        <Filter />
        <ThreeSizes />
        <GetBack />
        <WhereItLives />
        <EarlyAccess />
      </main>
      <footer className="border-t border-line py-8">
        <Wrap className="text-[14px] text-mute">
          nubble.me, made by POKPOK · <span className="select-all">{CONTACT}</span>
        </Wrap>
      </footer>
    </div>
  );
}
