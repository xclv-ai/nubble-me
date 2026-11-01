import FoundersLandingV3 from "./founders-v3";
import { Heatmap, WarRoom, XRayHunt } from "./founders-fx";

/*
 * /founders-v4: the bunker page with mono headings (JetBrains Mono, as on pokpok.ai)
 * and three things to play with: a 3D war table, an x-ray hunt, and a heat map of every move.
 */
export default function FoundersLandingV4() {
  return <FoundersLandingV3 mono fx={{ map: <WarRoom />, beforeFolder: <XRayHunt />, record: <Heatmap /> }} />;
}
