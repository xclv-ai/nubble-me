import { motion } from "framer-motion";

/*
 * Luce materials for /founders-v8 (owner's Ferrari Luce references, 1 Nov 2026).
 * The page keeps v5's structure and words; these only change how its parts look.
 * Hooks are data-l attributes on v5's own elements, styled under .nb-luce.
 */

export const LGREEN = "#86D9A9";
export const LYELLOW = "#E9D27A";

export const LUCE_CSS = `
  .founders.nb-luce{background:#000!important}
  .founders.nb-luce header{background:rgba(0,0,0,.92)!important;border-color:#17181A!important}

  /* graphite bezel around a black glass panel */
  .nb-luce [data-l=bezel]{position:relative;border:0!important;border-radius:30px!important;background:#050505!important;
    box-shadow:0 0 0 1px #2E3034,0 0 0 9px #161719,0 0 0 10px #34363A,0 30px 70px rgba(0,0,0,.75),inset 0 1px 0 rgba(255,255,255,.06)!important}
  @media (min-width:768px){.nb-luce [data-l=bezel]{border-radius:38px!important}}
  .nb-luce [data-l=bezel-wrap]{padding-inline:10px}

  /* inner black glass card */
  .nb-luce [data-l=glasscard]{border-radius:16px!important;border-color:#222428!important;background:linear-gradient(180deg,#0E0F11,#070708)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important}

  /* silver pill: primary action */
  .nb-luce [data-l=cta]{border-radius:999px!important;color:#0A0A0A!important;font-weight:600!important;
    background:linear-gradient(180deg,#FFFFFF 0%,#D9DCDF 45%,#A9ADB2 100%)!important;
    box-shadow:0 8px 18px rgba(0,0,0,.7),inset 0 -2px 0 rgba(0,0,0,.25),inset 0 1px 0 #fff!important;border:0!important}
  .nb-luce [data-l=cta]:active{transform:translateY(1px)}

  /* recessed glass field */
  .nb-luce [data-l=field]{border-radius:999px!important;background:#050505!important;border-color:#2A2C30!important;box-shadow:inset 0 3px 8px #000,0 1px 0 rgba(255,255,255,.05)!important;padding-left:18px!important}

  /* round glass button with a diagonal sheen */
  .nb-luce [data-l=glass]{position:relative;overflow:hidden;border-radius:999px!important;border:0!important;color:#F2F2F2!important;
    background:radial-gradient(circle at 50% 65%,#17181B 0%,#050505 75%)!important;
    box-shadow:0 0 0 1px #2C2E31,0 10px 20px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.1)!important}
  .nb-luce [data-l=glass]::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(150deg,transparent 0 55%,rgba(255,255,255,.12) 55% 100%)}

  /* pill segmented control */
  .nb-luce [data-l=pill]{border-radius:999px!important;background:#111214!important;box-shadow:inset 0 0 0 1px #26282C,inset 0 3px 8px #000!important;padding:4px!important;border:0!important}
  .nb-luce [data-l=pill] > button,.nb-luce [data-l=pill] [data-l=seg]{border-radius:999px!important}
  .nb-luce [data-l=pill] [data-l=seg-on]{border-radius:999px!important;background:linear-gradient(180deg,#3A3C40,#232528)!important;box-shadow:0 3px 8px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.12)!important}

  /* chips with an LED */
  .nb-luce [data-l=chip]{background:linear-gradient(180deg,#141517,#0A0A0B)!important;border-color:#26282C!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important}

  /* gauge week chips: glass keys */
  .nb-luce [data-l=key]{border-radius:14px!important;background:radial-gradient(circle at 50% 70%,#141517,#060607)!important;box-shadow:0 0 0 1px #26282C,0 6px 12px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.08)!important;border:0!important}
  .nb-luce [data-l=key][aria-pressed=true]{box-shadow:0 0 0 1.5px ${LYELLOW},0 0 14px rgba(233,210,122,.25),inset 0 1px 0 rgba(255,255,255,.1)!important}

  /* the reader card: a white screen inside the bezel */
  .nb-luce [data-l=screen]{border-radius:18px!important}
`;

export function LTag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-block self-start whitespace-nowrap rounded-[3px] border px-1.5 py-[1px] font-mono text-[12px] leading-[1.5] tracking-[0.06em]" style={{ color, borderColor: color }}>
      {children}
    </span>
  );
}

/** A thin trace with a red "now" line (Luce status screen). */
export function LTrace({ values, color, unit, labels }: { values: number[]; color: string; unit: string; labels: [string, string] }) {
  const W = 240;
  const H = 52;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [8 + (i * (W - 24)) / Math.max(1, values.length - 1), H - 6 - (v / max) * (H - 16)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const nowX = pts[pts.length - 1][0];
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
        {[0.3, 0.6, 0.9].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#1A1C1E" />
        ))}
        <motion.path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3 : 1.6} fill={color} />
        ))}
        <line x1={nowX} x2={nowX} y1="0" y2={H} stroke="#FF4D4F" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between font-mono text-[12px]" style={{ color: "#8A9095" }}>
        <span>{labels[0]}</span>
        <span>{unit}</span>
        <span style={{ color: "#FF4D4F" }}>{labels[1]}</span>
      </div>
    </div>
  );
}

export const LUCE_CSS_2 = `
  .nb-luce [data-l=pill] [aria-selected=true],.nb-luce [data-l=pill] [aria-pressed=true]{color:#FFFFFF!important}
  .nb-luce [data-l=ring]{border-radius:20px!important;box-shadow:0 0 0 1px #2E3034,0 0 0 9px #161719,0 0 0 10px #34363A,0 30px 70px rgba(0,0,0,.75)!important}
`;
