import { lazy, Suspense } from "react";
import FoundersLandingV3, { LINE, Wrap } from "./founders-v3";
import { Heatmap, WarRoom } from "./founders-fx";
import { FormNote, IntelFolder, Plans, Sendables } from "./founders-v5-parts";
import { RUN, RUN_MORE } from "./founders-data";
import { buildMoves, dateOf, LuceBoldCtx, LuceCtx, MovesCtx } from "./founders-fx-data";
import { LucePhysCtx, RivalsCtx, useRivalsState } from "./founders-luce-ctl";
import { LUCE_3D_CSS, Luce3DCtx } from "./founders-luce-3d";
import { Luce3DLayerV11 } from "./founders-luce-3d-v11";

const MOVES = buildMoves([...RUN, ...RUN_MORE].sort((a, b) => dateOf(a).getTime() - dateOf(b).getTime()));

const PressureGauge = lazy(() => import("./founders-gauge").then((m) => ({ default: m.PressureGauge })));

/*
 * /founders-v11: v10 with the toggle and key rebuilt from a Blender study of the Luce reference
 * (owner, 2 Nov 2026: match the reference, research first). See founders-luce-3d-v11.tsx.
 *
 * /founders-v10: v9 with the controls rendered as real 3D objects (owner, 2 Nov 2026: "cheap gradients,
 * not 3D"). Same light and studio reflections as the pressure gauge. See founders-luce-3d.tsx.
 *
 * /founders-v9: v8 plus the real Luce physical controls (owner, 2 Nov 2026): silver lever toggles for the
 * rivals you watch, a rotary key for depth, a SYNC slider for the weeks of pressure, an SOS capsule for
 * CODE RED, and heat map squares as lit glass keys. See founders-luce-ctl.tsx.
 *
 * v8 notes: v5's structure, words, radar and gauge, with the Ferrari Luce materials on every block
 * (owner's references, 1 Nov 2026): graphite bezels around black glass, round glass buttons, silver pills,
 * outlined tags with light numbers, a trace with a red "now" line. See founders-luce.tsx.
 */

function Pressure() {
  return (
    <section className="border-t" style={{ borderColor: LINE }}>
      <Wrap className="py-12 md:py-20">
        <Luce3DLayerV11>
        <div data-l="bezel" className="grid grid-cols-1 items-start gap-8 p-5 md:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <Suspense fallback={<div className="mx-auto aspect-square w-full max-w-[380px] rounded-xl bg-[#050505]" />}>
            <PressureGauge />
          </Suspense>
          <Heatmap />
        </div>
        </Luce3DLayerV11>
      </Wrap>
    </section>
  );
}

export default function FoundersLandingV11() {
  const rivals = useRivalsState();
  return (
    <Luce3DCtx.Provider value={Luce3DLayerV11}>
    <style>{LUCE_3D_CSS}</style>
    <LucePhysCtx.Provider value>
    <RivalsCtx.Provider value={rivals}>
    <LuceCtx.Provider value>
      <LuceBoldCtx.Provider value>
        <MovesCtx.Provider value={MOVES}>
          <FoundersLandingV3
            mono
            luce
            fx={{
              map: <WarRoom />,
              folder: (
                <div id="nb-folder" data-l="bezel" className="scroll-mt-[90px] p-4 md:p-6">
                  <IntelFolder />
                </div>
              ),
              afterDesk: <Pressure />,
              investor: <Sendables />,
              formNote: <FormNote />,
              plans: <Plans />,
              closeStamp: "Two ways in",
            }}
          />
        </MovesCtx.Provider>
      </LuceBoldCtx.Provider>
    </LuceCtx.Provider>
    </RivalsCtx.Provider>
    </LucePhysCtx.Provider>
    </Luce3DCtx.Provider>
  );
}
