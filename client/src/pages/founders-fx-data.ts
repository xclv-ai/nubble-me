import { RUN, type RunItem } from "./founders-data";

/** The six rivals Nubble found for pokpok.ai, with the moves we read from each (from RUN, 15 Sep to 31 Oct 2026). */
export const FX_RIVALS = ["Peec AI", "Profound", "Semrush", "Otterly.AI", "Scrunch AI", "Ahrefs Brand Radar"] as const;
export type FxRival = (typeof FX_RIVALS)[number];

export function rivalOf(item: RunItem): FxRival | null {
  if (item.title.startsWith("Peec")) return "Peec AI";
  if (item.title.startsWith("Profound")) return "Profound";
  if (item.title.startsWith("Semrush")) return "Semrush";
  return null;
}

export const MOVES_BY_RIVAL: Record<FxRival, RunItem[]> = FX_RIVALS.reduce(
  (acc, r) => ({ ...acc, [r]: RUN.filter((m) => rivalOf(m) === r) }),
  {} as Record<FxRival, RunItem[]>,
);

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
