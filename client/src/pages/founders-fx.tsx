import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Count, Ext } from "./founders";
import { AMBER, CompetitorMap, LINE, MUTE, RED } from "./founders-v3";
import { BRIEF, PROFILE, RUN, type RunItem } from "./founders-data";
import { FX_RIVALS, MOVES_BY_RIVAL, WEEKS, rivalOf, weekOf, type FxRival } from "./founders-fx-data";

/*
 * Interactive pieces for /founders-v4: the 3D war table, the x-ray hunt, and the heat map.
 * Every number and title comes from the hand-checked example run in founders-data.ts.
 */

const WarTable = lazy(() => import("./founders-war-table"));
const ORANGE = "#FF8B3E";

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class Guard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function labelOf(m: RunItem) {
  if (m.kept === "code-red") return { t: "copied you", c: RED };
  if (m.kept === "weakened") return { t: "weakened a claim", c: ORANGE };
  if (m.kept === "worth-knowing") return { t: "worth knowing", c: AMBER };
  return null;
}

function MoveList({ items }: { items: RunItem[] }) {
  if (!items.length) return <p className="text-[14px]" style={{ color: MUTE }}>Quiet. Nothing it published in these six weeks touched you.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((m) => {
        const l = labelOf(m);
        return (
          <li key={m.url + m.title} className="grid grid-cols-[52px_minmax(0,1fr)] gap-2 text-[14px] leading-[1.4]">
            <span className="font-mono text-[12px] leading-[1.6]" style={{ color: MUTE }}>
              {m.date}
            </span>
            <span className="min-w-0">
              <Ext href={m.url} className="text-[#E8EAEA]">
                {m.title}
              </Ext>
              {l && (
                <span className="ml-2 font-mono text-[12px]" style={{ color: l.c }}>
                  {l.t}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ─── 1. The war table (3D) ─── */

export function WarRoom() {
  const [gl, setGl] = useState<boolean | null>(null);
  const [sel, setSel] = useState<FxRival>("Peec AI");
  useEffect(() => setGl(hasWebGL()), []);
  const sources = Array.from(new Map(PROFILE.competitors.map((c) => [c.foundAt, c.url])).entries());
  if (gl === false) return <CompetitorMap />;
  return (
    <div className="overflow-hidden rounded-xl border bg-[#07090A]" style={{ borderColor: LINE }}>
      <div className="flex flex-col gap-0.5 border-b px-4 py-2.5 font-mono text-[12px] sm:flex-row sm:items-center sm:justify-between sm:gap-3" style={{ borderColor: LINE, color: MUTE }}>
        <span className="whitespace-nowrap">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: RED }} />
          pokpok.ai and its rivals
        </span>
        <span>15 Sep to 31 Oct 2026</span>
      </div>
      <div className="relative h-[330px] md:h-[400px]" style={{ background: "radial-gradient(ellipse at 50% 60%, #0D1A14 0%, #07090A 65%)" }}>
        {gl && (
          <Guard fallback={<CompetitorMap />}>
            <Suspense fallback={<div className="grid h-full place-items-center font-mono text-[12px]" style={{ color: MUTE }}>loading the map…</div>}>
              <WarTable selected={sel} onSelect={setSel} />
            </Suspense>
          </Guard>
        )}
        <p className="pointer-events-none absolute bottom-2 left-3 right-3 font-mono text-[11.5px] leading-snug" style={{ color: MUTE }}>
          Tower height = moves we read. Tap a tower.
        </p>
      </div>
      <div className="border-t px-4 py-3" style={{ borderColor: LINE }}>
        <AnimatePresence mode="wait">
          <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="mb-2 font-mono text-[13px] font-medium" style={{ color: sel === "Peec AI" ? RED : sel === "Profound" ? AMBER : "#E8EAEA" }}>
              {sel}: {MOVES_BY_RIVAL[sel].length} move{MOVES_BY_RIVAL[sel].length === 1 ? "" : "s"}
            </p>
            <MoveList items={MOVES_BY_RIVAL[sel]} />
          </motion.div>
        </AnimatePresence>
      </div>
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
            <p className="mt-1.5 text-[13px] leading-tight text-[#C9CFD2]">{x.t}</p>
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

/* ─── 2. The x-ray hunt ─── */

const LENS = 62;

function PostText({ xray }: { xray: boolean }) {
  const s = BRIEF[0];
  const hit = xray
    ? { color: "#FFFFFF", background: RED, boxShadow: `0 0 18px ${RED}`, borderRadius: 3, padding: "0 4px" }
    : { padding: "0 4px" };
  return (
    <div className="flex flex-col gap-3 px-5 py-5">
      <p className="font-mono text-[12px]" style={{ color: xray ? "#2F8F5C" : "#6B6B6B" }}>
        peec.ai/blog, {s.date}
      </p>
      <p className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] md:text-[30px]" style={{ color: xray ? "#3DD68C" : "#171717" }}>
        Introducing <span data-target style={hit}>brand perception</span>
      </p>
      <p className="font-mono text-[12.5px] leading-[1.5]" style={{ color: xray ? RED : "transparent" }}>
        ↑ your main difference: Brand Perception Truth
      </p>
      <p className="text-[16px] leading-[1.5]" style={{ color: xray ? "#2F8F5C" : "#3D3D3D" }}>
        “{s.quote}”
      </p>
    </div>
  );
}

export function XRayHunt() {
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { margin: "-80px" });
  const reduce = useReducedMotion();
  const [lens, setLens] = useState({ x: 70, y: 80 });
  const [touched, setTouched] = useState(false);
  const [found, setFound] = useState(false);
  const coarse = useMemo(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches, []);

  // Idle sweep so the lens is visible before anyone touches it.
  useEffect(() => {
    if (!inView || touched || found || reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const el = box.current;
      if (el) {
        const k = (t - t0) / 1000;
        const w = el.clientWidth;
        setLens({ x: w * (0.5 + 0.38 * Math.sin(k * 0.9)), y: 70 + 55 * Math.sin(k * 1.7) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, touched, found, reduce]);

  const aim = (clientX: number, clientY: number) => {
    const el = box.current;
    if (!el || found) return;
    const r = el.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    setTouched(true);
    setLens({ x, y });
    const target = el.querySelector("[data-target]")?.getBoundingClientRect();
    if (target && clientX > target.left - 14 && clientX < target.right + 14 && clientY > target.top - 14 && clientY < target.bottom + 14) {
      setFound(true);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[13px] text-white">X-ray a rival's post</p>
        <p className="font-mono text-[12px]" style={{ color: found ? RED : MUTE }}>
          {found ? "threat found: 1 of 1" : "threats found: 0 of 1"}
        </p>
      </div>
      <div
        ref={box}
        className="relative cursor-crosshair select-none overflow-hidden rounded-md"
        style={{ touchAction: "pan-y" }}
        onPointerMove={(e) => e.pointerType === "mouse" && aim(e.clientX, e.clientY)}
        onPointerDown={(e) => aim(e.clientX, e.clientY)}
      >
        <div className="bg-[#EDEAE3]">
          <PostText xray={false} />
        </div>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "repeating-linear-gradient(0deg, #04140C 0px, #04140C 2px, #061B11 2px, #061B11 4px)",
            clipPath: found ? "circle(150% at 50% 50%)" : `circle(${LENS}px at ${lens.x}px ${lens.y}px)`,
            transition: found ? "clip-path 0.6s ease-out" : "none",
          }}
        >
          <PostText xray />
        </div>
        {!found && (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full border-2"
            style={{ width: LENS * 2, height: LENS * 2, left: lens.x - LENS, top: lens.y - LENS, borderColor: "#3DD68C", boxShadow: "0 0 24px rgba(61,214,140,0.45)" }}
          />
        )}
        {found && (
          <motion.span
            initial={{ scale: 2.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="pointer-events-none absolute right-3 top-3 rounded-[3px] border-[3px] px-2 py-0.5 font-mono text-[16px] font-medium uppercase tracking-[0.14em]"
            style={{ color: RED, borderColor: RED, background: "rgba(4,20,12,0.85)" }}
          >
            Code red
          </motion.span>
        )}
      </div>
      <p className="text-[14px] leading-[1.5]" style={{ color: found ? "#E8EAEA" : MUTE }}>
        {found
          ? "Found it. Peec now uses your main difference. Nubble catches this the day it is published, and the folder below is what lands on your desk."
          : coarse
            ? "Tap the headline to x-ray it. Nubble reads every rival post like this."
            : "Move the lens over the headline. Nubble reads every rival post like this."}
      </p>
    </div>
  );
}

/* ─── 3. The heat map: every move, week by week ─── */

export function Heatmap() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<{ r: FxRival; w: number }>({ r: "Peec AI", w: 0 });
  const grid = useMemo(() => {
    const g: Record<string, RunItem[]> = {};
    RUN.forEach((m) => {
      const r = rivalOf(m);
      if (!r) return;
      const k = `${r}|${weekOf(m)}`;
      (g[k] ??= []).push(m);
    });
    return g;
  }, []);
  const cellColor = (items: RunItem[]) => {
    if (!items.length) return { background: "#0C1113", border: `1px solid ${LINE}` };
    if (items.some((m) => m.kept === "code-red")) return { background: RED, boxShadow: `0 0 14px ${RED}88` };
    if (items.some((m) => m.kept === "weakened")) return { background: ORANGE, boxShadow: `0 0 12px ${ORANGE}66` };
    return { background: items.length > 1 ? "#C98A1C" : "#6B5418" };
  };
  const picked = grid[`${sel.r}|${sel.w}`] ?? [];
  return (
    <div ref={ref} className="rounded-xl border bg-[#07090A] p-4 md:p-6" style={{ borderColor: LINE }}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[13px] text-white">Every move, week by week. Tap a square.</p>
        <p className="flex flex-wrap items-center gap-3 font-mono text-[11.5px]" style={{ color: MUTE }}>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: RED }} />copied you</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} />weakened a claim</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#C98A1C" }} />other moves</span>
        </p>
      </div>
      <div className="grid gap-1 md:gap-1.5" style={{ gridTemplateColumns: `minmax(78px, 132px) repeat(${WEEKS.length}, minmax(0, 1fr)) 28px` }}>
        <span />
        {WEEKS.map((w) => (
          <span key={w.label} className="text-center font-mono text-[10px] leading-tight md:text-[11px]" style={{ color: MUTE }}>
            {w.label.split(" ")[0]}
            <br />
            {w.label.split(" ")[1]}
          </span>
        ))}
        <span className="text-center font-mono text-[10px] leading-tight md:text-[11px]" style={{ color: MUTE }}>
          all
        </span>
        {FX_RIVALS.map((r, ri) => (
          <div key={r} className="contents">
            <span className="truncate self-center font-mono text-[11.5px] md:text-[13px]" style={{ color: r === "Peec AI" ? RED : "#C9CFD2" }} title={r}>
              {r === "Ahrefs Brand Radar" ? "Ahrefs" : r}
            </span>
            {WEEKS.map((_, wi) => {
              const items = grid[`${r}|${wi}`] ?? [];
              const on = sel.r === r && sel.w === wi;
              return (
                <motion.button
                  key={wi}
                  type="button"
                  aria-label={`${r}, week of ${WEEKS[wi].label}: ${items.length} moves`}
                  onClick={() => setSel({ r, w: wi })}
                  initial={false}
                  animate={inView || reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                  transition={{ delay: reduce ? 0 : (wi * 6 + ri) * 0.025, duration: 0.25 }}
                  className="aspect-square w-full rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                  style={{ ...cellColor(items), outline: on ? "2px solid #FFFFFF" : undefined, outlineOffset: 1 }}
                >
                  {items.length > 1 && <span className="font-mono text-[11px] font-medium text-black">{items.length}</span>}
                </motion.button>
              );
            })}
            <span className="self-center text-center font-mono text-[12px] text-white">{MOVES_BY_RIVAL[r].length}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t pt-3" style={{ borderColor: LINE }}>
        <p className="mb-2 font-mono text-[12px]" style={{ color: MUTE }}>
          {sel.r}, week of {WEEKS[sel.w].label}
        </p>
        <MoveList items={picked} />
      </div>
    </div>
  );
}
