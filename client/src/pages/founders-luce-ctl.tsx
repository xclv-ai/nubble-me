import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

/*
 * Physical Luce controls for /founders-v9 (owner, 2 Nov 2026: "where are the physical switches?").
 * Each one does a real Nubble job:
 *   LeverToggle: switch a rival on or off (the rivals you watch).
 *   RotaryKey:   turn the depth (So what / Executive summary / Original).
 *   SyncSlider:  slide through the weeks of pressure; SYNC = all weeks.
 *   SosCapsule:  CODE RED, fires the rival alert.
 *   glassKey():  heat map squares as lit glass keys.
 */

export const LucePhysCtx = createContext(false);

type Rivals = { off: ReadonlySet<string>; toggle: (r: string) => void };
export const RivalsCtx = createContext<Rivals>({ off: new Set(), toggle: () => {} });

export function useRivalsState(): Rivals {
  const [off, setOff] = useState<ReadonlySet<string>>(new Set());
  const toggle = useCallback((r: string) => {
    setOff((s) => {
      const n = new Set(s);
      if (n.has(r)) n.delete(r);
      else n.add(r);
      return n;
    });
  }, []);
  return useMemo(() => ({ off, toggle }), [off, toggle]);
}

export const useRivals = () => useContext(RivalsCtx);

/** Silver lever in a black slot. Up = on. */
export function LeverToggle({ on, onChange, label, sub, color = "#FFFFFF" }: { on: boolean; onChange: () => void; label: string; sub?: string; color?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={`${label}: ${on ? "on" : "off"}`} onClick={onChange} className="group flex min-w-[52px] flex-col items-center gap-2 py-1">
      <span className="font-mono text-[12px] leading-none transition-colors" style={{ color: on ? color : "#5C6266", textShadow: on ? `0 0 8px ${color}66` : "none" }}>
        {label}
      </span>
      <span
        className="relative block h-[58px] w-[34px] rounded-[17px]"
        style={{ background: "linear-gradient(180deg,#050505,#141517)", boxShadow: "0 0 0 1px #2A2C30, inset 0 2px 6px #000, 0 1px 0 rgba(255,255,255,.06)" }}
      >
        <span className="absolute left-1/2 top-1/2 h-[30px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-[11px]" style={{ background: "radial-gradient(circle at 50% 40%,#2A2C30,#0A0A0B)" }} />
        <motion.span
          className="absolute left-1/2 h-[13px] w-[44px] -translate-x-1/2 rounded-[7px]"
          initial={false}
          animate={{ top: on ? 9 : 36 }}
          transition={{ type: "spring", stiffness: 520, damping: 30 }}
          style={{
            background: "linear-gradient(180deg,#FFFFFF 0%,#D5D8DB 35%,#8E9297 70%,#C4C7CB 100%)",
            boxShadow: "0 3px 6px rgba(0,0,0,.8), inset 0 -1px 0 rgba(0,0,0,.3)",
          }}
        />
      </span>
      {sub && (
        <span className="font-mono text-[12px] leading-none" style={{ color: on ? "#A9B1B5" : "#4A4F53" }}>
          {sub}
        </span>
      )}
    </button>
  );
}

/** Big silver rotary key with labelled detents. */
export function RotaryKey({ value, options, onChange, colors }: { value: number; options: readonly string[]; onChange: (i: number) => void; colors?: string[] }) {
  const n = options.length;
  const ANG = n === 3 ? [-58, 0, 58] : options.map((_, i) => -60 + (120 * i) / Math.max(1, n - 1));
  const drag = useRef<{ x: number } | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <div role="radiogroup" aria-label="Depth" className="grid w-full grid-cols-3 items-end gap-1 text-center">
        {options.map((o, i) => {
          const on = i === value;
          const c = colors?.[i] ?? "#FFFFFF";
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(i)}
              className={`flex min-h-[44px] flex-col items-center justify-end gap-1 font-mono text-[13px] leading-tight ${i === 1 ? "pb-3" : ""}`}
              style={{ color: on ? c : "#6A7074", textShadow: on ? `0 0 10px ${c}55` : "none" }}
            >
              {o}
              <span className="block h-[6px] w-[6px] rounded-full" style={{ background: on ? c : "#2A2C30", boxShadow: on ? `0 0 8px ${c}` : "none" }} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label={`Turn the key. Now: ${options[value]}`}
        onClick={() => onChange((value + 1) % n)}
        onPointerDown={(e) => (drag.current = { x: e.clientX })}
        onPointerUp={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          drag.current = null;
          if (Math.abs(dx) > 24) {
            e.preventDefault();
            onChange(Math.max(0, Math.min(n - 1, value + (dx > 0 ? 1 : -1))));
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(n - 1, value + 1));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(0, value - 1));
        }}
        className="relative grid h-[132px] w-[132px] touch-none place-items-center rounded-full"
        style={{ background: "radial-gradient(circle at 50% 40%,#1D1E21,#050505 70%)", boxShadow: "0 0 0 1px #2E3034, 0 0 0 7px #121315, 0 0 0 8px #34363A, 0 18px 30px rgba(0,0,0,.85)" }}
      >
        <span
          className="absolute inset-[12px] rounded-full"
          style={{ background: "conic-gradient(from 200deg,#6E7176,#E9EBED,#9A9DA2,#F6F7F8,#7B7E83,#C9CBCE,#6E7176)", boxShadow: "inset 0 2px 6px rgba(0,0,0,.6)" }}
        />
        <span className="absolute inset-[24px] rounded-full" style={{ background: "radial-gradient(circle at 50% 35%,#2B2D31,#0B0B0C)" }} />
        <motion.span
          className="relative block h-[112px] w-[40px] rounded-[20px]"
          initial={false}
          animate={{ rotate: ANG[value] }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          style={{
            background: "linear-gradient(90deg,#7A7D82 0%,#F4F5F6 35%,#D2D4D7 55%,#8C8F94 100%)",
            boxShadow: "0 6px 14px rgba(0,0,0,.75), inset 0 1px 0 #fff",
          }}
        >
          <span className="absolute left-1/2 top-[22px] h-[68px] w-[7px] -translate-x-1/2 rounded-full bg-[#050505]" />
        </motion.span>
      </button>
      <p className="font-mono text-[12px]" style={{ color: "#6A7074" }}>
        Turn the key, or swipe the card.
      </p>
    </div>
  );
}

/** SYNC button plus a slider with a red knob that shows the value. */
export function SyncSlider({
  labels,
  values,
  value,
  onChange,
  colorOf,
}: {
  labels: string[];
  values: number[];
  value: number; // -1 = SYNC (all)
  onChange: (i: number) => void;
  colorOf: (v: number) => string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const n = labels.length;
  const at = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left - 26) / Math.max(1, r.width - 52)));
    return Math.round(f * (n - 1));
  };
  const down = useRef(false);
  const pos = (i: number) => `calc(26px + (100% - 52px) * ${i / Math.max(1, n - 1)})`;
  const sync = value < 0;
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        aria-pressed={sync}
        onClick={() => onChange(-1)}
        className="mt-[2px] grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full font-mono text-[12px] font-semibold tracking-[0.04em]"
        style={{
          color: sync ? "#FFFFFF" : "#8A9095",
          background: "radial-gradient(circle at 50% 40%,#202124,#09090A)",
          boxShadow: "0 0 0 1px #2E3034, 0 0 0 5px #121315, 0 0 0 6px #34363A",
          outline: sync ? "2px solid #E9D27A" : "none",
          outlineOffset: 5,
        }}
      >
        ALL
      </button>
      <div className="min-w-0 flex-1">
        <div
          ref={track}
          role="slider"
          tabIndex={0}
          aria-label="Week"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={Math.max(0, value)}
          aria-valuetext={sync ? "All weeks" : `week of ${labels[value]}: ${values[value]}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(n - 1, Math.max(0, value) + 1));
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(0, Math.max(0, value) - 1));
          }}
          onPointerDown={(e) => {
            down.current = true;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            onChange(at(e.clientX));
          }}
          onPointerMove={(e) => down.current && onChange(at(e.clientX))}
          onPointerUp={() => (down.current = false)}
          onPointerCancel={() => (down.current = false)}
          className="relative h-[56px] cursor-pointer touch-none rounded-full"
          style={{ background: "linear-gradient(180deg,#232427,#1A1B1D)", boxShadow: "inset 0 2px 8px #000, 0 0 0 1px #2A2C30" }}
        >
          <motion.span
            aria-hidden
            className="absolute top-1/2 grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[17px] font-semibold"
            initial={false}
            animate={{ left: pos(Math.max(0, value)), opacity: sync ? 0.35 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            style={{
              color: "#FFFFFF",
              background: "radial-gradient(circle at 50% 35%,#D8264A,#A0112E 70%)",
              boxShadow: "0 0 0 2px #3A0A14, 0 0 0 4px #A0112E55, 0 6px 14px rgba(0,0,0,.8)",
            }}
          >
            {sync ? "" : values[value]}
          </motion.span>
        </div>
        <div className="relative mt-1 h-[48px]">
          {labels.map((l, i) => {
            const on = i === value;
            return (
              <button
                key={l}
                type="button"
                onClick={() => onChange(i)}
                aria-label={`Week of ${l}`}
                className="absolute top-0 flex min-h-[48px] min-w-[44px] -translate-x-1/2 flex-col items-center font-mono text-[12px] leading-tight"
                style={{ left: pos(i), color: on ? "#FFFFFF" : "#6A7074" }}
              >
                <span className="block h-[6px] w-px" style={{ background: values[i] ? colorOf(values[i]) : "#3A3C40" }} />
                <span>{l.split(" ")[0]}</span>
                <span>{l.split(" ")[1]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Black glass SOS capsule with a lit legend. */
export function SosCapsule({ onPress, children, label }: { onPress: () => void; children: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex shrink-0 self-start rounded-full p-[6px]" style={{ background: "#0B0B0C", boxShadow: "inset 0 2px 6px #000, 0 0 0 1px #26282C" }}>
      <button
        type="button"
        onClick={onPress}
        aria-label={label}
        className="relative inline-flex min-h-[52px] items-center gap-3 rounded-full px-6 font-mono text-[14px] font-semibold tracking-[0.12em] active:translate-y-px"
        style={{ color: "#FFFFFF", background: "radial-gradient(ellipse at 50% 30%,#222326,#070708 75%)", boxShadow: "0 0 0 1px #34363A, 0 6px 14px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.1)", textShadow: "0 0 10px rgba(255,255,255,.55)" }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#FF4D4F" }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: "#FF4D4F", boxShadow: "0 0 8px #FF4D4F" }} />
        </span>
        {children}
      </button>
    </span>
  );
}

/** Heat map square as a black glass key with a lit LED in the move's colour. */
export function glassKey(color: string | null, on: boolean): React.CSSProperties {
  return {
    background: color
      ? `radial-gradient(circle at 50% 55%, ${color} 0%, ${color}CC 28%, ${color}33 58%, #0A0B0C 80%)`
      : "radial-gradient(circle at 50% 40%,#16171A,#08090A 75%)",
    boxShadow: `0 0 0 1px ${color ? color + "66" : "#26282C"}, 0 4px 8px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.08)${color ? `, 0 0 12px ${color}44` : ""}`,
    outline: on ? "2px solid #FFFFFF" : undefined,
    outlineOffset: 2,
    borderRadius: 10,
  };
}
