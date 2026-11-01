import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useInView, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { NubbleReader } from "@/components/NubbleReader";
import type { ContentDocument } from "@/lib/sample-content";
import {
  AnatomyBrief,
  Badge,
  BriefPart,
  CompetitorsDemo,
  Count,
  DailyFlood,
  EmailForm,
  Ext,
  INVESTOR_PREVIEWS,
  OUTPUT_PREVIEWS,
  PROMISE,
  PicIndustry,
  PicLab,
  PicMoat,
  PicProtected,
  PicStale,
  PlaceMock,
  ProfileDemo,
  RunDemo,
  SourcesDemo,
  TodayTools,
  fade,
  usePlay,
} from "./founders";
import { BRIEF, CONTACT, INVESTOR_ANSWERS, LABELS, OTHER_ANSWERS, PAINS, PLACES, RUN, SIZES, type Label } from "./founders-data";

/*
 * /founders-v2: same words as /founders, new visual hierarchy.
 * Rhythm: white quiet bands carry reading; black bands carry the moments that matter.
 * Two accent colours, each with one meaning: red = a threat to you, amber = Nubble's answer (the So what).
 * Three accent moments: the copied claim (red), the So what swipe (amber on black), the investor answers (black).
 * No decorative icons. Every visual is a preview of a real output or a real event.
 */

const RED = "#E5484D";
const AMBER = "#FFB224";

/* ─── Building blocks ─── */

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 md:px-12 ${className}`}>{children}</div>;
}

function Band({
  children,
  tone = "white",
  id,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "white" | "black" | "grey";
  id?: string;
  className?: string;
}) {
  const cls = tone === "black" ? "bg-[#0A0A0A] text-[#EDEDED]" : tone === "grey" ? "bg-[#F5F5F5] text-fg" : "bg-white text-fg";
  return (
    <section id={id} className={`relative scroll-mt-14 ${cls} ${className}`}>
      {children}
    </section>
  );
}

function H2({ children, dark = false, className = "" }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <h2
      className={`max-w-[20ch] text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] [text-wrap:balance] md:text-[60px] ${
        dark ? "text-white" : "text-fg"
      } ${className}`}
    >
      {children}
    </h2>
  );
}

function Lead({ children, dark = false, className = "" }: { children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <p className={`max-w-[58ch] text-[17px] leading-[1.6] md:text-[19px] ${dark ? "text-[#A1A1A1]" : "text-mute"} ${className}`}>
      {children}
    </p>
  );
}

/** A small step number that reads as a sequence marker, not decoration. */
function StepNo({ n, dark = false }: { n: string; dark?: boolean }) {
  return <span className={`font-mono text-[13px] tabular-nums ${dark ? "text-[#8F8F8F]" : "text-mute"}`}>{n}</span>;
}

/** Scales a small preview up so it reads as the main picture of its block. */
function Big({ children, scale = 1.35, className = "" }: { children: React.ReactNode; scale?: number; className?: string }) {
  return (
    <div className={className} style={{ zoom: scale }}>
      {children}
    </div>
  );
}

function StoryToggle({ body, dark = false, id }: { body: string; dark?: boolean; id: string }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3] ${
          dark ? "text-white decoration-[#5A5A5A] hover:decoration-white" : "text-fg decoration-[#C9C9C9] hover:decoration-[#171717]"
        }`}
      >
        {open ? "Hide the story" : "Read the story"}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex">
          <ChevronDown size={16} aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className={`max-w-[56ch] pt-2 text-[16px] leading-[1.6] ${dark ? "text-[#A1A1A1]" : "text-mute"}`}>{body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── 1. Opening ─── */

function HeroBrief() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(9);
  useEffect(() => {
    if (!inView || reduce) return;
    setStage(0);
    const t = [1, 2, 3, 4].map((s) => window.setTimeout(() => setStage(s), 300 + s * 380));
    return () => t.forEach(clearTimeout);
  }, [inView, reduce]);
  const thrown = RUN.filter((r) => !r.kept).length;
  const [red, ...rest] = BRIEF;
  const show = (s: number) => ({
    initial: false as const,
    animate: stage >= s ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
    transition: { duration: 0.35, ease: "easeOut" as const },
  });
  return (
    <div ref={ref} className="overflow-hidden rounded-2xl bg-[#0A0A0A] text-[#EDEDED] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#262626] px-5 py-3">
        <span className="font-mono text-[12px] text-[#A1A1A1]">Brief for pokpok.ai, 15 Sep to 31 Oct 2026</span>
        <span className="hidden font-mono text-[12px] text-[#8F8F8F] sm:inline">example</span>
      </div>

      <motion.div {...show(1)} className="grid grid-cols-3 border-b border-[#262626]">
        {[
          { n: RUN.length, k: "rival posts read", c: "text-white" },
          { n: thrown, k: "thrown, never shown", c: "text-[#8F8F8F]" },
          { n: RUN.length - thrown, k: "kept for you", c: "text-[#FFB224]" },
        ].map((s, i) => (
          <div key={s.k} className={`px-5 py-4 ${i ? "border-l border-[#262626]" : ""}`}>
            <p className={`text-[34px] font-semibold leading-none tracking-[-0.04em] md:text-[40px] ${s.c}`}>
              <Count from={0} to={s.n} delay={0.4 + i * 0.2} />
            </p>
            <p className="mt-1.5 text-[12px] leading-tight text-[#A1A1A1]">{s.k}</p>
          </div>
        ))}
      </motion.div>

      <motion.article {...show(2)} className="relative border-b border-[#262626] px-5 py-5">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: RED }} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge label={red.label} dark />
          <span className="font-mono text-[12px] text-[#A1A1A1]">{red.date}</span>
        </div>
        <h3 className="mt-2 text-[22px] font-semibold leading-[1.2] tracking-[-0.025em] text-white md:text-[24px]">{red.title}</h3>
        <p className="mt-1.5 text-[14px] text-[#A1A1A1]">
          “{red.quote}” <Ext href={red.url}>{red.source}</Ext>
        </p>
        <p className="mt-4 font-mono text-[12px]" style={{ color: AMBER }}>
          so what
        </p>
        <p className="mt-0.5 text-[19px] font-medium leading-[1.4] text-white">{red.soWhat}</p>
        <p className="mt-3 font-mono text-[12px] text-[#8F8F8F]">your move</p>
        <p className="mt-0.5 text-[15px] leading-[1.5] text-[#D4D4D4]">{red.move}</p>
      </motion.article>

      {rest.map((s, i) => (
        <motion.article key={s.title} {...show(3 + i)} className="border-b border-[#262626] px-5 py-4 last:border-b-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Badge label={s.label} dark />
            <span className="font-mono text-[12px] text-[#A1A1A1]">{s.date}</span>
          </div>
          <h3 className="mt-1.5 text-[16px] font-semibold leading-[1.3] text-white">{s.title}</h3>
          <p className="mt-1 hidden text-[13px] text-[#8F8F8F] sm:block">
            “{s.quote}” <Ext href={s.url}>{s.source}</Ext>
          </p>
          <p className="mt-2 text-[14px] leading-[1.5] text-[#D4D4D4]">
            <span className="font-mono text-[12px]" style={{ color: AMBER }}>
              so what{" "}
            </span>
            {s.soWhat}
          </p>
          {s.move && (
            <p className="mt-1 text-[14px] leading-[1.5] text-[#A1A1A1]">
              <span className="font-mono text-[12px] text-[#8F8F8F]">your move </span>
              {s.move}
            </p>
          )}
        </motion.article>
      ))}
      <p className="border-t border-[#262626] px-5 py-3 font-mono text-[12px] text-[#8F8F8F]">
        Run by hand today, the way Nubble does it.{" "}
        <Ext href="#filter" className="text-[#EDEDED]">
          See all {RUN.length} posts
        </Ext>
      </p>
    </div>
  );
}

function Opening() {
  return (
    <Band>
      <Wrap className="grid grid-cols-1 gap-10 pb-14 pt-10 md:pb-20 md:pt-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col items-start gap-6">
          <p className="text-[16px] leading-[1.5] text-mute md:text-[18px]">You run an AI startup. Small team, one product, a homepage that says why you.</p>
          <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] text-fg [text-wrap:balance] md:text-[68px]">
            Stop reading the news, competitors' blogs, and other founders' self-promoting B.S. posts on LinkedIn.
          </h1>
          <p className="max-w-[40ch] text-[20px] leading-[1.45] text-fg md:text-[24px]">
            Nubble tells you what the news means for your company, shows you the proof, and gives you something you can send.
          </p>
          <div className="flex w-full flex-col gap-3">
            <EmailForm id="site-top" button="Get my first brief" />
            <p className="text-[14px] text-mute">Free while we build. Today the reader at nubble.me is live. Slack, Telegram and Claude are being built.</p>
          </div>
        </div>
        <div className="min-w-0 lg:pt-2">
          <HeroBrief />
        </div>
      </Wrap>
    </Band>
  );
}

/* ─── 2. Why ─── */

function Founder() {
  return (
    <Band tone="black">
      <Wrap className="py-14 md:py-24">
        <p className="max-w-[24ch] text-[30px] font-semibold leading-[1.12] tracking-[-0.035em] text-white [text-wrap:balance] md:text-[52px]">
          We built it because we are that founder.{" "}
          <span className="text-[#8F8F8F]">POKPOK is our company. Everything below happened to us.</span>
        </p>
      </Wrap>
    </Band>
  );
}

function TwoHoursBig() {
  const { ref, step } = usePlay(200);
  const on = step >= 1;
  return (
    <div ref={ref} aria-hidden className="flex min-w-0 flex-col gap-5">
      <div>
        <p className="text-[96px] font-semibold leading-[0.85] tracking-[-0.06em] text-fg md:text-[150px]">2h</p>
        <p className="mt-3 text-[16px] text-mute">a day to read rivals' websites and release notes</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#EDEDED]">
          <motion.div className="h-full rounded-full bg-[#171717]" initial={false} animate={{ width: on ? "100%" : "0%" }} transition={{ duration: 1.4, ease: "easeInOut" }} />
        </div>
      </div>
      <div>
        <div className="h-3 overflow-hidden rounded-full bg-[#EDEDED]">
          <motion.div className="h-full rounded-full" style={{ background: RED }} initial={false} animate={{ width: on ? "3%" : "0%" }} transition={{ duration: 0.6, delay: 1.2 }} />
        </div>
        <p className="mt-2 text-[16px] font-medium" style={{ color: "#C4262C" }}>
          what you have: none of it
        </p>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <Band>
      <DailyFlood />
      <Wrap className="grid grid-cols-1 items-center gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-5">
          <p className="max-w-[30ch] text-[24px] font-semibold leading-[1.25] tracking-[-0.025em] text-fg md:text-[32px]">
            Every day your competitors ship, raise, change prices, or copy that line from your homepage.
          </p>
          <Lead>
            Every day OpenAI, Anthropic and Google release something that may cover what you sell. Nobody tells you which of it
            matters to you. You find out late, on X, or when an investor asks how you are different.
          </Lead>
          <Lead>
            You do not have two hours a day to read rivals' websites and release notes. So you skip it, and you pay for it later: a
            dead plan, a copied claim, an investor question you cannot answer with proof.
          </Lead>
        </div>
        <TwoHoursBig />
      </Wrap>
    </Band>
  );
}

const INVESTOR_PICS = [PicProtected, PicMoat, PicIndustry];

/** Accent moment: the three investor questions, as big as an investor's voice in the room. */
function InvestorQuestions() {
  return (
    <Band tone="black">
      <Wrap className="py-14 md:py-24">
        <H2 dark>Six things that happen to you (and to us at pokpok.ai).</H2>
        <ol className="mt-10 flex flex-col md:mt-16">
          {PAINS.slice(0, 3).map((p, i) => {
            const Pic = INVESTOR_PICS[i];
            const q = p.head.replace("An investor asks: ", "");
            return (
              <li key={p.head} className="grid grid-cols-1 gap-5 border-t border-[#262626] py-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12 md:py-14">
                <div className="flex min-w-0 flex-col gap-4">
                  <StepNo n={`0${i + 1}`} dark />
                  <h3 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.035em] text-white [text-wrap:balance] md:text-[44px]">
                    <span className="text-[#8F8F8F]">An investor asks: </span>
                    {q}
                  </h3>
                  <StoryToggle body={p.body} dark id={`inv-${i}`} />
                </div>
                <Big scale={1.2} className="min-w-0">
                  <Pic />
                </Big>
              </li>
            );
          })}
        </ol>
      </Wrap>
    </Band>
  );
}

/** Accent moment: the copied claim, set as large as it felt. */
function CopiedClaim() {
  const { ref, step } = usePlay(100);
  const p = PAINS[3] as (typeof PAINS)[3];
  return (
    <Band className="overflow-hidden">
      <div aria-hidden className="h-1.5 w-full" style={{ background: RED }} />
      <Wrap className="grid grid-cols-1 gap-10 py-14 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div className="flex min-w-0 flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <StepNo n="04" />
            <Badge label="code-red" />
          </div>
          <h3 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-fg [text-wrap:balance] md:text-[48px]">{p.head}</h3>
          <Lead>{p.body}</Lead>
          {"proof" in p && p.proof && (
            <p className="font-mono text-[13px] text-mute">
              Proof: <Ext href={p.proof.url} className="text-fg">{p.proof.text}</Ext>
            </p>
          )}
        </div>
        <div ref={ref} aria-hidden className="flex min-w-0 flex-col justify-center gap-4">
          <motion.div {...fade(step >= 1)} className="rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-5 md:p-7">
            <p className="font-mono text-[13px] text-mute">pokpok.ai, our main difference</p>
            <p className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-fg md:text-[44px]">Brand Perception Truth</p>
          </motion.div>
          <motion.div
            {...fade(step >= 2)}
            className="rounded-xl border-2 p-5 md:p-7"
            style={{ borderColor: RED, background: "#FFF5F5" }}
          >
            <p className="font-mono text-[13px]" style={{ color: "#C4262C" }}>
              peec.ai, 16 Sep 2026
            </p>
            <p className="mt-2 text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] md:text-[44px]" style={{ color: "#C4262C" }}>
              Introducing brand perception
            </p>
          </motion.div>
          <motion.p {...fade(step >= 3)} className="text-[17px] font-medium text-fg md:text-[19px]">
            Overnight: two companies, the same sentence.
          </motion.p>
        </div>
      </Wrap>
    </Band>
  );
}

function StaleAndLab() {
  const items = [
    { p: PAINS[4], Pic: PicStale, n: "05" },
    { p: PAINS[5], Pic: PicLab, n: "06" },
  ];
  return (
    <Band tone="grey">
      <Wrap className="grid grid-cols-1 gap-12 py-14 md:grid-cols-2 md:gap-12 md:py-20">
        {items.map(({ p, Pic, n }, i) => (
          <article key={p.head} className="flex min-w-0 flex-col gap-4">
            <StepNo n={n} />
            <h3 className="text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] text-fg [text-wrap:balance] md:text-[34px]">{p.head}</h3>
            <Big scale={1.25}>
              <Pic />
            </Big>
            <StoryToggle body={p.body} id={`pain-${i + 5}`} />
            {"proof" in p && p.proof && (
              <p className="font-mono text-[12px] leading-[1.6] text-mute">
                Proof: <Ext href={p.proof.url} className="text-fg">{p.proof.text}</Ext>
              </p>
            )}
          </article>
        ))}
      </Wrap>
    </Band>
  );
}

function Today() {
  return (
    <Band tone="black">
      <Wrap className="grid grid-cols-1 items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
        <p className="max-w-[40ch] text-[20px] leading-[1.55] tracking-[-0.01em] md:text-[22px]">
          <span className="font-semibold text-white">What you have today:</span>{" "}
          <span className="text-[#A1A1A1]">
            X, newsletters, investor group chats, a ChatGPT window. All of it tells you what happened to everyone. None of it tells you
            what it means for your company. None of it throws away the part that has nothing to do with you, which is most of it. So
            you read for two hours a day you do not have, or you skip it and get caught.
          </span>
        </p>
        <Big scale={1.15}>
          <TodayTools />
        </Big>
      </Wrap>
    </Band>
  );
}

/* ─── 3. The promise ─── */

function Promise() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-120px" });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(-1);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!inView || reduce || held) return;
    setActive((a) => (a < 0 ? 0 : a));
    const t = window.setInterval(() => setActive((a) => (a + 1) % PROMISE.length), 2800);
    return () => clearInterval(t);
  }, [inView, reduce, held]);
  return (
    <Band>
      <Wrap className="flex flex-col gap-6 pb-10 pt-16 md:pb-14 md:pt-24">
        <h2 className="max-w-[16ch] text-[40px] font-semibold leading-[1] tracking-[-0.05em] text-fg [text-wrap:balance] md:text-[72px]">
          Nubble watches your market for one company: <span className="underline decoration-[6px] underline-offset-[10px]" style={{ textDecorationColor: AMBER }}>yours.</span>
        </h2>
        <Lead>
          Nubble is for you. It watches your competitors and the labs every day and tells you only what touches your company. Then it
          helps you hit back: what to say now, which claim is still only yours, and the promise no rival makes yet.
        </Lead>
      </Wrap>
      <Wrap className="pb-16 md:pb-24">
        <div ref={ref} className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-14">
          <ol className="flex min-w-0 flex-col">
            {PROMISE.map((b, i) => {
              const on = active === i;
              return (
                <li key={b.bold} className="border-t border-[#EAEAEA] last:border-b">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setHeld(true);
                      setActive(i);
                    }}
                    className="flex w-full items-start gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0070F3]"
                  >
                    <span
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold transition-colors duration-300 ${
                        on ? "text-[#0A0A0A]" : "bg-[#F2F2F2] text-fg"
                      }`}
                      style={on ? { background: AMBER } : undefined}
                    >
                      {i + 1}
                    </span>
                    <span className={`text-[18px] leading-[1.5] transition-colors duration-300 md:text-[20px] ${on ? "text-fg" : "text-[#8F8F8F]"}`}>
                      <span className={`font-semibold ${on ? "text-fg" : "text-[#5A5A5A]"}`}>{b.bold}</span>
                      {b.rest}
                    </span>
                  </button>
                  <div className={`pb-5 pl-11 lg:hidden ${on || (active < 0 && i === 0) ? "" : "hidden"}`}>
                    <div className="rounded-lg bg-[#0A0A0A] px-4 py-3 font-mono text-[12px] leading-[1.55] text-[#EDEDED]">
                      <BriefPart n={i} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="hidden min-w-0 lg:block">
            <div className="lg:sticky lg:top-24">
              <AnatomyBrief active={active} />
              <p className="mt-3 font-mono text-[12px] text-mute">A real brief, from the example run below. Tap a line to see its part.</p>
            </div>
          </div>
        </div>
      </Wrap>
    </Band>
  );
}

/* ─── 4. How it works ─── */

function StepHead({ n, title, dark = false, children }: { n: string; title: string; dark?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <StepNo n={n} dark={dark} />
      <h3
        className={`text-[26px] font-semibold leading-[1.1] tracking-[-0.03em] [text-wrap:balance] md:text-[36px] ${
          dark ? "text-white" : "text-fg"
        }`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

const SIZE_TABS = ["So what", "Executive summary", "Original"] as const;

function isHeading(p: string) {
  return !/[.:”"]$/.test(p) && p.length < 70;
}

/** Accent moment: the three sizes, with the So what as large as a headline. */
function SizesBig() {
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
      <div role="tablist" aria-label="Story size" className="grid grid-cols-3 gap-1 rounded-xl bg-[#1A1A1A] p-1">
        {SIZE_TABS.map((t, i) => (
          <button
            key={t}
            role="tab"
            aria-selected={size === i}
            onClick={() => go(i)}
            className={`relative min-h-11 rounded-lg px-2 py-2 text-[14px] font-medium leading-tight transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0070F3] md:text-[15px] ${
              size === i ? "text-[#0A0A0A]" : "text-[#A1A1A1] hover:text-white"
            }`}
          >
            {size === i && (
              <motion.span
                layoutId="size-pill-v2"
                className="absolute inset-0 rounded-lg"
                style={{ background: i === 0 ? AMBER : "#FFFFFF" }}
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
        className="cursor-grab touch-pan-y overflow-hidden rounded-xl bg-white text-fg active:cursor-grabbing"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#EAEAEA] px-5 py-3 md:px-7">
          <Badge label="weakened" />
          <span className="font-mono text-[12px] text-mute">
            {SIZES.date}, <Ext href={SIZES.url}>GlobeNewswire</Ext>
          </span>
        </div>
        <div className="px-5 py-6 md:px-7 md:py-8">
          <h4 className="text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-mute md:text-[20px]">{SIZES.title}</h4>
          <motion.div
            key={size}
            initial={reduce ? false : { opacity: 0, x: 24 * dir }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mt-4"
          >
            {size === 0 && (
              <div>
                <p className="font-mono text-[12px] text-[#9A4A00]">So what, made for one company only: yours</p>
                <p className="mt-2 text-[22px] font-semibold leading-[1.35] tracking-[-0.02em] text-fg md:text-[28px]">{SIZES.soWhat}</p>
              </div>
            )}
            {size === 1 && <p className="text-[19px] leading-[1.55] text-fg md:text-[21px]">{SIZES.summary}</p>}
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
        <p className="border-t border-[#EAEAEA] px-5 py-3 font-mono text-[12px] text-mute md:px-7">Swipe the card or tap a size.</p>
      </motion.div>
    </div>
  );
}

const LABEL_FILL: Record<Label, { bg: string; fg: string }> = {
  "code-red": { bg: RED, fg: "#FFFFFF" },
  weakened: { bg: AMBER, fg: "#0A0A0A" },
  "worth-knowing": { bg: "#0070F3", fg: "#FFFFFF" },
};

function HowItWorks() {
  const thrown = RUN.filter((r) => !r.kept).length;
  const kept = RUN.length - thrown;
  const moves = RUN.filter((r) => r.kept && r.kept !== "worth-knowing").length;
  const s = BRIEF[0];
  return (
    <>
      <Band tone="grey">
        <Wrap className="pb-6 pt-16 md:pt-24">
          <h2 className="text-[48px] font-semibold leading-[0.95] tracking-[-0.055em] text-fg md:text-[96px]">How it works</h2>
        </Wrap>
        {/* 01 + 02: the setup */}
        <Wrap className="grid grid-cols-1 gap-8 py-10 md:py-14 lg:grid-cols-2 lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6">
            <StepHead n="01" title="Paste your website.">
              <Lead>
                That is the whole setup. Nubble reads it and works out what you sell, who buys it, what market you are in, and your main
                claim.
              </Lead>
            </StepHead>
            <ProfileDemo />
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <StepHead n="02" title="Nubble finds your competitors and the big players.">
              <Lead>
                It searches the web live. It does not answer from memory. Every company comes with the link where it was found. You add
                the ones it missed and delete the ones that do not matter.
              </Lead>
              <p className="text-[22px] font-semibold tracking-[-0.02em] text-fg">You correct. You never fill in a form.</p>
            </StepHead>
            <CompetitorsDemo twoUp />
          </div>
        </Wrap>
        {/* 03 + 04: read everything, keep almost nothing */}
        <Wrap className="grid grid-cols-1 gap-8 border-t border-[#E5E5E5] py-10 md:py-14 lg:grid-cols-2 lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6">
            <StepHead n="03" title="Every day it reads the sources." />
            <SourcesDemo plain />
          </div>
          <div id="filter" className="flex min-w-0 scroll-mt-16 flex-col gap-6">
            <StepHead n="04" title="It throws away what does not concern you.">
              <Lead>Silently. You never see it. There is no “nothing relevant today” message either. A quiet week is a quiet week.</Lead>
            </StepHead>
            <div className="flex items-end gap-4 md:gap-6" aria-label={`${RUN.length} read, ${kept} kept, ${moves} need a move`}>
              {[
                { k: "read", v: <Count from={0} to={RUN.length} />, c: "text-[#B5B5B5]" },
                { k: "kept", v: <Count from={RUN.length} to={kept} delay={0.8} />, c: "text-fg" },
                { k: "need a move", v: <Count from={kept} to={moves} delay={1.4} />, c: "" },
              ].map((c, i) => (
                <div key={c.k} className="flex items-end gap-4 md:gap-6">
                  {i > 0 && <span className="pb-6 text-[28px] text-[#B5B5B5]">→</span>}
                  <div>
                    <p
                      className={`text-[72px] font-semibold leading-[0.85] tracking-[-0.06em] md:text-[104px] ${c.c}`}
                      style={i === 2 ? { color: "#C4262C" } : undefined}
                    >
                      {c.v}
                    </p>
                    <p className="mt-2 font-mono text-[12px] text-mute">{c.k}</p>
                  </div>
                </div>
              ))}
            </div>
            <RunDemo />
          </div>
        </Wrap>
      </Band>

      {/* 05: the So what, the accent moment */}
      <Band tone="black">
        <Wrap className="grid grid-cols-1 gap-10 py-16 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <StepHead n="05" title="Every story that stays comes in three sizes." dark>
            <Lead dark>
              Original (the full story), Executive summary (the short one), and So what (the Nubble signal, made for one company only:
              yours). Swipe to switch.{" "}
              <span className="text-white">
                The So what is the story retold for your company: what changed and what it means for you.
              </span>{" "}
              Some stories need a move. Some are just worth knowing, and then the So what says “no change needed” and means it.
            </Lead>
          </StepHead>
          <SizesBig />
        </Wrap>
      </Band>

      {/* 06: labels */}
      <Band>
        <Wrap className="flex flex-col gap-8 py-16 md:py-24">
          <StepHead n="06" title="Stories carry labels.">
            <Lead>
              A label is always tied to the rival's own sentence, which you can see. If we got one wrong, say so once and it stays
              ignored.
            </Lead>
          </StepHead>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {(Object.keys(LABELS) as Label[]).map((l) => (
              <div key={l} className="flex min-w-0 flex-col gap-3 rounded-xl p-5 md:p-6" style={{ background: LABEL_FILL[l].bg, color: LABEL_FILL[l].fg }}>
                <p className="text-[24px] font-semibold tracking-[-0.03em] md:text-[28px]">{LABELS[l].name}</p>
                <p className="text-[16px] leading-[1.5] opacity-90">{LABELS[l].meaning}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 rounded-xl border-2 p-5 md:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] md:p-7" style={{ borderColor: RED }}>
            <div className="flex flex-col items-start gap-3">
              <Badge label="code-red" />
              <p className="text-[20px] font-semibold leading-[1.25] tracking-[-0.02em] text-fg md:text-[24px]">A real code red, from our own company.</p>
              <p className="text-[16px] leading-[1.55] text-fg">
                Peec AI added “brand perception” to its tracker.{" "}
                <Ext href={s.url} className="font-mono text-[12px] text-mute">
                  {s.source}, {s.date}
                </Ext>
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-mono text-[12px] text-[#9A4A00]">so what</p>
                <p className="mt-1 text-[20px] font-semibold leading-[1.35] tracking-[-0.015em] text-fg md:text-[22px]">{s.soWhat}</p>
              </div>
              <div>
                <p className="font-mono text-[12px] text-mute">your move</p>
                <p className="mt-1 text-[16px] leading-[1.55] text-fg">{s.move}</p>
              </div>
            </div>
          </div>
        </Wrap>
      </Band>
    </>
  );
}

/* ─── 5. The live reader ─── */

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
      const res = await fetch(`${import.meta.env.BASE_URL}data/feed/ai-news/latest.json`);
      if (!res.ok) throw new Error("feed");
      return res.json();
    },
  });
  return (
    <Band tone="grey" id="reader">
      <Wrap className="grid grid-cols-1 items-center gap-8 py-16 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#EBFAED] px-3 py-1 text-[13px] font-medium text-[#297A3A]">
            <span className="h-2 w-2 rounded-full bg-[#45A557]" /> Live today
          </span>
          <H2>The live reader. Swipe it yourself.</H2>
          <p className="font-mono text-[13px] text-mute">Nubble AI News{data ? `, edition of ${formatDate(data.date)}` : ""}. The latest one.</p>
          <p className="text-[16px] text-mute">Swipe a story sideways to make it shorter or longer.</p>
        </div>
        <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[28px] border-[6px] border-[#0A0A0A] bg-white shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)]">
          <div className="h-[540px] md:h-[620px]">
            {isLoading && <div className="flex h-full items-center justify-center font-mono text-[13px] text-mute">Loading the edition…</div>}
            {isError && (
              <div className="flex h-full items-center justify-center px-6 text-center text-[14px] text-mute">
                The edition did not load. Open nubble.me to read it.
              </div>
            )}
            {data && data.stories?.length > 0 && <NubbleReader document={feedToDocument(data)} embedded />}
          </div>
        </div>
      </Wrap>
    </Band>
  );
}

/* ─── 6. What you get back: pick who asks, see what you hand them ─── */

function Switcher({
  items,
  previews,
  dark = false,
  scale = 1.5,
  idPrefix,
}: {
  items: { who: string; what: string; tag?: React.ReactNode }[];
  previews: (() => JSX.Element)[];
  dark?: boolean;
  scale?: number;
  idPrefix: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-120px" });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!inView || reduce || held) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % items.length), 4200);
    return () => clearInterval(t);
  }, [inView, reduce, held, items.length]);
  const Prev = previews[active];
  const line = dark ? "border-[#262626]" : "border-[#EAEAEA]";
  return (
    <div ref={ref} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      <ul className="flex min-w-0 flex-col">
        {items.map((a, i) => {
          const on = active === i;
          const P = previews[i];
          return (
            <li key={a.who} className={`border-t ${line} last:border-b`}>
              <div
                className="flex cursor-pointer flex-col gap-1.5 py-5"
                onClick={() => {
                  setHeld(true);
                  setActive(i);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`text-[20px] font-semibold leading-[1.2] tracking-[-0.025em] transition-colors duration-300 [text-wrap:balance] md:text-[24px] ${
                      on ? (dark ? "text-white" : "text-fg") : "text-[#8F8F8F]"
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={on}
                      aria-controls={`${idPrefix}-${i}`}
                      className="text-left focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3]"
                    >
                      {a.who}
                    </button>
                  </h3>
                  {a.tag}
                </div>
                <p className={`text-[16px] leading-[1.55] ${dark ? "text-[#A1A1A1]" : "text-mute"}`}>{a.what}</p>
                {on && (
                  <motion.span
                    layoutId={`${idPrefix}-bar`}
                    aria-hidden
                    className="mt-2 h-[3px] w-12 rounded-full"
                    style={{ background: AMBER }}
                  />
                )}
              </div>
              {on && (
                <div id={`${idPrefix}-${i}`} className="pb-6 lg:hidden">
                  <Big scale={1.25}>
                    <P />
                  </Big>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="hidden min-w-0 lg:block">
        <div className="lg:sticky lg:top-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Big scale={scale}>
                <Prev />
              </Big>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function GetBack() {
  return (
    <>
      <Band tone="black">
        <Wrap className="flex flex-col gap-6 pb-10 pt-16 md:pb-14 md:pt-24">
          <H2 dark>Every brief turns into something you can send, and into a sharper way to talk about your product.</H2>
          <Lead dark>
            Each piece starts from your company, not from the article. We already do this at POKPOK with the tool we built for ourselves.
          </Lead>
        </Wrap>
        <Wrap className="pb-16 md:pb-24">
          <Switcher items={INVESTOR_ANSWERS} previews={INVESTOR_PREVIEWS} dark idPrefix="inv-ans" />
        </Wrap>
      </Band>
      <Band>
        <Wrap className="py-16 md:py-24">
          <Switcher items={OTHER_ANSWERS} previews={OUTPUT_PREVIEWS} idPrefix="out-ans" />
        </Wrap>
      </Band>
    </>
  );
}

/* ─── 7. Where it lives ─── */

function Status({ live }: { live: boolean }) {
  return live ? (
    <span className="inline-flex h-[24px] shrink-0 items-center gap-1.5 rounded-full bg-[#EBFAED] px-2.5 text-[12px] font-medium text-[#297A3A]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#45A557]" /> Live
    </span>
  ) : (
    <span className="inline-flex h-[24px] shrink-0 items-center rounded-full bg-[#F2F2F2] px-2.5 text-[12px] font-medium text-mute">Coming</span>
  );
}

const PLACE_PREVIEWS = [0, 1, 2, 3].map((i) => {
  const P = () => <PlaceMock i={i} />;
  return P;
});

function WhereItLives() {
  return (
    <Band tone="grey">
      <Wrap className="flex flex-col gap-6 pb-10 pt-16 md:pb-14 md:pt-24">
        <H2>You will not open another dashboard. Nubble comes to where you already are.</H2>
        <Lead>Today only the reader is live. The rest is being built, and the page says so.</Lead>
      </Wrap>
      <Wrap className="pb-8">
        <Switcher
          items={PLACES.map((p) => ({ who: p.name, what: p.body, tag: <Status live={p.live} /> }))}
          previews={PLACE_PREVIEWS}
          scale={1.5}
          idPrefix="place"
        />
      </Wrap>
      <Wrap className="pb-16 md:pb-24">
        <p className="text-[16px] text-mute">This is how we already deliver our own agent at POKPOK, so we know it works.</p>
      </Wrap>
    </Band>
  );
}

/* ─── 8. Early access ─── */

function EarlyAccess() {
  return (
    <Band tone="black">
      <Wrap className="grid grid-cols-1 items-end gap-10 py-20 md:py-28 lg:grid-cols-2 lg:gap-14">
        <h2 className="max-w-[14ch] text-[44px] font-semibold leading-[0.98] tracking-[-0.055em] text-white [text-wrap:balance] md:text-[76px]">
          Paste your site, we send the first brief.
        </h2>
        <div className="flex min-w-0 flex-col gap-3">
          <EmailForm id="site-bottom" button="Send me my brief" dark />
          <p className="text-[14px] text-[#A1A1A1]">
            Free while we build. Or write to <span className="select-all font-mono text-[#EDEDED]">{CONTACT}</span>
          </p>
        </div>
      </Wrap>
    </Band>
  );
}

/* ─── Page ─── */

export default function FoundersLandingV2() {
  useEffect(() => {
    document.title = "Nubble for AI founders";
  }, []);
  const [formOnScreen, setFormOnScreen] = useState(true);
  useEffect(() => {
    const el = document.getElementById("site-top");
    const root = document.querySelector(".founders");
    if (!el || !root) return;
    const io = new IntersectionObserver(([e]) => setFormOnScreen(e.isIntersecting), { root, threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const toTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("site-top");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  return (
    <div
      className="founders fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-white text-fg antialiased [-webkit-overflow-scrolling:touch]"
      style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif", colorScheme: "light" }}
    >
      <style>{`
        .founders .font-mono{font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
        .founders .text-fg{color:#171717} .founders .text-mute{color:#666666}
        .founders .border-line{border-color:#EAEAEA} .founders .bg-line{background-color:#EAEAEA}
      `}</style>
      <header className="sticky top-0 z-20 border-b border-[#EAEAEA] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 md:px-12">
          <a href="/" className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.03em] text-fg">
            nubble
            <span className="rounded-full border border-[#EAEAEA] px-2 py-0.5 font-mono text-[11px] font-normal tracking-normal text-mute">for founders</span>
          </a>
          <a
            href="#site-top"
            onClick={toTop}
            className={`inline-flex h-9 items-center rounded-md bg-[#171717] px-3 text-[14px] font-medium text-white transition-opacity duration-300 hover:bg-[#383838] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070F3] sm:px-4 ${
              formOnScreen ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            aria-hidden={formOnScreen}
            tabIndex={formOnScreen ? -1 : 0}
          >
            Get my first brief
          </a>
        </div>
      </header>
      <main>
        <Opening />
        <Founder />
        <Problem />
        <InvestorQuestions />
        <CopiedClaim />
        <StaleAndLab />
        <Today />
        <Promise />
        <HowItWorks />
        <LiveReader />
        <GetBack />
        <WhereItLives />
        <EarlyAccess />
      </main>
      <footer className="mx-auto max-w-[1200px] px-5 py-8 md:px-12">
        <p className="font-mono text-[12px] text-mute">
          nubble.me, made by POKPOK. <span className="select-all">{CONTACT}</span>
        </p>
      </footer>
    </div>
  );
}
