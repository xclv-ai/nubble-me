import { Component, lazy, Suspense, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Count, Ext } from "./founders";
import { LGREEN, LTag, LTrace, LYELLOW } from "./founders-luce";
import { AMBER, CompetitorMap, LINE, MUTE, RED } from "./founders-v3";
import { BRIEF, PROFILE, type RunItem } from "./founders-data";
import { FX_RIVALS, LuceBoldCtx, LuceCtx, MovesCtx, WEEKS, rivalOf, weekOf, type FxRival } from "./founders-fx-data";
import type { Sensor } from "./founders-war-table";

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

export function labelOf(m: RunItem) {
  if (m.kept === "code-red") return { t: "copied you", c: RED };
  if (m.kept === "weakened") return { t: "weakened a claim", c: ORANGE };
  if (m.kept === "worth-knowing") return { t: "worth knowing", c: AMBER };
  return null;
}

export function MoveList({ items, empty }: { items: RunItem[]; empty: string }) {
  const luce = useContext(LuceCtx);
  if (!items.length) return <p className="text-[14px]" style={{ color: MUTE }}>{empty}</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((m) => {
        const l = labelOf(m);
        return (
          <li key={m.url + m.title} className="grid grid-cols-[52px_minmax(0,1fr)] gap-2 text-[14px] leading-[1.4]">
            <span className={`font-mono text-[12px] leading-[1.6] ${luce ? "pt-[8px]" : ""}`} style={{ color: MUTE }}>
              {m.date}
            </span>
            <span className="min-w-0">
              <Ext href={m.url} className={luce ? "-my-[8px] inline-block py-[16px] text-[#E8EAEA]" : "inline-block py-1 text-[#E8EAEA]"}>
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
  const moves = useContext(MovesCtx);
  const luce = useContext(LuceCtx);
  const bold = useContext(LuceBoldCtx);
  const MOVES_BY_RIVAL = moves.byRival;
  const [gl, setGl] = useState<boolean | null>(null);
  const [sel, setSel] = useState<FxRival>("Peec AI");
  const [sensor, setSensor] = useState<Sensor>("normal");
  const [clock, setClock] = useState("");
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    const t = () => setClock(new Date().toISOString().slice(11, 19) + " UTC");
    t();
    const id = window.setInterval(t, 1000);
    return () => window.clearInterval(id);
  }, []);
  const SENSORS: { k: Sensor; t: string }[] = [
    { k: "normal", t: "Normal" },
    { k: "night", t: "Night vision" },
    { k: "thermal", t: "Thermal" },
  ];
  const hud = sensor === "night" ? "#9CFFB3" : sensor === "thermal" ? "#FFD166" : "#C9CFD2";
  useEffect(() => setGl(hasWebGL()), []);
  const sources = Array.from(new Map(PROFILE.competitors.map((c) => [c.foundAt, c.url])).entries());
  if (gl === false) return <CompetitorMap />;
  const panel = (
    <div className={luce ? "overflow-hidden rounded-[20px] bg-[#050505]" : "overflow-hidden rounded-xl border bg-[#07090A]"} style={luce ? { boxShadow: "inset 0 0 0 1px #17181A" } : { borderColor: LINE }}>
      <div className="flex flex-col gap-0.5 border-b px-4 py-2.5 font-mono text-[12px] sm:flex-row sm:items-center sm:justify-between sm:gap-3" style={{ borderColor: LINE, color: MUTE }}>
        <span className="whitespace-nowrap">
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: RED }} />
          pokpok.ai and its rivals
        </span>
        <span>15 Sep to 31 Oct 2026</span>
      </div>
      {bold && (
        <div className="grid grid-cols-1 gap-4 border-b px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center md:px-5" style={{ borderColor: "#17181A" }}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: moves.read, t: "rival moves read", tag: "SCANNED", c: LGREEN },
              { n: moves.matter, t: "matter to you", tag: "FOR YOU", c: LYELLOW },
              { n: moves.act, t: "need your move", tag: "ACT", c: RED },
            ].map((x) => (
              <div key={x.t} className="flex min-w-0 flex-col items-start gap-1.5">
                <LTag color={x.c}>{x.tag}</LTag>
                <p className="text-[34px] font-light leading-none tracking-[-0.02em] md:text-[38px]" style={{ color: x.tag === "ACT" ? RED : "#FFFFFF" }}>
                  <Count from={0} to={x.n} />
                </p>
                <p className="text-[12.5px] leading-tight text-[#A9B1B5]">{x.t}</p>
              </div>
            ))}
          </div>
          <LTrace values={WEEKS.map((_, i) => moves.run.filter((m) => weekOf(m) === i).length)} color="#E8EAEA" unit="moves a week" labels={["15 Sep", "now"]} />
        </div>
      )}
      {bold ? (
        <div role="group" aria-label="Sensor" className="flex justify-center gap-6 border-b px-3 py-4 sm:gap-10" style={{ borderColor: "#17181A" }}>
          {SENSORS.map((x) => {
            const on = sensor === x.k;
            const c = x.k === "night" ? "#7CFF9B" : x.k === "thermal" ? "#FFB224" : "#FFFFFF";
            return (
              <button key={x.k} type="button" aria-pressed={on} onClick={() => setSensor(x.k)} className="flex flex-col items-center gap-2 font-mono text-[12px]">
                <span data-l="glass" className="grid h-[60px] w-[60px] place-items-center" style={on ? { boxShadow: `0 0 0 1.5px ${c}, 0 0 18px ${c}55, 0 10px 20px rgba(0,0,0,.9)` } : undefined}>
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke={on ? c : "#8A9095"} strokeWidth="1.8" aria-hidden>
                    {x.k === "normal" && (<><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>)}
                    {x.k === "night" && <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />}
                    {x.k === "thermal" && <path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z" />}
                  </svg>
                </span>
                <span style={{ color: on ? c : "#8A9095" }}>{x.t}</span>
              </button>
            );
          })}
        </div>
      ) : luce ? (
        <div className="flex justify-center border-b px-3 py-3" style={{ borderColor: "#17181A" }}>
          <div role="group" aria-label="Sensor" className="grid w-full max-w-[420px] grid-cols-3 rounded-full p-1 font-mono text-[12.5px]" style={{ background: "#141517", boxShadow: "inset 0 0 0 1px #24262A" }}>
            {SENSORS.map((x) => (
              <button
                key={x.k}
                type="button"
                aria-pressed={sensor === x.k}
                onClick={() => setSensor(x.k)}
                className="min-h-11 whitespace-nowrap rounded-full px-1 text-[12px] transition-colors"
                style={{
                  color: sensor === x.k ? (x.k === "night" ? "#9CFFB3" : x.k === "thermal" ? "#FFD166" : "#FFFFFF") : "#7A8085",
                  background: sensor === x.k ? "linear-gradient(180deg,#34363A,#232528)" : "transparent",
                  boxShadow: sensor === x.k ? "0 2px 6px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)" : "none",
                }}
              >
                {x.t}
              </button>
            ))}
          </div>
        </div>
      ) : (
      <div role="group" aria-label="Sensor" className="grid grid-cols-3 border-b font-mono text-[12.5px]" style={{ borderColor: LINE }}>
        {SENSORS.map((x, i) => (
          <button
            key={x.k}
            type="button"
            aria-pressed={sensor === x.k}
            onClick={() => setSensor(x.k)}
            className={`min-h-11 px-2 transition-colors ${i ? "border-l" : ""}`}
            style={{
              borderColor: LINE,
              color: sensor === x.k ? "#050607" : "#C9CFD2",
              background: sensor === x.k ? (x.k === "night" ? "#7CFF9B" : x.k === "thermal" ? "#FFB224" : "#E8EAEA") : "transparent",
            }}
          >
            {x.t}
          </button>
        ))}
      </div>
      )}
      {bold && (
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:gap-4 md:px-5" style={{ borderColor: "#17181A" }}>
          <button
            type="button"
            onClick={() => {
              setSel("Peec AI");
              setSensor("normal");
              setFlash((n) => n + 1);
            }}
            aria-label="Code red: show Peec AI on the radar"
            className="nb-sos relative inline-flex min-h-[52px] shrink-0 items-center gap-3 self-start rounded-full px-5 font-mono text-[13px] font-semibold tracking-[0.08em] text-white"
            style={{ background: "radial-gradient(circle at 50% 30%,#FF6B6D 0%,#D11F24 55%,#7A0B0E 100%)", boxShadow: "0 0 0 1px #3A0A0C,0 0 0 6px #161719,0 0 0 7px #34363A,0 0 22px rgba(255,77,79,.45),inset 0 1px 0 rgba(255,255,255,.35)" }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            CODE RED
          </button>
          <p className="min-w-0 text-[15px] leading-[1.45] text-[#E8EAEA]">
            <span className="font-mono text-[12px]" style={{ color: RED }}>16 Sep </span>
            Peec AI started selling “brand perception”, your main term.{" "}
            <a href="#nb-folder" className="-my-[14px] inline-block py-[14px] font-mono text-[12.5px] underline underline-offset-4" style={{ color: RED }}>
              Open the folder
            </a>
          </p>
        </div>
      )}
      <div
        className="nb-war relative h-[330px] md:h-[400px]"
        style={{
          background:
            sensor === "night"
              ? "radial-gradient(ellipse at 50% 60%, #06240F 0%, #010A04 70%)"
              : sensor === "thermal"
                ? "radial-gradient(ellipse at 50% 60%, #0B0B4A 0%, #020214 70%)"
                : "radial-gradient(ellipse at 50% 60%, #0D1A14 0%, #07090A 65%)",
        }}
      >
        {gl && (
          <Guard fallback={<CompetitorMap />}>
            <Suspense fallback={<div className="grid h-full place-items-center font-mono text-[12px]" style={{ color: MUTE }}>loading the map…</div>}>
              <WarTable selected={sel} tracking onSelect={setSel} sensor={sensor} byRival={MOVES_BY_RIVAL} big={luce} />
            </Suspense>
          </Guard>
        )}
        {bold && flash > 0 && (
          <motion.div
            key={flash}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            initial={{ boxShadow: "inset 0 0 0 3px rgba(255,77,79,1), inset 0 0 80px rgba(255,77,79,.45)" }}
            animate={{ boxShadow: "inset 0 0 0 0px rgba(255,77,79,0), inset 0 0 0px rgba(255,77,79,0)" }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        )}
        {sensor !== "normal" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)",
            }}
          />
        )}
        <div className={`pointer-events-none absolute left-3 right-3 top-2 flex justify-between font-mono ${luce ? "text-[12px]" : "text-[11px]"}`} style={{ color: hud }}>
          <span>sensor: {SENSORS.find((x) => x.k === sensor)!.t.toLowerCase()}</span>
          <span>{clock}</span>
        </div>
        <div className={`pointer-events-none absolute bottom-2 left-3 right-3 flex flex-col gap-0.5 font-mono leading-snug ${luce ? "text-[12px]" : "text-[11px]"}`} style={{ color: hud }}>
          <span>tracking: {sel}</span>
          <span style={{ opacity: 0.75 }}>{sensor === "thermal" ? "Hotter = more moves." : "Tower height = moves we read."} Tap a tower.</span>
        </div>
      </div>
      <div className="border-t px-4 py-3" style={{ borderColor: LINE }}>
        <AnimatePresence mode="wait">
          <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="mb-2 font-mono text-[13px] font-medium" style={{ color: sel === "Peec AI" ? RED : sel === "Profound" ? AMBER : "#E8EAEA" }}>
              {sel}: {MOVES_BY_RIVAL[sel].length} move{MOVES_BY_RIVAL[sel].length === 1 ? "" : "s"}
            </p>
            <MoveList items={MOVES_BY_RIVAL[sel]} empty="Quiet. We read no moves from it between 15 Sep and 31 Oct." />
          </motion.div>
        </AnimatePresence>
      </div>
      {bold ? null : luce ? (
        <div className="grid grid-cols-3 gap-2 border-t px-4 py-4" style={{ borderColor: "#17181A" }}>
          {[
            { n: moves.read, t: "rival moves read", tag: "SCANNED", c: "#86D9A9" },
            { n: moves.matter, t: "matter to you", tag: "FOR YOU", c: "#E9D27A" },
            { n: moves.act, t: "need your move", tag: "ACT", c: RED },
          ].map((x) => (
            <div key={x.t} className="flex min-w-0 flex-col items-start gap-1.5">
              <span className="rounded-[3px] border px-1.5 font-mono text-[12px] leading-[1.6] tracking-[0.06em]" style={{ color: x.c, borderColor: x.c }}>
                {x.tag}
              </span>
              <p className="text-[34px] font-light leading-none tracking-[-0.02em] md:text-[40px]" style={{ color: x.tag === "ACT" ? RED : "#FFFFFF" }}>
                <Count from={0} to={x.n} />
              </p>
              <p className="text-[13px] leading-tight text-[#A9B1B5]">{x.t}</p>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-3 border-t font-mono" style={{ borderColor: LINE }}>
        {[
          { n: moves.read, t: "rival moves read" },
          { n: moves.matter, t: "matter to you" },
          { n: moves.act, t: "need your move", c: RED },
        ].map((x, i) => (
          <div key={x.t} className={`px-3 py-3 md:px-4 ${i ? "border-l" : ""}`} style={{ borderColor: LINE }}>
            <p className="text-[26px] font-medium leading-none tracking-[-0.02em] md:text-[30px]" style={{ color: x.c ?? "#FFFFFF" }}>
              <Count from={0} to={x.n} />
            </p>
            <p className="mt-1.5 text-[13px] leading-tight text-[#C9CFD2]">{x.t}</p>
          </div>
        ))}
      </div>
      )}
      <p className={`border-t px-4 py-2.5 font-mono leading-[1.6] ${luce ? "text-[12px]" : "text-[11.5px]"}`} style={{ borderColor: luce ? "#17181A" : LINE, color: MUTE }}>
        Each rival was found by a live web search, on these public lists of AI visibility tools:{" "}
        {sources.map(([host, url], i) => (
          <span key={host}>
            <Ext href={url} className={luce ? "-my-[14px] inline-block py-[14px]" : ""}>{host}</Ext>
            {i < sources.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </div>
  );
  if (!luce) return panel;
  if (bold)
    return (
      <div data-l="bezel" className="overflow-hidden">
        {panel}
      </div>
    );
  return (
    <div className="rounded-[26px] p-[6px]" style={{ background: "linear-gradient(180deg,#2A2B2E,#141517 45%,#0B0B0C)", boxShadow: "0 24px 60px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.08)" }}>
      {panel}
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
      <p data-target={xray ? undefined : ""} className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] md:text-[30px]" style={{ color: xray ? "#3DD68C" : "#171717" }}>
        Introducing{" "}
        <span
          className={xray ? "" : "nb-hint"}
          style={xray ? hit : { padding: "0 4px", textDecoration: `underline wavy ${RED}`, textUnderlineOffset: 6, textDecorationThickness: 2 }}
        >
          brand perception
        </span>
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

export function XRayHunt({ embedded = false, onFound }: { embedded?: boolean; onFound?: () => void } = {}) {
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
        const hh = el.clientHeight;
        setLens({ x: Math.min(w - LENS, Math.max(LENS, w * (0.5 + 0.38 * Math.sin(k * 0.9)))), y: Math.min(hh - LENS, Math.max(LENS, 70 + 55 * Math.sin(k * 1.7))) });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, touched, found, reduce]);

  // Nothing may depend on a tap: if nobody finds it, the lens finds it by itself.
  useEffect(() => {
    if (!embedded || !inView || found) return;
    const t = setTimeout(() => setFound(true), touched ? 9000 : 6000);
    return () => clearTimeout(t);
  }, [embedded, inView, found, touched]);

  useEffect(() => {
    if (found) onFound?.();
  }, [found, onFound]);

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
      {!embedded && <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[13px] text-white">X-ray a rival's post</p>
        <p className="font-mono text-[12px]" style={{ color: found ? RED : MUTE }}>
          {found ? "threat found: 1 of 1" : "threats found: 0 of 1"}
        </p>
      </div>}
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
        {found && !embedded && (
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
      {!embedded && <p className="text-[14px] leading-[1.5]" style={{ color: found ? "#E8EAEA" : MUTE }}>
        {found
          ? "Found it. Peec now uses your main difference. Nubble catches this the day it is published, and the folder below is what lands on your desk."
          : coarse
            ? "Tap the headline to x-ray it. Nubble reads every rival post like this."
            : "Move the lens over the headline. Nubble reads every rival post like this."}
      </p>}
    </div>
  );
}

/* ─── 3. The heat map: every move, week by week ─── */

export function Heatmap() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const { run, byRival: MOVES_BY_RIVAL } = useContext(MovesCtx);
  const [sel, setSel] = useState<{ r: FxRival; w: number }>({ r: "Peec AI", w: 0 });
  const grid = useMemo(() => {
    const g: Record<string, RunItem[]> = {};
    run.forEach((m) => {
      const r = rivalOf(m);
      if (!r) return;
      const k = `${r}|${weekOf(m)}`;
      (g[k] ??= []).push(m);
    });
    return g;
  }, [run]);
  const cellColor = (items: RunItem[]) => {
    if (!items.length) return { background: "#0C1113", border: `1px solid ${LINE}` };
    if (items.some((m) => m.kept === "code-red")) return { background: RED, boxShadow: `0 0 14px ${RED}88` };
    if (items.some((m) => m.kept === "weakened")) return { background: ORANGE, boxShadow: `0 0 12px ${ORANGE}66` };
    return { background: "#C98A1C" };
  };
  const picked = grid[`${sel.r}|${sel.w}`] ?? [];
  return (
    <div ref={ref} data-l="glasscard" className="rounded-xl border bg-[#07090A] p-3 md:p-6" style={{ borderColor: LINE }}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[13px] text-white">Every move, week by week. Tap a square.</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]" style={{ color: MUTE }}>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: RED }} />copied you</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} />weakened a claim</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#C98A1C" }} />other</span>
        </p>
      </div>
      <div className="grid gap-[3px] md:max-w-[620px] md:gap-1.5" style={{ gridTemplateColumns: `54px repeat(${WEEKS.length}, minmax(0, 1fr)) 22px` }}>
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
              {r.split(" ")[0].replace(".AI", "")}
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
                  className="aspect-square min-h-[40px] w-full rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
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
        <MoveList items={picked} empty={`No moves from ${sel.r} that week.`} />
      </div>
    </div>
  );
}
