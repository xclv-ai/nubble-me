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
 * /founders, built on the Vercel Geist design system.
 * Fonts: Geist Sans + Geist Mono (Google Fonts link in index.html).
 * Light: bg #FFFFFF, grid lines #EAEAEA, text #171717, secondary #666666.
 * Terminal: bg #0A0A0A, border #2E2E2E, text #EDEDED, secondary #A1A1A1.
 * Semantic colour, used only for meaning: red = Code red, amber = So what and Weakened, blue = Worth knowing, green = Live.
 * Layout: one framed 1200px column with visible grid lines and corner marks; cells share borders instead of floating cards.
 * Motion: one orchestrated moment (the opening terminal). Everything else answers the reader's action.
 */

/* ─── Building blocks ─── */

function Plus({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -top-[6px] z-10 hidden h-[11px] w-[11px] md:block ${side === "left" ? "-left-[6px]" : "-right-[6px]"}`}
    >
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#A8A8A8]" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#A8A8A8]" />
    </span>
  );
}

function Section({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`relative scroll-mt-16 border-t border-line ${className}`}>
      <Plus side="left" />
      <Plus side="right" />
      {children}
    </section>
  );
}

function Pad({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-5 md:px-12 ${className}`}>{children}</div>;
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`max-w-[24ch] text-[32px] font-semibold leading-[1.1] tracking-[-0.035em] text-fg [text-wrap:balance] md:text-[48px] ${className}`}
    >
      {children}
    </h2>
  );
}

function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`max-w-[62ch] text-[17px] leading-[1.6] text-mute md:text-[18px] ${className}`}>{children}</p>;
}

const BADGE: Record<Label, string> = {
  "code-red": "bg-[#FFEBEB] text-[#C4262C]",
  weakened: "bg-[#FFF4D5] text-[#9A4A00]",
  "worth-knowing": "bg-[#EBF5FF] text-[#0062C4]",
};
const BADGE_DARK: Record<Label, string> = {
  "code-red": "bg-[#3C1618] text-[#FF6166]",
  weakened: "bg-[#331B00] text-[#FFB224]",
  "worth-knowing": "bg-[#0D2847] text-[#52A8FF]",
};

function Badge({ label, dark = false }: { label: Label; dark?: boolean }) {
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-full px-2 font-mono text-[11px] font-medium uppercase tracking-[0.04em] ${dark ? BADGE_DARK[label] : BADGE[label]}`}
    >
      {LABELS[label].name}
    </span>
  );
}

function Ext({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const internal = href.startsWith("#");
  return (
    <a
      href={href}
      {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className={`underline decoration-[#8F8F8F] underline-offset-[3px] transition-colors hover:decoration-current focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3] ${className}`}
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
    const c = animate(from, to, { duration: 1, delay, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, reduce, from, to, delay]);
  return (
    <span ref={ref} className="tabular-nums">
      {n}
    </span>
  );
}

function EmailForm({ id, button, dark = false }: { id: string; button: string; dark?: boolean }) {
  const [url, setUrl] = useState("");
  const subject = encodeURIComponent("Nubble: my first brief");
  const body = encodeURIComponent(`My website: ${url || "(paste it here)"}\n\nSend me my first Nubble brief.`);
  return (
    <form
      className="flex w-full max-w-[520px] flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = `mailto:${CONTACT}?subject=${subject}&body=${body}`;
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Your website
      </label>
      <div
        className={`flex h-12 w-full min-w-0 items-center rounded-md border px-3 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(0,112,243,0.35)] sm:w-auto sm:flex-1 ${
          dark ? "border-[#3D3D3D] bg-[#0A0A0A]" : "border-[#D4D4D4] bg-white"
        }`}
      >
        <span aria-hidden className={`mr-1 font-mono text-[14px] ${dark ? "text-[#A1A1A1]" : "text-mute"}`}>
          https://
        </span>
        <input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="yourstartup.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={`h-full min-w-0 flex-1 bg-transparent font-mono text-[15px] outline-none ${
            dark ? "text-[#EDEDED] placeholder:text-[#8F8F8F]" : "text-fg placeholder:text-[#8F8F8F]"
          }`}
        />
      </div>
      <button
        type="submit"
        className={`h-12 whitespace-nowrap rounded-md px-5 text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3] ${
          dark ? "bg-white text-black hover:bg-[#E6E6E6]" : "bg-[#171717] text-white hover:bg-[#383838]"
        }`}
      >
        {button}
      </button>
    </form>
  );
}

/* ─── 1. Opening: headline + the brief as a terminal ─── */

const CMD = "nubble brief pokpok.ai --from 15-sep --to 31-oct";

function TerminalBrief() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState(CMD.length);
  const [stage, setStage] = useState(9);
  const thrown = RUN.filter((r) => !r.kept).length;
  const kept = RUN.length - thrown;

  useEffect(() => {
    if (!inView || reduce) return;
    setTyped(0);
    setStage(0);
    const timers: number[] = [];
    for (let i = 1; i <= CMD.length; i++) timers.push(window.setTimeout(() => setTyped(i), 22 * i));
    const base = 22 * CMD.length + 250;
    for (let s = 1; s <= 6; s++) timers.push(window.setTimeout(() => setStage(s), base + s * 260));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const show = (s: number) => ({
    initial: false as const,
    animate: stage >= s ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  });

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-lg border border-[#2E2E2E] bg-[#0A0A0A] text-[#EDEDED] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]"
    >
      <div className="flex h-10 items-center gap-2 border-b border-[#2E2E2E] px-4">
        <span className="h-3 w-3 rounded-full bg-[#3D3D3D]" />
        <span className="h-3 w-3 rounded-full bg-[#3D3D3D]" />
        <span className="h-3 w-3 rounded-full bg-[#3D3D3D]" />
        <span className="ml-2 truncate font-mono text-[12px] text-[#A1A1A1]">Example brief for pokpok.ai</span>
      </div>
      <div className="px-4 py-5 md:px-6 md:py-6">
        <p className="font-mono text-[13px] leading-[1.6] md:text-[14px]">
          <span className="text-[#62C073]">$ </span>
          {CMD.slice(0, typed)}
          {typed < CMD.length && <span className="ml-0.5 inline-block h-[1.05em] w-[7px] translate-y-[2px] bg-[#EDEDED]" />}
        </p>

        <motion.dl
          {...show(1)}
          className="mt-4 grid grid-cols-[7ch_minmax(0,1fr)] gap-x-4 gap-y-1 font-mono text-[13px] leading-[1.6] md:text-[14px]"
        >
          <dt className="text-[#A1A1A1]">read</dt>
          <dd>
            <span className="text-[#EDEDED]">{RUN.length} rival posts</span>
            <span className="text-[#A1A1A1]">, 15 Sep to 31 Oct 2026</span>
          </dd>
          <dt className="text-[#A1A1A1]">thrown</dt>
          <dd>
            <span className="text-[#EDEDED]">
              <Count from={0} to={thrown} delay={0.2} />
            </span>
            <span className="text-[#A1A1A1]"> never shown</span>
          </dd>
          <dt className="text-[#A1A1A1]">kept</dt>
          <dd className="text-[#EDEDED]">{kept}</dd>
        </motion.dl>

        <div className="mt-5 flex flex-col">
          {BRIEF.map((s, i) => (
            <motion.article key={s.title} {...show(2 + i)} className="border-t border-[#2E2E2E] py-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Badge label={s.label} dark />
                <span className="font-mono text-[12px] text-[#A1A1A1]">{s.date}</span>
              </div>
              <h3 className="mt-2 text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] md:text-[18px]">{s.title}</h3>
              <p className="mt-1 text-[14px] leading-[1.5] text-[#A1A1A1]">
                “{s.quote}” <Ext href={s.url}>{s.source}</Ext>
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-y-1 sm:grid-cols-[9ch_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-2">
                <dt className="font-mono text-[12px] leading-[1.9] text-[#FFB224]">so what</dt>
                <dd className="text-[15px] leading-[1.55] text-[#EDEDED] md:text-[16px]">{s.soWhat}</dd>
                {s.move && (
                  <>
                    <dt className="mt-2 font-mono text-[12px] leading-[1.9] text-[#A1A1A1] sm:mt-0">your move</dt>
                    <dd className="text-[15px] leading-[1.55] text-[#D4D4D4]">{s.move}</dd>
                  </>
                )}
              </dl>
            </motion.article>
          ))}
        </div>
        <motion.p {...show(5)} className="border-t border-[#2E2E2E] pt-4 font-mono text-[12px] leading-[1.6] text-[#A1A1A1]">
          # Run by hand today, the way Nubble does it.{" "}
          <Ext href="#filter" className="text-[#EDEDED]">
            See all {RUN.length} posts
          </Ext>
        </motion.p>
      </div>
    </div>
  );
}

function Opening() {
  return (
    <section className="relative">
      <Pad className="flex flex-col items-start gap-5 pb-12 pt-12 md:items-center md:pb-16 md:pt-24 md:text-center">
        <p className="text-[15px] leading-[1.5] text-mute md:text-[16px]">
          You run an AI startup. Small team, one product, a homepage that says why you.
        </p>
        <h1 className="max-w-[20ch] text-[38px] font-semibold leading-[1.04] tracking-[-0.045em] text-fg [text-wrap:balance] md:text-[68px]">
          Stop reading the news, competitors' blogs, and other founders' self-promoting B.S. posts on LinkedIn.
        </h1>
        <p className="max-w-[46ch] text-[18px] leading-[1.5] text-mute md:text-[20px]">
          Nubble tells you what the news means for your company, shows you the proof, and gives you something you can send.
        </p>
        <div className="mt-2 flex w-full flex-col gap-3 md:items-center">
          <EmailForm id="site-top" button="Get my first brief" />
          <p className="text-[14px] text-mute">
            Free while we build. Today the reader at nubble.me is live. Slack, Telegram and Claude are being built.
          </p>
        </div>
      </Pad>
      <div className="relative border-t border-line bg-[#FAFAFA]">
        <Plus side="left" />
        <Plus side="right" />
        <Pad className="py-8 md:py-12">
          <div className="mx-auto max-w-[860px]">
            <TerminalBrief />
          </div>
          <p className="mx-auto mt-8 max-w-[860px] text-[17px] leading-[1.6] text-fg">
            We built it because we are that founder. POKPOK is our company. Everything below happened to us.
          </p>
        </Pad>
      </div>
    </section>
  );
}

/* ─── 2. Why: six pains in a shared grid ─── */

function Why() {
  return (
    <Section>
      <Pad className="py-14 md:py-20">
        <H2>Six things that happen to you (and to us at pokpok.ai).</H2>
      </Pad>
      <div className="grid grid-cols-1 gap-px border-t border-line bg-line md:grid-cols-3">
        {PAINS.map((p) => (
          <article key={p.head} className="flex min-w-0 flex-col gap-3 bg-white p-6 md:p-8">
            {"label" in p && p.label ? (
              <div>
                <Badge label={p.label} />
              </div>
            ) : "group" in p && p.group ? (
              <p className="font-mono text-[12px] uppercase tracking-[0.04em] text-mute">{p.group}</p>
            ) : null}
            <h3 className="text-[20px] font-semibold leading-[1.3] tracking-[-0.02em] text-fg [text-wrap:balance]">{p.head}</h3>
            <p className="text-[16px] leading-[1.6] text-mute">{p.body}</p>
            {"proof" in p && p.proof && (
              <p className="mt-auto pt-2 font-mono text-[12px] leading-[1.6] text-mute">
                Proof:{" "}
                <Ext href={p.proof.url} className="text-fg">
                  {p.proof.text}
                </Ext>
              </p>
            )}
          </article>
        ))}
      </div>
      <div className="border-t border-line bg-[#0A0A0A] text-[#EDEDED]">
        <Pad className="py-10 md:py-14">
          <p className="max-w-[60ch] text-[19px] leading-[1.6] tracking-[-0.01em] md:text-[22px]">
            <span className="font-semibold text-white">What you have today:</span>{" "}
            <span className="text-[#C7C7C7]">
              X, newsletters, investor group chats, a ChatGPT window. All of it tells you what happened to everyone. None of it tells
              you what it means for your company. None of it throws away the part that has nothing to do with you, which is most of
              it. So you read for two hours a day you do not have, or you skip it and get caught.
            </span>
          </p>
        </Pad>
      </div>
    </Section>
  );
}

/* ─── 3. How it works: a numbered trace ─── */

function Step({
  n,
  title,
  children,
  demo,
  id,
}: {
  n: string;
  title: string;
  children?: React.ReactNode;
  demo: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="relative grid scroll-mt-16 grid-cols-1 border-t border-line lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Plus side="left" />
      <Plus side="right" />
      <div className="min-w-0 px-5 py-10 md:px-12 md:py-14">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <p className="font-mono text-[13px] text-mute">{n}</p>
          <h3 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-fg [text-wrap:balance] md:text-[32px]">
            {title}
          </h3>
          {children}
        </div>
      </div>
      <div className="min-w-0 border-t border-line bg-[#FAFAFA] px-5 py-8 md:px-12 md:py-14 lg:border-l lg:border-t-0">{demo}</div>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 overflow-hidden rounded-lg border border-line bg-white ${className}`}>
      <div className="flex min-h-10 items-center border-b border-line px-4 py-2 font-mono text-[12px] leading-[1.4] text-mute">{title}</div>
      {children}
    </div>
  );
}

function SetupDemo() {
  const [note, setNote] = useState(false);
  return (
    <Panel title={`What Nubble read from ${PROFILE.site}`}>
      <div className="px-4 pt-4">
        <div className="flex h-11 items-center rounded-md border border-[#D4D4D4] px-3 font-mono text-[14px]">
          <span className="mr-1 text-mute">https://</span>
          <span className="text-fg">{PROFILE.site}</span>
        </div>
      </div>
      <dl className="mt-3 flex flex-col px-4">
        {PROFILE.rows.map((r) => (
          <div key={r.k} className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-t border-line py-3 md:grid-cols-[110px_minmax(0,1fr)]">
            <dt className="font-mono text-[12px] leading-[1.9] text-mute">{r.k}</dt>
            <dd className="text-[15px] leading-[1.5] text-fg">{r.v}</dd>
          </div>
        ))}
        <div className="border-t border-line py-3">
          <dt className="font-mono text-[12px] text-mute">Competitors and big players</dt>
          <dd className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PROFILE.competitors.map((c) => (
              <a
                key={c.name}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-w-0 flex-col gap-0.5 rounded-md border border-line px-3 py-2 transition-colors hover:border-[#A8A8A8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0070F3]"
              >
                <span className="text-[14px] font-medium text-fg">{c.name}</span>
                <span className="font-mono text-[11px] text-mute group-hover:underline">found at {c.foundAt}</span>
              </a>
            ))}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={() => setNote(true)}
          className="h-9 rounded-md bg-[#171717] px-4 text-[14px] font-medium text-white hover:bg-[#383838] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3]"
        >
          Looks right
        </button>
        <button
          type="button"
          onClick={() => setNote(true)}
          className="h-9 rounded-md border border-[#D4D4D4] bg-white px-4 text-[14px] font-medium text-fg hover:bg-[#F2F2F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3]"
        >
          Fix something
        </button>
        {note && (
          <p role="status" className="w-full pt-1 text-[14px] text-mute">
            This is the pokpok.ai example. Paste your own site above to get yours.
          </p>
        )}
      </div>
    </Panel>
  );
}

function SourcesDemo() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
      {SOURCES.map((s) => (
        <div key={s.name} className="flex min-w-0 flex-col gap-1.5 bg-white p-5">
          <h4 className="text-[16px] font-semibold tracking-[-0.01em] text-fg">{s.name}</h4>
          <p className="text-[15px] leading-[1.55] text-mute">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function RunDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const reduce = useReducedMotion();
  const [sorted, setSorted] = useState(true);
  useEffect(() => {
    if (!inView || reduce) return;
    setSorted(false);
    const t = window.setTimeout(() => setSorted(true), 800);
    return () => clearTimeout(t);
  }, [inView, reduce]);

  return (
    <div ref={ref}>
      <Panel title="Example run for pokpok.ai: rival posts, 15 Sep to 31 Oct 2026">
        <ol className="flex flex-col">
          {RUN.map((r, i) => {
            const dim = sorted && !r.kept;
            return (
              <motion.li
                key={r.title}
                initial={false}
                animate={{ opacity: dim ? 0.5 : 1 }}
                transition={{ duration: 0.3, delay: reduce ? 0 : i * 0.035 }}
                className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0"
              >
                <span className="font-mono text-[12px] tabular-nums text-mute">{r.date}</span>
                <Ext href={r.url} className={`text-[14px] leading-[1.4] text-fg ${dim ? "line-through" : ""}`}>
                  {r.title}
                </Ext>
                <span className="justify-self-end">
                  {r.kept ? (
                    <motion.span
                      initial={false}
                      animate={{ opacity: sorted ? 1 : 0, x: sorted ? 0 : 6 }}
                      transition={{ duration: 0.25 }}
                      className="inline-block"
                    >
                      <Badge label={r.kept} />
                    </motion.span>
                  ) : (
                    <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-mute">thrown</span>
                  )}
                </span>
              </motion.li>
            );
          })}
        </ol>
        <p className="border-t border-line px-4 py-3 text-[13px] leading-[1.5] text-mute">
          This example read rivals' posts and press releases only, by headline and first paragraph. Not the labs, not X, not
          LinkedIn. Every row links its source.
        </p>
      </Panel>
    </div>
  );
}

const SIZE_TABS = ["So what", "Executive summary", "Original"] as const;

function isHeading(p: string) {
  return !/[.:”"]$/.test(p) && p.length < 70;
}

function SizesDemo() {
  const [size, setSize] = useState(0);
  const reduce = useReducedMotion();
  const [dir, setDir] = useState(1);
  const go = (n: number) => {
    const next = Math.max(0, Math.min(SIZE_TABS.length - 1, n));
    setDir(next > size ? 1 : -1);
    setSize(next);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) go(size + 1);
    else if (info.offset.x > 50) go(size - 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Story size" className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-[#F2F2F2] p-1">
        {SIZE_TABS.map((t, i) => (
          <button
            key={t}
            role="tab"
            aria-selected={size === i}
            onClick={() => go(i)}
            className={`relative min-h-9 rounded-md px-2 py-1.5 text-[13px] font-medium leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0070F3] md:text-[14px] ${
              size === i ? "text-fg" : "text-mute hover:text-fg"
            }`}
          >
            {size === i && (
              <motion.span
                layoutId="size-pill"
                className="absolute inset-0 rounded-md bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        className="cursor-grab touch-pan-y overflow-hidden rounded-lg border border-line bg-white active:cursor-grabbing"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line px-5 py-3">
          <Badge label="weakened" />
          <span className="font-mono text-[12px] text-mute">
            {SIZES.date}, <Ext href={SIZES.url}>GlobeNewswire</Ext>
          </span>
        </div>
        <div className="px-5 py-5">
          <h4 className="text-[20px] font-semibold leading-[1.3] tracking-[-0.02em] text-fg">{SIZES.title}</h4>
          <motion.div
            key={size}
            initial={reduce ? false : { opacity: 0, x: 20 * dir }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4"
          >
            {size === 0 && (
              <div className="border-l-2 border-[#F5A524] pl-4">
                <p className="font-mono text-[12px] text-[#9A4A00]">So what, made for one company only: yours</p>
                <p className="mt-1 text-[17px] font-medium leading-[1.5] text-fg">{SIZES.soWhat}</p>
              </div>
            )}
            {size === 1 && <p className="text-[17px] leading-[1.6] text-fg">{SIZES.summary}</p>}
            {size === 2 && (
              <div className="max-h-[340px] overflow-y-auto pr-2 [overscroll-behavior:contain]">
                <p className="mb-3 font-mono text-[12px] text-mute">
                  Peec AI's press release, as published. <Ext href={SIZES.url}>Read it at the source</Ext>.
                </p>
                <div className="flex flex-col gap-3">
                  {SIZES.original.map((p) =>
                    isHeading(p) ? (
                      <p key={p} className="pt-1 text-[15px] font-semibold text-fg">
                        {p}
                      </p>
                    ) : (
                      <p key={p} className="text-[15px] leading-[1.6] text-mute">
                        {p}
                      </p>
                    ),
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
        <p className="border-t border-line px-5 py-3 font-mono text-[12px] text-mute">Swipe the card or tap a size.</p>
      </motion.div>
    </div>
  );
}

function HowItWorks() {
  const thrown = RUN.filter((r) => !r.kept).length;
  const kept = RUN.length - thrown;
  const moves = RUN.filter((r) => r.kept && r.kept !== "worth-knowing").length;

  return (
    <Section>
      <Pad className="py-14 md:py-20">
        <H2>How it works.</H2>
      </Pad>

      <Step n="01" title="Paste your website. That is the whole setup." demo={<SetupDemo />}>
        <Lead>
          Nubble reads it and works out what you sell, who buys it, what market you are in, and your main claim. Then it finds your
          competitors and the big players. It searches the web live. It does not answer from memory. Every company comes with the
          link where it was found.
        </Lead>
        <p className="text-[20px] font-semibold tracking-[-0.02em] text-fg">You correct. You never fill in a form.</p>
      </Step>

      <Step n="02" title="Every day it reads the sources." demo={<SourcesDemo />} />

      <Step n="03" id="filter" title="It throws away what does not concern you." demo={<RunDemo />}>
        <Lead>Silently. You never see it. There is no “nothing relevant today” message either. A quiet week is a quiet week.</Lead>
        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-line">
          {[
            { k: "read", v: <Count from={0} to={RUN.length} />, accent: false },
            { k: "kept", v: <Count from={RUN.length} to={kept} delay={0.8} />, accent: false },
            { k: "need a move", v: <Count from={kept} to={moves} delay={1.4} />, accent: true },
          ].map((c, i) => (
            <div key={c.k} className={`bg-white px-4 py-4 ${i > 0 ? "border-l border-line" : ""}`}>
              <p className={`text-[36px] font-semibold leading-none tracking-[-0.04em] ${c.accent ? "text-[#9A4A00]" : "text-fg"}`}>
                {c.v}
              </p>
              <p className="mt-2 font-mono text-[12px] text-mute">{c.k}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <p className="text-[17px] font-semibold tracking-[-0.01em] text-fg">Stories carry labels.</p>
          <ul className="flex flex-col gap-2.5">
            {(Object.keys(LABELS) as Label[]).map((l) => (
              <li key={l} className="grid grid-cols-[124px_minmax(0,1fr)] items-start gap-3">
                <span>
                  <Badge label={l} />
                </span>
                <span className="text-[15px] leading-[1.5] text-fg">{LABELS[l].meaning}</span>
              </li>
            ))}
          </ul>
          <p className="text-[15px] leading-[1.6] text-mute">
            A label is always tied to the rival's own sentence, which you can see. If we got one wrong, say so once and it stays
            ignored.
          </p>
        </div>
      </Step>

      <Step n="04" title="Every story that stays comes in three sizes." demo={<SizesDemo />}>
        <Lead>
          Original (the full story), Executive summary (the short one), and So what (the Nubble signal, made for one company only:
          yours). Swipe to switch. The So what is the story retold for your company: what changed and what it means for you.
        </Lead>
        <Lead>Some stories need a move. Some are just worth knowing, and then the So what says “no change needed” and means it.</Lead>
      </Step>
    </Section>
  );
}

/* ─── 4. The live reader ─── */

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

function LiveReader() {
  const { data, isLoading, isError } = useQuery<FeedResponse>({
    queryKey: ["founders-reader-feed"],
    queryFn: async () => {
      const res = await fetch("/data/feed/ai-news/latest.json");
      if (!res.ok) throw new Error("feed");
      return res.json();
    },
  });
  return (
    <Section id="reader">
      <Pad className="flex flex-col gap-3 py-14 md:py-20">
        <H2>The live reader. Swipe it yourself.</H2>
        <p className="font-mono text-[13px] text-mute">
          Nubble AI News{data ? `, edition of ${formatDate(data.date)}` : ""}. The latest one.
        </p>
      </Pad>
      <div className="border-t border-line bg-[#FAFAFA] px-3 py-6 md:px-12 md:py-12">
        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-[0_24px_60px_-32px_rgba(0,0,0,0.25)]">
          <div className="flex h-10 items-center gap-2 border-b border-line px-4">
            <span className="h-3 w-3 rounded-full bg-[#E5E5E5]" />
            <span className="h-3 w-3 rounded-full bg-[#E5E5E5]" />
            <span className="h-3 w-3 rounded-full bg-[#E5E5E5]" />
            <span className="mx-auto rounded-md bg-[#F2F2F2] px-3 py-0.5 font-mono text-[12px] text-mute">nubble.me</span>
            <span className="w-[52px]" />
          </div>
          <div className="h-[540px] md:h-[620px]">
            {isLoading && <div className="flex h-full items-center justify-center font-mono text-[13px] text-mute">Loading the edition…</div>}
            {isError && (
              <div className="flex h-full items-center justify-center px-6 text-center text-[14px] text-mute">
                The edition did not load. Open nubble.me to read it.
              </div>
            )}
            {data && data.stories?.length > 0 && <NubbleReader document={feedToDocument(data)} />}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── 5. What you get back ─── */

function GetBack() {
  return (
    <Section>
      <Pad className="flex flex-col gap-5 py-14 md:py-20">
        <H2>Every brief turns into something you can send, and into a sharper way to talk about your product.</H2>
        <Lead>
          After a few months you have something nobody else has: the dated record of every move in your market, what each one did to
          you, and what you said back. That is your answer on competitors, on your moat, and on where the industry is going.
        </Lead>
      </Pad>
      <div className="grid grid-cols-1 gap-px border-t border-line bg-[#2E2E2E] md:grid-cols-3">
        {INVESTOR_ANSWERS.map((a) => (
          <div key={a.who} className="flex min-w-0 flex-col gap-3 bg-[#0A0A0A] p-6 md:p-8">
            <p className="font-mono text-[12px] leading-[1.6] text-[#FFB224]">{a.who}</p>
            <p className="text-[19px] font-medium leading-[1.45] tracking-[-0.01em] text-[#EDEDED]">{a.what}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {OTHER_ANSWERS.map((a) => (
          <div key={a.who} className="flex min-w-0 flex-col gap-2 bg-white p-6 md:p-8">
            <p className="font-mono text-[12px] text-mute">{a.who}</p>
            <p className="text-[16px] leading-[1.55] text-fg">{a.what}</p>
          </div>
        ))}
      </div>
      <Pad className="border-t border-line py-6">
        <p className="max-w-[62ch] text-[15px] leading-[1.6] text-mute">
          Each piece starts from your company, not from the article. We already do this at POKPOK with the tool we built for
          ourselves.
        </p>
      </Pad>
    </Section>
  );
}

/* ─── 6. Where it lives ─── */

function SlackBubble() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    if (!inView || reduce) return;
    setTyping(true);
    const t = window.setTimeout(() => setTyping(false), 1200);
    return () => clearTimeout(t);
  }, [inView, reduce]);
  return (
    <div ref={ref} className="mt-2 h-[38px]">
      {typing ? (
        <span className="inline-flex h-[34px] items-center gap-1 rounded-full bg-[#F2F2F2] px-3" aria-hidden>
          {[0, 1, 2].map((d) => (
            <motion.span
              key={d}
              className="h-1.5 w-1.5 rounded-full bg-[#8F8F8F]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
            />
          ))}
        </span>
      ) : (
        <motion.span
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block rounded-full bg-[#F2F2F2] px-3 py-2 font-mono text-[13px] text-fg"
        >
          what changed for us this week?
        </motion.span>
      )}
    </div>
  );
}

function WhereItLives() {
  return (
    <Section>
      <Pad className="flex flex-col gap-4 py-14 md:py-20">
        <H2>You will not open another dashboard. Nubble comes to where you already are.</H2>
        <Lead>Today only the reader is live. The rest is being built, and the page says so.</Lead>
      </Pad>
      <div className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2">
        {PLACES.map((p) => (
          <div key={p.name} className="flex min-w-0 flex-col gap-2 bg-white p-6 md:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-fg">{p.name}</h3>
              {p.live ? (
                <span className="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full bg-[#EBFAED] px-2 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[#297A3A]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#45A557]" /> Live
                </span>
              ) : (
                <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-[#F2F2F2] px-2 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-mute">
                  Coming
                </span>
              )}
            </div>
            <p className="text-[16px] leading-[1.55] text-mute">{p.body}</p>
            {p.name === "Slack" && <SlackBubble />}
          </div>
        ))}
      </div>
      <Pad className="border-t border-line py-6">
        <p className="text-[15px] text-mute">This is how we already deliver our own agent at POKPOK, so we know it works.</p>
      </Pad>
    </Section>
  );
}

/* ─── 7. Early access ─── */

function EarlyAccess() {
  return (
    <section className="relative border-t border-[#2E2E2E] bg-[#0A0A0A] text-[#EDEDED]">
      <Pad className="grid grid-cols-1 items-end gap-8 py-16 md:py-24 lg:grid-cols-2 lg:gap-12">
        <h2 className="max-w-[18ch] text-[36px] font-semibold leading-[1.05] tracking-[-0.045em] text-white [text-wrap:balance] md:text-[56px]">
          Paste your site, we send the first brief.
        </h2>
        <div className="flex min-w-0 flex-col gap-3">
          <EmailForm id="site-bottom" button="Send me my brief" dark />
          <p className="text-[14px] text-[#A1A1A1]">
            Free while we build. Or write to <span className="select-all font-mono text-[#EDEDED]">{CONTACT}</span>
          </p>
        </div>
      </Pad>
    </section>
  );
}

/* ─── Page ─── */

export default function FoundersLanding() {
  useEffect(() => {
    document.title = "Nubble for AI founders";
  }, []);

  const toTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("site-top");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  return (
    <div
      className="founders fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#FAFAFA] text-fg antialiased [-webkit-overflow-scrolling:touch]"
      style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif", colorScheme: "light" }}
    >
      <style>{`
        .founders .font-mono{font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
        .founders .text-fg{color:#171717} .founders .text-mute{color:#666666}
        .founders .border-line{border-color:#EAEAEA} .founders .bg-line{background-color:#EAEAEA}
      `}</style>
      <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 md:px-12">
          <a href="/" className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.03em] text-fg">
            nubble
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] font-normal tracking-normal text-mute">
              for founders
            </span>
          </a>
          <a
            href="#site-top"
            onClick={toTop}
            className="hidden h-9 items-center rounded-md bg-[#171717] px-4 text-[14px] font-medium text-white hover:bg-[#383838] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3] sm:inline-flex"
          >
            Get my first brief
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] border-line bg-white md:border-x">
        <Opening />
        <Why />
        <HowItWorks />
        <LiveReader />
        <GetBack />
        <WhereItLives />
        <EarlyAccess />
      </main>
      <footer className="mx-auto max-w-[1200px] border-line px-5 py-8 md:border-x md:px-12">
        <p className="font-mono text-[12px] text-mute">
          nubble.me, made by POKPOK. <span className="select-all">{CONTACT}</span>
        </p>
      </footer>
    </div>
  );
}
