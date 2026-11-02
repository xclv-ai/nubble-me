import { useCallback, useContext, useState } from "react";
import { motion } from "framer-motion";
import { Ext } from "./founders";
import { BRIEF, PAINS } from "./founders-data";
import { XRayHunt } from "./founders-fx";
import { LuceBoldCtx } from "./founders-fx-data";
import { Maybe3D } from "./founders-luce-3d";
import { AMBER, LINE, MUTE, RED, Stamp } from "./founders-v3";

/*
 * /founders-v5 pieces.
 * 1. One story: the x-ray sits inside the intel folder as its evidence. Finding the copy stamps the folder Code red.
 *    Nothing waits on a tap: if nobody finds it, the lens finds it by itself.
 * 2. The sendables: what a founder actually sends after reading the folders. Built only from the three real, linked moves.
 */

const PEEC = BRIEF[0];
const AGENT = BRIEF[1];
const PROFOUND = BRIEF[2];

/* ─── 1. The intel folder with the x-ray inside ─── */

export function IntelFolder() {
  const [found, setFound] = useState(false);
  const onFound = useCallback(() => setFound(true), []);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {[PROFOUND, AGENT].map((f) => (
        <div
          key={f.url}
          data-l="glasscard"
          className="flex items-start justify-between gap-3 rounded-md border px-4 py-2 font-mono text-[12px] leading-[1.5]"
          style={{ borderColor: "#3A3326", background: "#16130D", color: "#BFB59F" }}
        >
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:text-white">
            {f.date}: {f.title}
          </a>
          <span className="shrink-0" style={{ color: f.label === "weakened" ? "#FF8B3E" : MUTE }}>
            {f.label === "weakened" ? "weakened" : "worth knowing"}
          </span>
        </div>
      ))}
      <div className="relative overflow-hidden rounded-md border" style={{ borderColor: found ? RED : "#5C4C2E", background: "#1C170F", transition: "border-color .4s" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3" style={{ borderColor: "#3A3326" }}>
          <span className="font-mono text-[12px]" style={{ color: "#BFB59F" }}>
            For pokpok.ai only. {PEEC.date}
          </span>
          <span className="flex items-center gap-2">
            <Stamp color="#E6E1D6">Top secret</Stamp>
            {found ? (
              <motion.span initial={{ scale: 2.2, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: -4 }} transition={{ type: "spring", stiffness: 300, damping: 14 }} className="inline-block">
                <Stamp color={RED}>Code red</Stamp>
              </motion.span>
            ) : (
              <span className="font-mono text-[12px]" style={{ color: MUTE }}>
                scanning…
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-4 px-5 py-5 md:px-6 md:py-6">
          <div>
            <p className="font-mono text-[12px]" style={{ color: "#BFB59F" }}>
              Your main difference
            </p>
            <p className="mt-1 text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] text-white md:text-[28px]">Brand Perception Truth</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[12px]" style={{ color: found ? RED : "#BFB59F" }}>
              {found ? "Evidence: Peec's blog uses your words" : "Evidence: x-ray Peec's blog post. Tap the headline."}
            </p>
            <XRayHunt embedded onFound={onFound} />
          </div>
          <div className="border-t pt-4" style={{ borderColor: "#3A3326" }}>
            <p className="font-mono text-[12px]" style={{ color: AMBER }}>
              So what
            </p>
            <p className="mt-1 text-[20px] font-semibold leading-[1.3] text-white">A rival now sells your main term: brand perception.</p>
            <p className="mt-4 font-mono text-[12px]" style={{ color: AMBER }}>
              Your move
            </p>
            <p className="mt-1 text-[16px] leading-[1.5] text-[#E6E1D6]">{PEEC.move}</p>
            <p className="mt-4 text-[13px]" style={{ color: "#A39A86" }}>
              Proof: “{PEEC.quote}” <Ext href={PEEC.url}>{PEEC.source}</Ext>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 2. What you send ─── */

const UPDATE = {
  subject: "October update: what rivals did, what is still ours",
  body: [
    "Rivals. Profound raised $180M at a $1.8B valuation (15 Sep). Peec started selling “brand perception”, our main term (16 Sep). On 21 Oct Otterly launched Brand Profiling: what AI says about a brand. On 22 Oct Peec shipped Actions, which ranks what a brand should fix first.",
    "Still only ours: we read a brand twice, the way people do and the way AI does, on the same 17 markers. No tracker on our comparison table does that yet.",
  ],
};

const POST = [
  "On 16 Sep a rival started using our phrase: “brand perception”.",
  "Good. Nobody copies a claim that doesn't work.",
  "Here is what a phrase can't copy. We read your brand twice: once the way people do, once the way AI does. Same 17 markers.",
  "Tracking what AI says about you is the start. Knowing whether people agree is the job.",
];

const SLIDE = [
  { date: "15 Sep", what: "Profound raises $180M at a $1.8B valuation", url: PROFOUND.url, color: AMBER },
  { date: "16 Sep", what: "Peec starts selling “brand perception”", url: PEEC.url, color: RED },
  { date: "22 Oct", what: "Peec ships Actions: what to fix first", url: AGENT.url, color: "#FF8B3E" },
];

function CopyBtn({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      onClick={() => {
        try {
          navigator.clipboard.writeText(text).then(
            () => setState("done"),
            () => setState("fail"),
          );
        } catch {
          setState("fail");
        }
        setTimeout(() => setState("idle"), 2200);
      }}
      data-l="glass"
      data-3d="glass"
      className="min-h-[44px] rounded-md border px-5 font-mono text-[12.5px] text-white hover:border-white"
      style={{ borderColor: "#3A4449" }}
    >
      {state === "done" ? "Copied" : state === "fail" ? "Select the text to copy" : "Copy"}
    </button>
  );
}

function Built({ items }: { items: { date: string; url: string; what: string }[] }) {
  return (
    <p className="text-[13px] leading-[1.6]" style={{ color: MUTE }}>
      Built from:{" "}
      {items.map((m, i) => (
        <span key={m.url}>
          <a href={m.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[#3A4449] underline-offset-2 hover:text-white">
            {m.date}, {m.what}
          </a>
          {i < items.length - 1 ? "; " : ""}
        </span>
      ))}
    </p>
  );
}

function Ask({ q, kind }: { q: string; kind: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-[12px]" style={{ color: AMBER }}>
        An investor asks
      </p>
      <h3 className="text-[21px] font-semibold leading-[1.15] tracking-[-0.03em] text-white [text-wrap:balance] md:text-[23px]">{q}</h3>
      <p className="font-mono text-[12px]" style={{ color: MUTE }}>
        You send: {kind}
      </p>
    </div>
  );
}

const QS = PAINS.slice(0, 3).map((p) => {
  const q = p.head.replace("An investor asks: ", "");
  return q.charAt(0).toUpperCase() + q.slice(1);
});

export function Sendables() {
  const updateText = `${UPDATE.subject}\n\n${UPDATE.body.join("\n\n")}`;
  const postText = POST.join("\n\n");
  const bold = useContext(LuceBoldCtx);
  const [lit, setLit] = useState<number | null>(null);
  const pull = (i: number) => {
    setLit(i);
    document.getElementById(`nb-send-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => setLit((x) => (x === i ? null : x)), 1600);
  };
  const ring = (i: number) => (bold && lit === i ? { outline: "2px solid #E9D27A", outlineOffset: "13px" } : undefined);
  return (
    <Maybe3D>
    <div className="flex flex-col gap-5">
      <p className="text-[17px] leading-[1.55] text-[#D9DDDF] md:text-[19px]">Every folder turns into something you send. Here are three, written from the moves above.</p>
      {bold && (
        <div role="group" aria-label="Pull up a sendable" className="flex flex-wrap justify-start gap-5 sm:gap-8">
          {[
            { t: "Investor update", d: "M4 6h16v12H4z M4 7l8 6 8-6" },
            { t: "LinkedIn post", d: "M5 4h14v16H5z M8 9h8 M8 13h8 M8 17h5" },
            { t: "Deck slide", d: "M3 5h18v11H3z M12 16v4 M8 20h8" },
          ].map((x, i) => (
            <button key={x.t} type="button" onClick={() => pull(i)} className="flex w-[84px] flex-col items-center gap-2 font-mono text-[12px] text-[#C9CFD2]">
              <span data-l="glass" data-3d="glass" data-on={lit === i ? "1" : "0"} data-color="#E9D27A" className="grid h-[60px] w-[60px] place-items-center" style={lit === i ? { outline: "2px solid #E9D27A", outlineOffset: "3px" } : undefined}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={lit === i ? "#E9D27A" : "#C9CFD2"} strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
                  <path d={x.d} />
                </svg>
              </span>
              <span className="text-center leading-tight">{x.t}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Competitors: the investor update */}
        <article id="nb-send-0" data-l="bezel" className="flex min-w-0 scroll-mt-[90px] flex-col gap-4 rounded-xl border bg-[#0B0E0F] p-5 transition-shadow md:p-6" style={{ borderColor: LINE, ...ring(0) }}>
          <Ask q={QS[0]} kind="a paragraph for your investor update" />
          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-[#F4F4F2] p-4 text-[#1A1A1A]">
            <p className="border-b border-[#D8D8D4] pb-2 text-[13px]">
              <span className="text-[#6B6B6B]">Subject: </span>
              <span className="font-semibold">{UPDATE.subject}</span>
            </p>
            {UPDATE.body.map((b) => (
              <p key={b} className="text-[15px] leading-[1.55]">
                {b}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CopyBtn text={updateText} />
          </div>
          <Built items={[{ date: "15 Sep", url: PROFOUND.url, what: "Profound" }, { date: "16 Sep", url: PEEC.url, what: "Peec blog" }, { date: "21 Oct", url: "https://otterly.ai/blog/brand-profiling/", what: "Otterly blog" }, { date: "22 Oct", url: AGENT.url, what: "Peec release" }]} />
        </article>

        {/* Moat: the LinkedIn post */}
        <article id="nb-send-1" data-l="bezel" className="flex min-w-0 scroll-mt-[90px] flex-col gap-4 rounded-xl border bg-[#0B0E0F] p-5 transition-shadow md:p-6" style={{ borderColor: LINE, ...ring(1) }}>
          <Ask q={QS[1]} kind="a post for LinkedIn, with the rival's own words as proof" />
          <div className="flex flex-1 flex-col gap-3 rounded-lg bg-[#F4F4F2] p-4 text-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] font-mono text-[13px] font-semibold text-white">VK</span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold leading-tight">Viktor Konovalov</span>
                <span className="block text-[12px] leading-tight text-[#6B6B6B]">CEO, PokPok.ai. Draft</span>
              </span>
            </div>
            {POST.map((b) => (
              <p key={b} className="text-[15px] leading-[1.55]">
                {b}
              </p>
            ))}
            <div className="rounded-md border border-[#D8D8D4] bg-white px-3 py-2 text-[13px]">
              <span className="text-[#6B6B6B]">peec.ai, 16 Sep: </span>“{PEEC.quote}”
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CopyBtn text={postText} />
          </div>
          <Built items={[{ date: "16 Sep", url: PEEC.url, what: "Peec blog" }]} />
        </article>

        {/* Industry: the deck slide */}
        <article id="nb-send-2" data-l="bezel" className="flex min-w-0 scroll-mt-[90px] flex-col gap-4 rounded-xl border bg-[#0B0E0F] p-5 transition-shadow md:p-6" style={{ borderColor: LINE, ...ring(2) }}>
          <Ask q={QS[2]} kind="the “why now” slide for your deck" />
          <div className="flex flex-col">
            <div data-l="glasscard" className="flex min-h-[230px] w-full max-w-full flex-col justify-between gap-4 rounded-lg border bg-[#050505] p-4 md:p-5" style={{ borderColor: "#2A3338" }}>
              <div>
                <p className="font-mono text-[12px] tracking-[0.12em]" style={{ color: AMBER }}>
                  WHY NOW
                </p>
                <p data-mono className="mt-1.5 !text-[17px] font-semibold !leading-[1.2] !tracking-[-0.02em] text-white md:!text-[18px]">
                  In five weeks: $180M into AI marketing, and a rival took our main phrase.
                </p>
              </div>
              <ol className="relative mt-3 flex flex-col gap-2 border-l pl-3" style={{ borderColor: "#3A4449" }}>
                {SLIDE.map((s) => (
                  <li key={s.date} className="relative text-[12.5px] leading-[1.35] text-[#D9DDDF]">
                    <span className="absolute -left-[17px] top-[5px] h-2 w-2 rounded-full" style={{ background: s.color }} />
                    <span className="font-mono" style={{ color: s.color }}>
                      {s.date}
                    </span>{" "}
                    {s.what}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CopyBtn text={`Why now\n\nIn five weeks: $180M into AI marketing, and a rival took our main phrase.\n\n${SLIDE.map((x) => `${x.date}: ${x.what}`).join("\n")}`} />
          </div>
          <Built items={SLIDE.map((s) => ({ date: s.date, url: s.url, what: s.what.split(" ")[0] }))} />
        </article>
      </div>
    </div>
    </Maybe3D>
  );
}

/* ─── 3. Two ways in ─── */

const PLANS = [
  {
    name: "Run it yourself",
    price: "Free",
    tag: "Open source",
    status: "Code coming",
    body: "You give it a story and your company. It writes the So what, with the proof. Your machine, your AI model.",
  },
  {
    name: "Nubble Cloud",
    price: "$10 a month",
    tag: "We do the reading",
    status: "Early access",
    body: "Paste your site once. We read your rivals every day and send you the folders. In Slack, Telegram and Claude as each one launches.",
  },
];

export function FormNote() {
  return (
    <p className="text-[14px]" style={{ color: MUTE }}>
      Nubble Cloud: $10 a month. Or run it yourself, free and open source.
    </p>
  );
}

export function Plans() {
  return (
    <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">
      {PLANS.map((p, i) => (
        <div key={p.name} data-l="glasscard" className="flex min-w-0 flex-col gap-2 rounded-lg border p-4" style={{ borderColor: i ? AMBER : "#2A3338", background: i ? "#1A150B" : "#0B0E0F" }}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-[13px] text-white">{p.name}</p>
            <p className="font-mono text-[11.5px]" style={{ color: i ? AMBER : MUTE }}>
              {p.status}
            </p>
          </div>
          <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] text-white">{p.price}</p>
          <p className="font-mono text-[12px]" style={{ color: i ? AMBER : "#A9B1B5" }}>
            {p.tag}
          </p>
          <p className="text-[14px] leading-[1.5] text-[#C9CFD2]">{p.body}</p>
        </div>
      ))}
    </div>
  );
}
