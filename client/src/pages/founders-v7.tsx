import { lazy, Suspense } from "react";
import FoundersLandingV3, { LINE, Wrap } from "./founders-v3";
import { Heatmap, WarRoom } from "./founders-fx";
import { FormNote, IntelFolder, Plans, Sendables } from "./founders-v5-parts";
import { RUN, RUN_MORE } from "./founders-data";
import { buildMoves, dateOf, LuceCtx, MovesCtx } from "./founders-fx-data";

const MOVES = buildMoves([...RUN, ...RUN_MORE].sort((a, b) => dateOf(a).getTime() - dateOf(b).getTime()));

const PressureGauge = lazy(() => import("./founders-gauge").then((m) => ({ default: m.PressureGauge })));

/*
 * /founders-v7: v5 exactly, with Luce style touches on its own parts (owner, 1 Nov 2026). v5 is:
 * 1. the sendables: the investor update, the LinkedIn post and the deck slide Nubble writes from the moves;
 * 2. one story: the x-ray is the evidence inside the intel folder;
 * 3. the pressure gauge from the iPhone app (after the Ferrari Luce cluster), next to the heat map.
 */

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

export default function FoundersLandingV7() {
  return (
    <LuceCtx.Provider value>
    <MovesCtx.Provider value={MOVES}>
      <FoundersLandingV3 mono fx={{ map: <WarRoom />, folder: <IntelFolder />, afterDesk: <Pressure />, investor: <Sendables />, formNote: <FormNote />, plans: <Plans />, closeStamp: "Two ways in" }} />
    </MovesCtx.Provider>
    </LuceCtx.Provider>
  );
}
