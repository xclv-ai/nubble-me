/* v19: copy of v18. Only change, asked by the owner: the map and its control panel move out of the intro
   into the next section, half screen map, half screen folder, with a red glow on the switches of
   rivals that need focus. Every other section is the same as v18. */
import { lazy, Suspense } from "react";
import FoundersLandingV3, { LINE, Wrap } from "./founders-v3";
import { HeatFxCtx, Heatmap, WarSplit } from "./founders-fx";
import { FormNote, IntelFolder, Plans, Sendables } from "./founders-v5-parts";
import { RUN, RUN_MORE } from "./founders-data";
import { buildMoves, dateOf, LuceBoldCtx, LuceCtx, MovesCtx } from "./founders-fx-data";
import { LucePhysCtx, RivalsCtx, useRivalsState } from "./founders-luce-ctl";
import { LUCE_3D_CSS, Luce3DCtx } from "./founders-luce-3d";
import { Luce3DLayerV17 } from "./founders-luce-3d-v17";

const MOVES = buildMoves([...RUN, ...RUN_MORE].sort((a, b) => dateOf(a).getTime() - dateOf(b).getTime()));

const PressureGauge = lazy(() => import("./founders-gauge").then((m) => ({ default: () => <m.PressureV2Ctx.Provider value><m.PressureGauge /></m.PressureV2Ctx.Provider> })));

/*
 * /founders-v18: v17 with the pressure score matching the code red label (owner, 2 Nov: "you marked it
 * code red but pressure is just 45?"): a copy of your main claim scores 80 on its own, the dial is red
 * from 80 up, and the score turns red there too. This is the nubble.me homepage; /founders-v17 is kept.
 *
 * /founders-v17: v16 with a heat map that answers a tap (owner, 2 Nov: "nothing attractive is happening"):
 * the key presses in and its light flares, target brackets slide to it, the other keys dim, its rival and
 * week light up, and the week opens with a scan line. This is the nubble.me homepage; /founders-v16 is kept.
 *
 * /founders-v16: v15 with the paddle lofted like the Luce lever (a narrow neck out of the socket
 * flaring into a wide blade, domed top) and the socket ball shaded round; the rival toggles sit under
 * the READ / FOR YOU / ACT strip (owner, 2 Nov: "looks terrible", "move section lower"). This is the
 * nubble.me homepage. /founders-v15 is kept as it was.
 *
 * /founders-v15: v14 with a real off position for the toggles: the bar swings down round the hub
 * and tilts, instead of sliding off and baring a flat white disc (owner, 2 Nov: "incorrect switched
 * off"). /founders-v14 is kept as it was.
 *
 * /founders-v14: v13 with the toggle bar shorter, squarer ends and its light bands re-measured, a
 * wider lit cushion frame and brushed grain in the well (owner, 2 Nov: "you dont see flaws?").
 * /founders-v13 is kept as it was.
 *
 * /founders-v13: v12 with the toggle well lit by a round glow around the hub, no straight shadow
 * beside the frame, a dark groove round the well and a darker lower hub (owner, 2 Nov: "glow should be
 * circular not linear"). /founders-v12 is kept as it was.
 * (v11: v10 with the toggle and key rebuilt from a Blender study of the Luce reference)
 * (owner, 2 Nov 2026: match the reference, research first). See founders-luce-3d-v17.tsx.
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
        <Luce3DLayerV17>
        <div data-l="bezel" className="grid grid-cols-1 items-start gap-8 p-5 md:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <Suspense fallback={<div className="mx-auto aspect-square w-full max-w-[380px] rounded-xl bg-[#050505]" />}>
            <PressureGauge />
          </Suspense>
          <HeatFxCtx.Provider value>
            <Heatmap />
          </HeatFxCtx.Provider>
        </div>
        </Luce3DLayerV17>
      </Wrap>
    </section>
  );
}

export default function FoundersLandingV19({ rectLogo = false }: { rectLogo?: boolean } = {}) {
  const rivals = useRivalsState();
  return (
    <Luce3DCtx.Provider value={Luce3DLayerV17}>
    <style>{LUCE_3D_CSS}</style>
    <LucePhysCtx.Provider value>
    <RivalsCtx.Provider value={rivals}>
    <LuceCtx.Provider value>
      <LuceBoldCtx.Provider value>
        <MovesCtx.Provider value={MOVES}>
          <FoundersLandingV3
            mono
            luce
            rectLogo={rectLogo}
            fx={{
              heroWide: <WarSplit />,
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
