import { createContext } from "react";
import { RUN, type RunItem } from "./founders-data";

/** The six rivals Nubble found for pokpok.ai, with the moves we read from each (from RUN, 15 Sep to 31 Oct 2026). */
export const FX_RIVALS = ["Peec AI", "Profound", "Semrush", "Otterly.AI", "Scrunch AI", "Ahrefs Brand Radar"] as const;
export type FxRival = (typeof FX_RIVALS)[number];

export function rivalOf(item: RunItem): FxRival | null {
  if (item.title.startsWith("Peec")) return "Peec AI";
  if (item.title.startsWith("Profound")) return "Profound";
  if (item.title.startsWith("Semrush")) return "Semrush";
  if (item.title.startsWith("Otterly")) return "Otterly.AI";
  if (item.title.startsWith("Scrunch")) return "Scrunch AI";
  if (item.title.startsWith("Ahrefs")) return "Ahrefs Brand Radar";
  return null;
}

export type Moves = { run: RunItem[]; byRival: Record<FxRival, RunItem[]>; read: number; matter: number; act: number };

export function buildMoves(run: RunItem[]): Moves {
  const byRival = FX_RIVALS.reduce((acc, r) => ({ ...acc, [r]: run.filter((m) => rivalOf(m) === r) }), {} as Record<FxRival, RunItem[]>);
  return {
    run,
    byRival,
    read: run.length,
    matter: run.filter((m) => m.kept).length,
    act: run.filter((m) => m.kept === "code-red" || m.kept === "weakened").length,
  };
}

/** v4 reads the first run (12 posts). v5 passes a longer run through MovesCtx. */
export const DEFAULT_MOVES = buildMoves(RUN);
export const MovesCtx = createContext<Moves>(DEFAULT_MOVES);
export const MOVES_BY_RIVAL = DEFAULT_MOVES.byRival;

/** Seven weeks, each starting on the date shown. */
export const WEEKS = [
  { label: "15 Sep", start: new Date("2026-09-15") },
  { label: "22 Sep", start: new Date("2026-09-22") },
  { label: "29 Sep", start: new Date("2026-09-29") },
  { label: "6 Oct", start: new Date("2026-10-06") },
  { label: "13 Oct", start: new Date("2026-10-13") },
  { label: "20 Oct", start: new Date("2026-10-20") },
  { label: "27 Oct", start: new Date("2026-10-27") },
];

const MONTHS: Record<string, number> = { Sep: 8, Oct: 9 };
export function dateOf(item: RunItem) {
  const [d, m] = item.date.split(" ");
  return new Date(Date.UTC(2026, MONTHS[m], Number(d)));
}

export function weekOf(item: RunItem) {
  const t = dateOf(item).getTime();
  let w = 0;
  WEEKS.forEach((wk, i) => {
    if (t >= wk.start.getTime()) w = i;
  });
  return w;
}
