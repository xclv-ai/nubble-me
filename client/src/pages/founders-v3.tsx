import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Count, EmailForm, Ext, INVESTOR_PREVIEWS, usePlay, fade, type FormCopy } from "./founders";
import { Big, SizesBig } from "./founders-v2";
import { BRIEF, CONTACT, INVESTOR_ANSWERS, PAINS, PLACES, PROFILE } from "./founders-data";

/*
 * /founders-v3: the bunker.
 * The founder sits in a bunker. On the wall, the map of everyone around them.
 * On the desk, top secret folders: what a rival did, what it means for you, your move.
 * Five screens, nothing hidden behind a tap. Every fact comes from founders-data.ts (real, linked).
 */

const RED = "#FF4D4F";
const AMBER = "#FFB224";
const LINE = "#1E2529";
const MUTE = "#8A9398";

const INTEL: FormCopy = {
  subject: "Nubble: my first intel folder",
  ask: "Send me my first intel folder.",
  err: "Paste your website, like yourstartup.com, so the intel is about your company.",
  cmd: "nubble intel",
  done: "Your email app opens with your site in it. Hit send and we reply with your first intel folder.",
};

function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 md:px-12 ${className}`}>{children}</div>;
}

function Stamp({ children, color, className = "" }: { children: React.ReactNode; color: string; className?: string }) {
  return (
    <span
      className={`inline-block rounded-[3px] border-2 px-2 py-0.5 font-mono text-[12px] font-medium uppercase tracking-[0.12em] ${className}`}
      style={{ color, borderColor: color }}
    >
      {children}
    </span>
  );
}

/* ─── The wall screen: the map of your competitors ─── */

const RIVALS = [
  { name: "Peec AI", x: 290, y: 112, above: true, tag: "16 Sep: copied your|main difference", color: RED, url: BRIEF[0].url },
  { name: "Profound", x: 98, y: 96, tag: "15 Sep: raised $180M", color: AMBER, url: BRIEF[2].url },
  { name: "Semrush AI Visibility Toolkit", x: 120, y: 40 },
  { name: "Otterly.AI", x: 330, y: 214 },
  { name: "Scrunch AI", x: 74, y: 220 },
  { name: "Ahrefs Brand Radar", x: 214, y: 282 },
];

function CompetitorMap() {
  const { ref, step } = usePlay(200);
  const reduce = useReducedMotion();
  const sources = Array.from(new Map(PROFILE.competitors.map((c) => [c.foundAt, c.url])).entries());
  return (
    <div ref={ref} className="overflow-hidden rounded-xl border bg-[#07090A]" style={{ borderColor: LINE }}>
      <div className="flex flex-col gap-0.5 border-b px-4 py-2.5 font-mono text-[12px] sm:flex-row sm:items-center sm:justify-between sm:gap-3" style={{ borderColor: LINE, color: MUTE }}>
        <span className="whitespace-nowrap">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: RED }} />
          pokpok.ai and its rivals
        </span>
        <span className="shrink-0">15 Sep to 31 Oct 2026</span>
      </div>
      <svg
        viewBox="0 0 400 320"
        className="block h-auto w-full"
        role="img"
        aria-label="Map of pokpok.ai's six competitors. Peec AI is flashing red: on 16 Sep it copied pokpok's main difference."
      >
        <defs>
          <radialGradient id="nb-sweep-fill" cx="200" cy="160" r="160" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#3DD68C" stopOpacity="0.22" />
            <stop offset="1" stopColor="#3DD68C" stopOpacity="0" />
          </radialGradient>
          <pattern id="nb-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#11171A" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="320" fill="url(#nb-grid)" />
        {[48, 96, 144].map((r) => (
          <circle key={r} cx="200" cy="160" r={r} fill="none" stroke={LINE} strokeWidth="1" />
        ))}
        <line x1="200" y1="0" x2="200" y2="320" stroke={LINE} />
        <line x1="0" y1="160" x2="400" y2="160" stroke={LINE} />
        {!reduce && (
          <g className="nb-sweep" style={{ transformOrigin: "200px 160px" }}>
            <path d="M200 160 L200 0 A160 160 0 0 1 338 80 Z" fill="url(#nb-sweep-fill)" />
          </g>
        )}
        <circle cx="200" cy="160" r="7" fill="#FFFFFF" />
        <circle cx="200" cy="160" r="13" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" />
        <text x="200" y="186" textAnchor="middle" className="font-mono" stroke="#07090A" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" fontSize="12" fill="#FFFFFF">
          pokpok.ai (you)
        </text>
        <motion.line
          x1="200"
          y1="160"
          x2={RIVALS[0].x}
          y2={RIVALS[0].y}
          stroke={RED}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          initial={false}
          animate={{ opacity: step >= 3 ? 1 : 0 }}
        />
        {RIVALS.map((r, i) => {
          const hot = i < 2;
          const on = hot && step >= (i === 0 ? 3 : 4);
          const shown = step >= 2;
          return (
            <motion.g key={r.name} initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: 0.3, delay: shown ? i * 0.08 : 0 }}>
              <title>{r.name}</title>
              {on && !reduce && (
                <circle cx={r.x} cy={r.y} r="6" fill="none" stroke={r.color} strokeWidth="2" className="nb-ping" style={{ transformOrigin: `${r.x}px ${r.y}px` }} />
              )}
              <circle cx={r.x} cy={r.y} r={on ? 6 : 4} fill={on ? r.color : "#5B666C"} />
              {on && (
                <path
                  d={`M${r.x - 14} ${r.y - 8}v-6h6 M${r.x + 8} ${r.y - 14}h6v6 M${r.x + 14} ${r.y + 8}v6h-6 M${r.x - 8} ${r.y + 14}h-6v-6`}
                  fill="none"
                  stroke={r.color}
                  strokeWidth="1.5"
                />
              )}
              <text x={r.x} y={r.above && on ? r.y - 24 : r.y + (on ? 30 : 18)} textAnchor="middle" className="font-mono" stroke="#07090A" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" fontSize="12" fill={on ? r.color : "#A9B1B5"}>
                {r.name}
              </text>
              {on && r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer">
                <text x={r.x} y={r.above ? r.y - 64 : r.y + 45} textAnchor="middle" className="font-mono" stroke="#07090A" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round" fontSize="10.5" fill={r.color}>
                  {r.tag.split("|").map((line, k) => (
                    <tspan key={k} x={r.x} dy={k ? 13 : 0}>
                      {line}
                    </tspan>
                  ))}
                </text>
                </a>
              )}
            </motion.g>
          );
        })}
      </svg>
      <div className="grid grid-cols-3 border-t font-mono" style={{ borderColor: LINE }}>
        {[
          { n: 12, t: "rival moves read" },
          { n: 3, t: "matter to you" },
          { n: 2, t: "need your move", c: RED },
        ].map((x, i) => (
          <div key={x.t} className={`px-3 py-3 md:px-4 ${i ? "border-l" : ""}`} style={{ borderColor: LINE }}>
            <p className="text-[26px] font-medium leading-none tracking-[-0.02em] md:text-[30px]" style={{ color: x.c ?? "#FFFFFF" }}>
              <Count from={0} to={x.n} />
            </p>
            <p className="mt-1.5 text-[13px] leading-tight text-[#C9CFD2]">
              {x.t}
            </p>
          </div>
        ))}
      </div>
      <p className="border-t px-4 py-2.5 font-mono text-[11.5px] leading-[1.6]" style={{ borderColor: LINE, color: MUTE }}>
        Each rival was found by a live web search, on these public lists of AI visibility tools:{" "}
        {sources.map(([host, url], i) => (
          <span key={host}>
            <Ext href={url}>{host}</Ext>
            {i < sources.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <Wrap className="grid grid-cols-1 gap-6 pb-12 pt-6 md:pb-20 md:pt-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-6">
        <div className="flex min-w-0 flex-col items-start gap-4 lg:gap-6">
          <p className="text-[16px] leading-[1.5] md:text-[18px]" style={{ color: MUTE }}>
            You run an AI startup. Small team, one product, a homepage that says why you.
          </p>
          <h1 className="text-[30px] font-semibold leading-[1.04] tracking-[-0.045em] text-white [text-wrap:balance] md:text-[58px]">
            Stop reading the news, competitors' blogs, and other founders' self-promoting B.S. posts on LinkedIn.
          </h1>
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-2">
          <CompetitorMap />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-6 lg:col-start-1 lg:row-start-2">
          <p className="max-w-[40ch] text-[19px] leading-[1.45] text-[#D9DDDF] md:text-[22px]">
            Nubble tells you what the news means for your company, shows you the proof, and gives you something you can send.
          </p>
          <div className="flex w-full flex-col gap-3">
            <EmailForm id="site-top" button="Send me the intel" dark preview={false} copy={INTEL} />
            <p className="text-[14px]" style={{ color: MUTE }}>
              Free while we build. Today the reader at nubble.me is live. Slack, Telegram and Claude are being built.
            </p>
          </div>
        </div>
      </Wrap>
    </section>
  );
}

/* ─── The desk: top secret folders ─── */

function OpenFolder() {
  const { ref, step } = usePlay(250);
  const s = BRIEF[0];
  return (
    <div ref={ref} className="relative min-w-0">
      <div className="flex flex-col gap-1.5 pb-2">
        {[BRIEF[2], BRIEF[1]].map((f) => (
          <div
            key={f.url}
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
      </div>
      <div className="relative overflow-hidden rounded-md border" style={{ borderColor: "#5C4C2E", background: "#1C170F" }}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3" style={{ borderColor: "#3A3326" }}>
          <span className="font-mono text-[12px]" style={{ color: "#BFB59F" }}>
            For pokpok.ai only. {s.date}
          </span>
          <span className="flex items-center gap-2">
            <Stamp color="#E6E1D6">Top secret</Stamp>
            <motion.span {...fade(step >= 1)} className="inline-block" style={{ rotate: -4 }}>
              <Stamp color={RED}>Code red</Stamp>
            </motion.span>
          </span>
        </div>
        <div className="relative flex flex-col gap-4 px-5 py-5 md:px-6 md:py-6">
          <motion.div {...fade(step >= 1)}>
            <p className="font-mono text-[12px]" style={{ color: "#BFB59F" }}>
              Your main difference
            </p>
            <p className="mt-1 text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] text-white md:text-[28px]">Brand Perception Truth</p>
          </motion.div>
          <motion.div {...fade(step >= 2)} className="rounded-md border-2 px-4 py-3" style={{ borderColor: RED, background: "#260D0E" }}>
            <p className="font-mono text-[12px]" style={{ color: RED }}>
              Peec AI, {s.date}
            </p>
            <p className="mt-1 text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[28px]" style={{ color: RED }}>
              Introducing brand perception
            </p>
          </motion.div>
          <motion.div {...fade(step >= 3)} className="border-t pt-4" style={{ borderColor: "#3A3326" }}>
            <p className="font-mono text-[12px]" style={{ color: AMBER }}>
              So what
            </p>
            <p className="mt-1 text-[20px] font-semibold leading-[1.3] text-white">{s.soWhat}</p>
            <p className="mt-4 font-mono text-[12px]" style={{ color: AMBER }}>
              Your move
            </p>
            <p className="mt-1 text-[16px] leading-[1.5] text-[#E6E1D6]">{s.move}</p>
            <p className="mt-4 text-[13px]" style={{ color: "#A39A86" }}>
              Proof: “{s.quote}” <Ext href={s.url}>{s.source}</Ext>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Desk() {
  const p = PAINS[3];
  return (
    <section className="border-t" style={{ borderColor: LINE }}>
      <Wrap className="grid grid-cols-1 gap-8 py-12 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-5">
          <h2 className="max-w-[16ch] text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white [text-wrap:balance] md:text-[52px]">{p.head}</h2>
          <p className="text-[17px] leading-[1.6] md:text-[19px]" style={{ color: "#A9B1B5" }}>
            {p.body}
          </p>
          <p className="text-[17px] font-medium text-white md:text-[19px]">We built it because we are that founder. POKPOK is our company. Everything below happened to us.</p>
        </div>
        <OpenFolder />
      </Wrap>
    </section>
  );
}

/* ─── What you hand the investor ─── */

function InvestorFile() {
  const qs = PAINS.slice(0, 3).map((p) => p.head.replace("An investor asks: ", ""));
  return (
    <section className="border-t" style={{ borderColor: LINE }}>
      <Wrap className="flex flex-col gap-4 pb-8 pt-12 md:pb-10 md:pt-20">
        <p className="max-w-[30ch] text-[28px] font-semibold leading-[1.12] tracking-[-0.035em] text-white [text-wrap:balance] md:text-[44px]">
          After a few months you have something nobody else has:{" "}
          <span style={{ color: MUTE }}>the dated record of every move in your market, what each one did to you, and what you said back.</span>
        </p>
      </Wrap>
      <Wrap className="grid grid-cols-1 gap-4 pb-12 md:pb-20 lg:grid-cols-3 lg:gap-5">
        {INVESTOR_ANSWERS.map((a, i) => {
          const Prev = INVESTOR_PREVIEWS[i];
          return (
            <article key={a.who} className="flex min-w-0 flex-col gap-4 rounded-xl border bg-[#0B0E0F] p-5 md:p-6" style={{ borderColor: LINE }}>
              <h3 className="text-[21px] font-semibold leading-[1.15] tracking-[-0.03em] text-white [text-wrap:balance] md:text-[23px]">
                <span className="mb-1 block font-mono text-[12px] font-normal tracking-normal" style={{ color: AMBER }}>
                  An investor asks
                </span>
                {qs[i].charAt(0).toUpperCase() + qs[i].slice(1)}
              </h3>
              <Big scale={1.15}>
                <Prev />
              </Big>
              <p className="text-[16px] leading-[1.5] text-[#D9DDDF]">{a.what}</p>
            </article>
          );
        })}
      </Wrap>
    </section>
  );
}

/* ─── The product: one story, three sizes ─── */

function SoWhat() {
  return (
    <section className="border-t" style={{ borderColor: LINE }}>
      <Wrap className="grid grid-cols-1 gap-8 py-12 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="max-w-[16ch] text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white [text-wrap:balance] md:text-[52px]">
            Nubble watches your market for one company:{" "}
            <span className="underline decoration-[5px] underline-offset-[8px]" style={{ textDecorationColor: AMBER }}>
              yours.
            </span>
          </h2>
          <a href="/" className="self-start text-[15px] font-medium text-white underline decoration-[#5A5A5A] underline-offset-4 hover:decoration-white">
            The reader at nubble.me is live. Swipe it yourself.
          </a>
        </div>
        <SizesBig />
      </Wrap>
    </section>
  );
}

function Close() {
  return (
    <section className="border-t" style={{ borderColor: LINE }}>
      <Wrap className="grid grid-cols-1 items-end gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-4">
          <Stamp color={AMBER} className="self-start">
            For your company only
          </Stamp>
          <h2 className="max-w-[14ch] text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-white [text-wrap:balance] md:text-[68px]">
            Paste your site. Get your first intel folder.
          </h2>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-[17px] leading-[1.55] text-[#D9DDDF]">
            Nubble finds your competitors and the big players. You correct. You never fill in a form.
          </p>
          <EmailForm id="site-bottom" button="Send me the intel" dark preview={false} copy={INTEL} />
          <ul className="flex flex-wrap gap-2 pt-1">
            {PLACES.map((p) => (
              <li
                key={p.name}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] font-medium"
                style={p.live ? { borderColor: "#1F4D33", background: "#0E2419", color: "#5BE39C" } : { borderColor: LINE, color: "#D9DDDF" }}
              >
                {p.live && <span className="h-2 w-2 rounded-full bg-[#3DD68C]" />}
                {p.name}
                <span style={p.live ? undefined : { color: MUTE }}>{p.live ? "Live" : "Coming"}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px]" style={{ color: MUTE }}>
            Free while we build. Or write to <span className="select-all font-mono text-[#EDEDED]">{CONTACT}</span>
          </p>
        </div>
      </Wrap>
    </section>
  );
}

export default function FoundersLandingV3() {
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
      className="founders fixed inset-0 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#050607] text-[#E8EAEA] antialiased [-webkit-overflow-scrolling:touch]"
      style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif", colorScheme: "dark" }}
    >
      <style>{`
        .founders .font-mono{font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
        .founders .text-fg{color:#171717} .founders .text-mute{color:#666666}
        .founders .nb-badge{font-size:12px}
        .founders .nb-badge[data-label="weakened"]{background:#FFEFE3;color:#BD4B00}
        .founders .nb-badge[data-label="weakened"][data-dark]{background:#3A1C0A;color:#FF8B3E}
        @keyframes nb-sweep{to{transform:rotate(360deg)}}
        .founders .nb-sweep{animation:nb-sweep 6s linear infinite}
        @keyframes nb-ping{0%{transform:scale(1);opacity:.9}100%{transform:scale(3.2);opacity:0}}
        .founders .nb-ping{animation:nb-ping 1.6s ease-out infinite}
        @media (prefers-reduced-motion: reduce){.founders .nb-sweep,.founders .nb-ping{animation:none}}
      `}</style>
      <header className="sticky top-0 z-20 border-b bg-[#050607]/95 backdrop-blur" style={{ borderColor: LINE }}>
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 md:px-12">
          <a href="/" className="flex items-center gap-2 text-[18px] font-semibold tracking-[-0.03em] text-white">
            nubble
            <span className="rounded-full border px-2 py-0.5 font-mono text-[11px] font-normal tracking-normal" style={{ borderColor: LINE, color: MUTE }}>
              for founders
            </span>
          </a>
          <a
            href="#site-top"
            onClick={toTop}
            className={`inline-flex h-9 items-center rounded-md bg-white px-3 text-[14px] font-medium text-black transition-opacity duration-300 hover:bg-[#E6E6E6] sm:px-4 ${
              formOnScreen ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            aria-hidden={formOnScreen}
            tabIndex={formOnScreen ? -1 : 0}
          >
            Send me the intel
          </a>
        </div>
      </header>
      <main>
        <Hero />
        <Desk />
        <InvestorFile />
        <SoWhat />
        <Close />
      </main>
      <footer className="mx-auto max-w-[1200px] border-t px-5 py-8 md:px-12" style={{ borderColor: LINE }}>
        <p className="font-mono text-[12px]" style={{ color: MUTE }}>
          nubble.me, made by POKPOK. <span className="select-all">{CONTACT}</span>
        </p>
      </footer>
    </div>
  );
}
