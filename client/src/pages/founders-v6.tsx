import { lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import FoundersLandingV3, { AMBER, LINE, MUTE, RED, Wrap } from "./founders-v3";
import { Heatmap, labelOf as baseLabel } from "./founders-fx";
import { FormNote, IntelFolder, Plans, Sendables } from "./founders-v5-parts";
import { BRIEF, PROFILE, RUN, RUN_MORE, type RunItem } from "./founders-data";
import { buildMoves, dateOf, FX_RIVALS, MovesCtx, rivalOf, WEEKS, weekOf, type FxRival } from "./founders-fx-data";
import { Ext } from "./founders";

const MOVES = buildMoves([...RUN, ...RUN_MORE].sort((a, b) => dateOf(a).getTime() - dateOf(b).getTime()));
const PressureGauge = lazy(() => import("./founders-gauge").then((m) => ({ default: m.PressureGauge })));

/*
 * /founders-v6: v5 rebuilt as a Ferrari Luce style cockpit (owner's reference images, 1 Nov 2026).
 * The top of the page is one instrument panel: status strip with outlined tags and light numbers,
 * two traces with a red "now" line, a live clock, a yellow stopwatch counting the days since Peec took
 * pokpok's main term, a top-down diagram of the rivals with green leader labels, a depth slider
 * (So what, Summary, Original), silver toggle switches for sources, and round glass buttons for the outputs.
 */

const GREEN = "#86D9A9";
const YELLOW = "#E9D27A";
const ORANGE = "#FF8B3E";
const PANEL = "#050505";
const COPIED = new Date(Date.UTC(2026, 8, 16)); // Peec: "Introducing brand perception", 16 Sep 2026

/* ─── sources, from the address of each move ─── */

type Src = "Blogs" | "Press" | "X" | "Changelogs";
const SRCS: Src[] = ["Blogs", "Press", "X", "Changelogs"];
const SRC_ONE: Record<Src, string> = { Blogs: "Blog", Press: "Press", X: "X", Changelogs: "Changelog" };
function srcOf(m: RunItem): Src {
  if (/(^|\/\/)(www\.)?x\.com\//.test(m.url)) return "X";
  if (m.url.includes("changelog")) return "Changelogs";
  if (/globenewswire|newsroom|martech\.org|tryprofound\.com\/events/.test(m.url)) return "Press";
  return "Blogs";
}

/* ─── what each kept move means for pokpok.ai ─── */

const SO_WHAT: Record<string, string> = {
  [BRIEF[0].url]: "A rival now sells your main term: brand perception.",
  [BRIEF[1].url]: BRIEF[1].soWhat,
  [BRIEF[2].url]: BRIEF[2].soWhat,
  "https://otterly.ai/blog/brand-profiling/": "Otterly now shows how AI describes a brand, like Peec. Lead with what they both skip: what people think.",
};

const FOUND_AT = Array.from(new Map(PROFILE.competitors.map((c) => [c.foundAt, c.url])).entries());

/** v6 says "took your term": only the term is shared, nobody proved a copy. */
function labelOf(m: RunItem) {
  return m.kept === "code-red" ? { t: "took your term", c: RED } : baseLabel(m);
}

const POINTS = { "code-red": 40, weakened: 20, "worth-knowing": 5 } as const;
function pressureOf(run: RunItem[]) {
  const w = WEEKS.map(() => 0);
  run.forEach((m) => {
    if (m.kept) w[weekOf(m)] += POINTS[m.kept];
  });
  return w.map((v) => Math.min(100, v));
}

function useNow(ms = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-block self-start whitespace-nowrap rounded-[3px] border px-1.5 py-[1px] font-mono text-[12px] leading-[1.5] tracking-[0.06em]" style={{ color, borderColor: color }}>
      {children}
    </span>
  );
}

/* ─── the two traces, with the red line at "now" ─── */

function Trace({ values, max, color, unit }: { values: number[]; max: number; color: string; unit: string }) {
  const W = 240;
  const H = 56;
  const pts = values.map((v, i) => [8 + (i * (W - 24)) / (values.length - 1), H - 6 - (v / Math.max(1, max)) * (H - 14)]);
  const d = pts.map(([x, y], i) => (i ? `L${x.toFixed(1)},${y.toFixed(1)}` : `M${x.toFixed(1)},${y.toFixed(1)}`)).join(" ");
  const nowX = pts[pts.length - 1][0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#1A1C1E" strokeWidth="1" />
      ))}
      <motion.path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeOut" }} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3 : 1.6} fill={color} />
      ))}
      <line x1={nowX} x2={nowX} y1="0" y2={H} stroke={RED} strokeWidth="1.5" />
      <text x="2" y="9" textAnchor="start" fill={MUTE} fontSize="9" fontFamily="var(--font-mono)">
        {unit}
      </text>
    </svg>
  );
}

/* ─── the yellow stopwatch: days since Peec took the term ─── */

function Stopwatch({ now }: { now: Date | null }) {
  const reduce = useReducedMotion();
  const t = now ? now.getTime() - COPIED.getTime() : 0;
  const days = t / 86400000;
  const hand = ((days % 60) / 60) * 360;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!now) return;
    if (reduce) return setShown(hand);
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 1600);
      setShown(hand * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now === null, reduce]);
  const sec = now ? (now.getSeconds() / 60) * 360 : 0;
  const hr = now ? (((now.getHours() % 12) + now.getMinutes() / 60) / 12) * 360 : 0;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg viewBox="-110 -110 220 220" className="block h-auto w-full" role="img" aria-label={`${Math.floor(days)} days since Peec took your main term`}>
      <defs>
        <radialGradient id="sw-bezel" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#3A3C3F" />
          <stop offset="0.6" stopColor="#141516" />
          <stop offset="1" stopColor="#050505" />
        </radialGradient>
        <radialGradient id="sw-face" cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="#F2E3A0" />
          <stop offset="1" stopColor="#D8C26A" />
        </radialGradient>
        <linearGradient id="sw-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.06" />
        </linearGradient>
        <clipPath id="sw-clip">
          <circle r="88" />
        </clipPath>
      </defs>
      <circle r="108" fill="url(#sw-bezel)" />
      <circle r="96" fill="#0A0A0A" stroke="#4A4C50" strokeWidth="1.2" />
      <circle r="88" fill="url(#sw-face)" />
      {ticks.map((i) => {
        const a = (i / 60) * Math.PI * 2;
        const long = i % 5 === 0;
        const r1 = long ? 76 : 81;
        return <line key={i} x1={Math.sin(a) * r1} y1={-Math.cos(a) * r1} x2={Math.sin(a) * 86} y2={-Math.cos(a) * 86} stroke="#1A1A1A" strokeWidth={long ? 1.6 : 0.8} />;
      })}
      {ticks
        .filter((i) => i % 5 === 0)
        .map((i) => {
          const a = (i / 60) * Math.PI * 2;
          if (i === 15 || i === 45) return null;
          return (
            <text key={i} x={Math.sin(a) * 63} y={-Math.cos(a) * 63 + 6} textAnchor="middle" fontSize="16" fontWeight="600" fill="#151515" fontFamily="var(--font-sans)">
              {i === 0 ? "60" : String(i).padStart(2, "0")}
            </text>
          );
        })}
      <rect x="-80" y="-24" width="160" height="48" rx="24" fill="#0B0B0B" />
      {[
        { cx: -46, deg: hr, label: "12" },
        { cx: 46, deg: sec, label: "60" },
      ].map((s) => (
        <g key={s.cx} transform={`translate(${s.cx} 0)`}>
          <circle r="20" fill="none" stroke="#3A3A3A" strokeWidth="0.8" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="0" y1="-18" x2="0" y2="-15" stroke="#9A9A9A" strokeWidth="0.8" transform={`rotate(${i * 30})`} />
          ))}
          <text y="-6" textAnchor="middle" fontSize="7" fill="#C9C9C9" fontFamily="var(--font-sans)">
            {s.label}
          </text>
          <line x1="0" y1="2" x2="0" y2="-15" stroke={RED} strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${s.deg})`} style={{ transition: reduce ? "none" : "transform .3s" }} />
          <circle r="2" fill={RED} />
        </g>
      ))}
      <g transform={`rotate(${shown})`}>
        <path d="M-2.4,14 L-1.6,-82 L1.6,-82 L2.4,14 Z" fill="#D21F26" />
        <rect x="-0.6" y="-80" width="1.2" height="60" fill="#FF8A8A" opacity="0.6" />
      </g>
      <circle r="8" fill="#9A9DA1" />
      <circle r="5" fill="#D21F26" />
      <g clipPath="url(#sw-clip)">
        <polygon points="-120,-40 60,-130 140,-130 -120,60" fill="url(#sw-glass)" />
      </g>
    </svg>
  );
}

/* ─── the rival diagram: you in the middle, rivals around, green leader labels ─── */

const NAME_LINES: Record<FxRival, string[]> = {
  "Peec AI": ["PEEC AI"],
  Profound: ["PROFOUND"],
  Semrush: ["SEMRUSH"],
  "Otterly.AI": ["OTTERLY.AI"],
  "Scrunch AI": ["SCRUNCH AI"],
  "Ahrefs Brand Radar": ["AHREFS", "BRAND RADAR"],
};

function Diagram({ byRival, sel, onSel }: { byRival: Record<FxRival, RunItem[]>; sel: FxRival; onSel: (r: FxRival) => void }) {
  const reduce = useReducedMotion();
  const cols = [70, 180, 290];
  const spots = FX_RIVALS.map((r, i) => ({ r, x: cols[i % 3], top: i < 3 }));
  const pY = 112;
  const pH = 76;
  return (
    <svg viewBox="0 0 360 300" className="mx-auto block h-auto w-full max-w-[470px] select-none" role="group" aria-label="pokpok.ai and its six rivals">
      <defs>
        <pattern id="cells" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="9" height="9" x="0.5" y="0.5" rx="1" fill="#2A2C2F" />
        </pattern>
        <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3D41" />
          <stop offset="1" stopColor="#1C1E20" />
        </linearGradient>
      </defs>
      {/* chassis */}
      <rect x="40" y={pY - 10} width="280" height={pH + 20} rx="10" fill="#0E0F10" stroke="#1E2023" />
      <rect x="110" y={pY} width="140" height={pH} rx="14" fill="url(#plate)" stroke="#55595E" />
      <rect x="118" y={pY + 8} width="124" height={pH - 16} rx="8" fill="url(#cells)" opacity="0.9" />
      <rect x="124" y={pY + pH / 2 - 19} width="112" height="38" rx="4" fill="#050505" opacity="0.85" />
      <text x="180" y={pY + pH / 2 - 4} textAnchor="middle" fontSize="15" fontFamily="var(--font-mono)" fill={GREEN} letterSpacing="0.06em">
        YOU
      </text>
      <text x="180" y={pY + pH / 2 + 14} textAnchor="middle" fontSize="15" fontFamily="var(--font-mono)" fill="#E8EAEA">
        pokpok.ai
      </text>
      {spots.map(({ r, x, top }) => {
        const n = byRival[r].length;
        const red = byRival[r].some((m) => m.kept === "code-red");
        const weak = !red && byRival[r].some((m) => m.kept === "weakened");
        const on = sel === r;
        const c = on ? "#FFFFFF" : red ? RED : weak ? ORANGE : GREEN;
        const blockY = top ? 64 : 212;
        const w = 30 + Math.min(n, 8) * 4;
        const lines = NAME_LINES[r];
        const labelY = top ? 16 : 248;
        const plateEdge = top ? pY : pY + pH;
        const lineFrom = top ? blockY + 14 : blockY;
        const plateX = Math.max(122, Math.min(238, x));
        return (
          <g key={r} role="button" tabIndex={0} aria-pressed={on} aria-label={`${r}: ${n} moves`} onClick={() => onSel(r)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSel(r))} className="cursor-pointer outline-none">
            <rect x={x - 56} y={top ? 4 : 204} width="112" height={top ? 90 : 92} fill="transparent" />
            {red ? (
              <motion.path
                d={`M${x},${lineFrom} L${x},${(lineFrom + plateEdge) / 2} L${plateX},${(lineFrom + plateEdge) / 2} L${plateX},${plateEdge}`}
                fill="none"
                stroke={RED}
                strokeWidth="1.6"
                strokeDasharray="4 4"
                animate={reduce ? {} : { strokeDashoffset: [0, -16] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <path d={`M${x},${lineFrom} L${x},${(lineFrom + plateEdge) / 2} L${plateX},${(lineFrom + plateEdge) / 2} L${plateX},${plateEdge}`} fill="none" stroke={on ? "#9AA0A6" : "#3A3E43"} strokeWidth="1" />
            )}
            <rect x={x - w / 2} y={blockY} width={w} height="14" rx="3" fill={n ? "#B9BDC2" : "#2E3135"} stroke={on ? "#FFFFFF" : "transparent"} strokeWidth="1.5" />
            <rect x={x - w / 2 + 3} y={blockY + 3} width={w - 6} height="3" rx="1.5" fill="#FFFFFF" opacity={n ? 0.55 : 0.1} />
            {[...lines, n ? `${n} move${n > 1 ? "s" : ""}` : "quiet", ...(red ? ["took your term"] : weak ? ["weakened"] : [])].map((l, i) => (
              <text
                key={l + i}
                x={x}
                y={labelY + i * 16}
                textAnchor="middle"
                fontSize={i < lines.length ? 15 : 14}
                fontWeight={i < lines.length ? (on ? 700 : 500) : 400}
                fontFamily="var(--font-mono)"
                fill={i < lines.length ? c : i === lines.length ? (on ? "#FFFFFF" : "#C9CFD2") : red ? RED : ORANGE}
                letterSpacing={i < lines.length ? "0.04em" : "0"}
              >
                {l}
              </text>
            ))}
            {on && <rect x={x - 67} y={top ? 1 : 232} width="134" height={top ? 56 : 66} rx="4" fill="none" stroke="#FFFFFF" strokeOpacity="0.5" />}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── silver toggle switch (the Luce lever) ─── */

function Toggle({ on, label, count, onClick }: { on: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className="group flex min-h-[44px] min-w-0 flex-col items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
      <span className="font-mono text-[12px] leading-none" style={{ color: on ? "#F2F2F2" : "#5E6368" }}>
        {label}
      </span>
      <span className="relative block h-[52px] w-[34px] rounded-full" style={{ background: "linear-gradient(180deg,#000 0%,#1B1C1E 50%,#000 100%)", boxShadow: "inset 0 0 0 1px #2A2C2F, inset 0 6px 10px #000" }}>
        <span
          className="absolute left-1/2 block h-[13px] w-[44px] -translate-x-1/2 rounded-[6px] transition-all duration-300"
          style={{
            top: on ? 8 : 31,
            background: "linear-gradient(180deg,#FFFFFF 0%,#C9CCD0 35%,#7E8287 70%,#D9DCDF 100%)",
            boxShadow: "0 4px 6px rgba(0,0,0,.8), inset 0 -1px 0 rgba(0,0,0,.35)",
          }}
        />
      </span>
      <span className="font-mono text-[13px] leading-none" style={{ color: on ? GREEN : "#4A4F54" }}>
        {count}
      </span>
    </button>
  );
}

/* ─── round glass button (the Luce shortcuts) ─── */

function Glass({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} className="flex min-w-0 flex-col items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
      <span
        className="relative grid h-[64px] w-[64px] place-items-center overflow-hidden rounded-full transition-transform active:scale-95"
        style={{ background: "radial-gradient(circle at 50% 60%, #121314 0%, #050505 70%)", boxShadow: "0 0 0 1px #2C2E31, 0 8px 18px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.08)" }}
      >
        <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(150deg, transparent 0 52%, rgba(255,255,255,.13) 52% 100%)" }} />
        {children}
      </span>
      <span className="text-center font-mono text-[12px] leading-tight text-[#C9CFD2]">{label}</span>
    </a>
  );
}

/* ─── the depth slider (Luce SYNC): So what, Summary, Original ─── */

const DEPTHS = [
  { k: "full", t: "Original" },
  { k: "short", t: "Summary" },
  { k: "sowhat", t: "So what" },
] as const;
type Depth = (typeof DEPTHS)[number]["k"];

function DepthSlider({ depth, onDepth }: { depth: Depth; onDepth: (d: Depth) => void }) {
  const i = DEPTHS.findIndex((d) => d.k === depth);
  return (
    <div className="flex items-stretch gap-3" role="radiogroup" aria-label="How deep to read">
      <div className="relative w-[46px] rounded-full bg-[#1E1F21]" style={{ boxShadow: "inset 0 2px 6px #000" }}>
        <motion.span
          className="absolute left-1/2 grid h-[38px] w-[38px] -translate-x-1/2 place-items-center rounded-full font-mono text-[12px] font-semibold text-white"
          style={{ background: "radial-gradient(circle at 40% 35%, #C8243F, #8E0F26)", boxShadow: "0 0 0 2px #5A0A18, 0 6px 12px rgba(0,0,0,.7)" }}
          animate={{ top: `calc(${(i / 2) * 100}% - ${(i / 2) * 38}px + ${4 - i * 4}px)` }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
        </motion.span>
      </div>
      <div className="flex flex-col justify-between py-0.5">
        {DEPTHS.map((d, j) => (
          <button
            key={d.k}
            type="button"
            role="radio"
            aria-checked={depth === d.k}
            onClick={() => onDepth(d.k)}
            className="flex min-h-[44px] items-center gap-2 text-left font-mono text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            style={{ color: depth === d.k ? "#FFFFFF" : "#6E747A" }}
          >
            <span className="inline-block h-px w-3" style={{ background: depth === d.k ? RED : "#3A3E43" }} />
            {depth === d.k && <span style={{ color: RED }}>◂</span>}
            {d.t}
            <span className="sr-only">{j === 0 ? ", the most" : j === 2 ? ", the least" : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Reading({ items, depth, rival }: { items: RunItem[]; depth: Depth; rival: FxRival }) {
  if (!items.length) return <p className="text-[15px] leading-[1.5]" style={{ color: MUTE }}>Nothing from {rival} in this window or these sources.</p>;
  if (depth === "sowhat") {
    const kept = items.filter((m) => SO_WHAT[m.url]);
    if (!kept.length)
      return (
        <p className="text-[17px] leading-[1.45] text-white">
          {items.length} move{items.length > 1 ? "s" : ""} read. None of {items.length > 1 ? "them changes" : "it changes"} your plan. No change needed.
        </p>
      );
    return (
      <ul className="flex flex-col gap-4">
        {kept.map((m) => {
          const l = labelOf(m);
          return (
            <li key={m.url} className="flex flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2 font-mono text-[12px]" style={{ color: MUTE }}>
                {m.date}
                {l && <Tag color={l.c}>{l.t}</Tag>}
              </span>
              <p className="text-[18px] font-medium leading-[1.35] text-white md:text-[19px]">{SO_WHAT[m.url]}</p>
            </li>
          );
        })}
        {items.length > kept.length && (
          <li className="font-mono text-[12px]" style={{ color: MUTE }}>
            {items.length - kept.length} more read. Not about you.
          </li>
        )}
      </ul>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((m) => {
        const l = labelOf(m);
        return (
          <li key={m.url + m.title} className="grid grid-cols-[50px_minmax(0,1fr)] gap-2 text-[15px] leading-[1.4]">
            <span className="font-mono text-[12px] leading-[1.7]" style={{ color: MUTE }}>
              {m.date}
            </span>
            <span className="min-w-0">
              {depth === "short" ? (
                <span className="text-[#E8EAEA]">{m.title}</span>
              ) : (
                <Ext href={m.url} className="inline-block py-0.5 text-[#E8EAEA]">
                  {m.title}
                </Ext>
              )}
              {l && (
                <span className="ml-2 font-mono text-[12px]" style={{ color: l.c }}>
                  {l.t}
                </span>
              )}
              {depth === "full" && (
                <span className="block font-mono text-[12px]" style={{ color: MUTE }}>
                  {SRC_ONE[srcOf(m)]} · {hostOf(m.url)}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ─── the cockpit ─── */

function Cockpit() {
  const moves = useContext(MovesCtx);
  const now = useNow();
  const [srcOn, setSrcOn] = useState<Record<Src, boolean>>({ Blogs: true, Press: true, X: true, Changelogs: true });
  const [lastWeek, setLastWeek] = useState(false);
  const [sel, setSel] = useState<FxRival>("Peec AI");
  const readRef = useRef<HTMLDivElement>(null);
  const pick = (r: FxRival) => {
    setSel(r);
    if (window.innerWidth < 1024) window.setTimeout(() => readRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  };
  const [depth, setDepth] = useState<Depth>("sowhat");

  const inWindow = useMemo(() => moves.run.filter((m) => !lastWeek || weekOf(m) === WEEKS.length - 1), [moves.run, lastWeek]);
  const shown = useMemo(() => inWindow.filter((m) => srcOn[srcOf(m)]), [inWindow, srcOn]);
  const view = useMemo(() => buildMoves(shown), [shown]);
  const perWeek = useMemo(() => WEEKS.map((_, i) => moves.run.filter((m) => weekOf(m) === i && srcOn[srcOf(m)]).length), [moves.run, srcOn]);
  const pressure = useMemo(() => pressureOf(moves.run.filter((m) => srcOn[srcOf(m)])), [moves.run, srcOn]);

  const since = now ? now.getTime() - COPIED.getTime() : 0;
  const d = Math.floor(since / 86400000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--";
  const date = now ? now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase().replace(",", "") : "";

  return (
    <div className="rounded-[30px] p-[7px] md:rounded-[48px] md:p-[10px]" style={{ background: "linear-gradient(180deg,#2A2B2E,#141517 40%,#0B0B0C)", boxShadow: "0 30px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)" }}>
      <div className="relative overflow-hidden rounded-[24px] px-4 pb-6 pt-5 md:rounded-[40px] md:px-10 md:pb-9 md:pt-8" style={{ background: PANEL, boxShadow: "inset 0 0 0 1px #17181A" }}>
        {/* status strip */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,2fr)_minmax(0,2.4fr)] lg:items-center lg:gap-x-8">
          <div className="col-span-2 grid grid-cols-2 gap-4 lg:col-span-1 lg:grid-cols-1 lg:gap-3">
            <div className="flex flex-col gap-1">
              <Tag color={GREEN}>READ: 6 RIVALS</Tag>
              <p className="text-[30px] font-light leading-none tracking-[-0.02em] text-white md:text-[40px]">
                {view.read}
                <span className="ml-1.5 text-[16px] md:text-[20px]">moves</span>
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Tag color={YELLOW}>MATTER TO YOU: {view.matter}</Tag>
              <p className="text-[30px] font-light leading-none tracking-[-0.02em] text-white md:text-[40px]">
                {view.act}
                <span className="ml-1.5 text-[16px] md:text-[20px]">to act on</span>
              </p>
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1 lg:col-span-1">
            <Trace values={perWeek} max={Math.max(...perWeek, 1)} color="#E8EAEA" unit="moves a week" />
            <Trace values={pressure} max={100} color={YELLOW} unit="pressure" />
            <div className="flex justify-between font-mono text-[12px]" style={{ color: MUTE }}>
              <span>15 Sep</span>
              <span style={{ color: RED }}>now</span>
            </div>
            <p className="text-[13px] leading-[1.4]" style={{ color: "#A9B1B5" }}>
              Pressure, 0 to 100 a week: a rival taking your term adds 40, weakening a claim 20, worth knowing 5.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1 border-l pl-4 lg:pl-6" style={{ borderColor: "#26282B" }}>
            <p className="font-mono text-[18px] leading-none text-white md:text-[22px]">{time}</p>
            <p className="font-mono text-[12px] tracking-[0.04em]" style={{ color: "#8A9095" }}>
              {date}
            </p>
            <p className="mt-2 font-mono text-[22px] font-light leading-none tabular-nums md:text-[26px]" style={{ color: RED }}>
              {d} days
            </p>
            <p className="text-[12.5px] leading-[1.35]" style={{ color: "#A9B1B5" }}>
              since Peec took your main term, <Ext href={BRIEF[0].url} className="-my-[14px] inline-block py-[14px]">16 Sep</Ext>
            </p>
          </div>
          <div className="mx-auto w-full max-w-[180px] lg:max-w-[200px]">
            <Stopwatch now={now} />
          </div>
        </div>

        <div className="my-6 h-px md:my-8" style={{ background: "linear-gradient(90deg,transparent,#222428 20%,#222428 80%,transparent)" }} />

        {/* diagram and reading */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-10">
          <div className="min-w-0">
            <Diagram byRival={view.byRival} sel={sel} onSel={pick} />
            <p className="mt-1 text-center font-mono text-[12px]" style={{ color: MUTE }}>
              Tap a rival to read its moves
            </p>
            <p className="mt-2 text-center font-mono text-[12px] leading-[1.6]" style={{ color: "#6E747A" }}>
              Rivals found by a live web search, on these lists:{" "}
              {FOUND_AT.map(([host, url], i) => (
                <span key={host}>
                  <Ext href={url} className="-my-[14px] inline-block py-[14px]">{host}</Ext>
                  {i < FOUND_AT.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[13px] text-white">{sel}</p>
              <span className="font-mono text-[12px]" style={{ color: MUTE }}>
                {lastWeek ? "27 Oct to 31 Oct" : "15 Sep to 31 Oct"}
              </span>
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 md:gap-5">
              <DepthSlider depth={depth} onDepth={setDepth} />
              <div className="min-w-0 self-center">
                <p className="font-mono text-[12px]" style={{ color: depth === "sowhat" ? AMBER : MUTE }}>
                  {depth === "sowhat" ? "What it means for pokpok.ai" : depth === "short" ? "Every move, one line" : "Every move, with its source"}
                </p>
              </div>
            </div>
            <div ref={readRef} className="min-h-[120px] scroll-mb-4 rounded-2xl border p-4 md:p-5" style={{ borderColor: "#1E2023", background: "#0A0B0C" }}>
              <Reading items={view.byRival[sel]} depth={depth} rival={sel} />
            </div>
          </div>
        </div>

        <div className="my-6 h-px md:my-8" style={{ background: "linear-gradient(90deg,transparent,#222428 20%,#222428 80%,transparent)" }} />

        {/* controls: sources, window, outputs */}
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,5fr)_auto_minmax(0,5fr)] lg:gap-8">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[12px]" style={{ color: MUTE }}>
              Sources Nubble reads
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SRCS.map((s) => (
                <Toggle key={s} label={s} on={srcOn[s]} count={inWindow.filter((m) => srcOf(m) === s).length} onClick={() => setSrcOn((o) => ({ ...o, [s]: !o[s] }))} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div role="radiogroup" aria-label="Time window" className="flex rounded-full p-1" style={{ background: "#141517", boxShadow: "inset 0 0 0 1px #24262A" }}>
              {[
                { v: false, t: "7 weeks" },
                { v: true, t: "Last week" },
              ].map((o) => (
                <button
                  key={o.t}
                  type="button"
                  role="radio"
                  aria-checked={lastWeek === o.v}
                  onClick={() => setLastWeek(o.v)}
                  className="min-h-[44px] rounded-full px-4 font-mono text-[13px] transition-colors"
                  style={{ background: lastWeek === o.v ? "#2C2E32" : "transparent", color: lastWeek === o.v ? "#FFFFFF" : "#7A8085" }}
                >
                  {o.t}
                </button>
              ))}
            </div>
            <a
              href="#folder"
              className="relative flex min-h-[48px] items-center justify-center gap-2 rounded-full px-7 font-mono text-[13px] font-semibold tracking-[0.08em] text-white"
              style={{ background: "linear-gradient(180deg,#141416,#070708)", boxShadow: "0 0 0 1px #2E3034, inset 0 1px 0 rgba(255,255,255,.06)" }}
            >
              <motion.span className="inline-block h-2 w-2 rounded-full" style={{ background: RED }} animate={{ boxShadow: ["0 0 0 0 rgba(255,77,79,.7)", "0 0 0 6px rgba(255,77,79,0)"] }} transition={{ duration: 1.4, repeat: Infinity }} />
              CODE RED
            </a>
            <p className="-mt-1 text-center text-[13px]" style={{ color: "#A9B1B5" }}>
              Opens the code red folder
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[12px] lg:text-right" style={{ color: MUTE }}>
              What Nubble writes for you
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Glass href="#send" label="Investor update">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={YELLOW} strokeWidth="1.8" aria-hidden>
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              </Glass>
              <Glass href="#send" label="LinkedIn post">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" strokeWidth="2.2" aria-hidden>
                  <path d="M5 12a7 7 0 0 1 14 0" stroke="#E5383B" />
                  <path d="M19 12a7 7 0 0 1-14 0" stroke="#2F6BFF" />
                </svg>
              </Glass>
              <Glass href="#send" label="Deck slide">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#F2F2F2" strokeWidth="1.8" aria-hidden>
                  <rect x="3" y="5" width="18" height="12" rx="1.5" />
                  <path d="M12 17v3M8 20h8" />
                </svg>
              </Glass>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pressure() {
  return (
    <section className="border-t" style={{ borderColor: LINE }}>
      <Wrap className="grid grid-cols-1 items-start gap-10 py-12 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <Suspense fallback={<div className="mx-auto aspect-square w-full max-w-[380px] rounded-xl bg-[#050505]" />}>
          <PressureGauge />
        </Suspense>
        <Heatmap />
      </Wrap>
    </section>
  );
}

export default function FoundersLandingV6() {
  return (
    <MovesCtx.Provider value={MOVES}>
      <FoundersLandingV3
        mono
        fx={{
          heroWide: <Cockpit />,
          folder: (
            <div id="folder" className="scroll-mt-[76px]">
              <IntelFolder />
            </div>
          ),
          afterDesk: <Pressure />,
          investor: (
            <div id="send" className="scroll-mt-[76px]">
              <Sendables />
            </div>
          ),
          formNote: <FormNote />,
          plans: <Plans />,
          closeStamp: "Two ways in",
        }}
      />
    </MovesCtx.Provider>
  );
}
