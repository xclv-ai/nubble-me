import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/*
 * /founders-v12 version of the Luce 3D layer (v11's stays in founders-luce-3d-v11.tsx, unchanged).
 * v12: the key and toggle are shaded by painted light (matcaps drawn in code from values measured
 * on the full-size Luce crops), so light direction and gradients match the reference exactly.
 * Earlier note: /founders-v11 version of the Luce 3D layer (v10's stays in founders-luce-3d.tsx, unchanged).
 * v11: the toggle was modelled in Blender against the Luce reference, then rebuilt here with the
 * same measurements, and everything is lit by the same code-built studio as that Blender study.
 *
 * Real 3D for the Luce controls (owner, 2 Nov 2026: "cheap gradients, not 3D").
 *
 * One transparent WebGL canvas sits over a block of the page. It finds the page's own controls by
 * their data-3d attribute and builds a real object under each one, lit by the same photographed
 * studio as the pressure gauge: chrome levers, a silver rotary key, black glass buttons and keys,
 * a red glass knob. The HTML stays on top for the words, the taps and screen readers, so nothing
 * about how the page works changes. 1 unit = 1 CSS pixel, front camera, so objects sit exactly
 * under their controls.
 *
 * data-3d kinds: lever (data-on), rotary (data-angle), sos, glass (data-on, data-color), track,
 * knob, key (data-color, data-on).
 */


function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** A rounded rectangle (or pill) extruded with a soft bevel, centred on the origin, facing +z. */
function slab(w: number, h: number, depth: number, bevel: number, radius = Math.min(w, h) / 2) {
  const r = Math.max(0.5, Math.min(radius, w / 2 - bevel - 0.01, h / 2 - bevel - 0.01));
  const iw = Math.max(1, w - bevel * 2);
  const ih = Math.max(1, h - bevel * 2);
  const x = -iw / 2;
  const y = -ih / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + iw - r, y);
  s.quadraticCurveTo(x + iw, y, x + iw, y + r);
  s.lineTo(x + iw, y + ih - r);
  s.quadraticCurveTo(x + iw, y + ih, x + iw - r, y + ih);
  s.lineTo(x + r, y + ih);
  s.quadraticCurveTo(x, y + ih, x, y + ih - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 8, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Give a slab front-face UVs that span 0..1 across its width and height, so a band texture fits it. */
function fitUV(g: THREE.BufferGeometry, w: number, h: number) {
  const pos = g.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / w + 0.5;
    uv[i * 2 + 1] = pos.getY(i) / h + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** The Luce key blade: straight sides that flare out near both ends, ends cut to the bezel's circle. */
function bladeShape(R: number, depth: number, bevel: number) {
  const hw = R * 0.4;
  const flare = 0;
  const rc = R * 0.99; // ends follow the bezel circle
  const yEnd = (x: number) => Math.sqrt(Math.max(0, rc * rc - x * x));
  const half = (y: number) => {
    const t = Math.min(1, Math.max(0, (Math.abs(y) - R * 0.78) / (R * 0.2)));
    return hw + flare * t * t * (3 - 2 * t);
  };
  const s = new THREE.Shape();
  const N = 24;
  const xTop = half(R * 0.95);
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) { const y = -yEnd(xTop) + (2 * yEnd(xTop) * i) / N; pts.push([half(y), y]); }
  for (let i = 1; i < N; i++) { const x = xTop - (2 * xTop * i) / N; pts.push([x, yEnd(x)]); }
  for (let i = 0; i <= N; i++) { const y = yEnd(xTop) - (2 * yEnd(xTop) * i) / N; pts.push([-half(y), y]); }
  for (let i = 1; i < N; i++) { const x = -xTop + (2 * xTop * i) / N; pts.push([x, -yEnd(x)]); }
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 12, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/**
 * The Luce key blade as a fine grid: rounded across its width (superellipse), ends cut to the
 * ring's circle and rounded off, and the whole blade arcing back into the ring at both ends.
 */
function bladeGrid(R: number, hw: number, depth: number, bend: number) {
  const NX = 40, NY = 120, rc = R * 0.99;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NY; j++)
    for (let i = 0; i <= NX; i++) {
      const u = i / NX, v = (j / NY) * 2 - 1;
      const x = (u * 2 - 1) * hw;
      const au0 = Math.abs(x / hw), cc = 0.28;
      const corner = au0 > 1 - cc ? R * 0.12 * (1 - Math.sqrt(Math.max(0, 1 - ((au0 - (1 - cc)) / cc) ** 2))) : 0;
      const yMax = Math.sqrt(Math.max(0, rc * rc - x * x)) - corner;
      const y = v * yMax;
      const au = Math.abs(x / hw), e = 0.3;
      const edge = au < 1 - e ? 1 : Math.sqrt(Math.max(0, 1 - ((au - (1 - e)) / e) ** 2));
      const across = (0.85 + 0.15 * (1 - au * au)) * edge;
      const ends = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v), 6)), 0.45);
      const z = depth * across * ends - bend * (y / R) * (y / R);
      pos.push(x, y, z);
      uv.push(u, (v + 1) / 2);
    }
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 2, d = a + NX + 1;
      idx.push(a, b, c, a, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A domed round button (turned profile), facing +z. */
function dome(r: number, height: number) {
  const pts: THREE.Vector2[] = [];
  const edge = Math.min(r * 0.22, height * 0.9);
  pts.push(new THREE.Vector2(0.001, height));
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2((r - edge) * t, height + 1.5 * (1 - t * t) - 1.5));
  }
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - edge + Math.sin(a) * edge, height - 1.5 - (1 - Math.cos(a)) * (height - 1.5)));
  }
  pts.push(new THREE.Vector2(r, 0));
  const g = new THREE.LatheGeometry(pts, 96);
  g.rotateX(Math.PI / 2);
  return g;
}

function ring(rIn: number, rOut: number, h: number) {
  const g = new THREE.LatheGeometry(
    [
      [rIn, 0],
      [rIn, h * 0.8],
      [rIn + (rOut - rIn) * 0.25, h],
      [rOut - (rOut - rIn) * 0.25, h],
      [rOut, h * 0.8],
      [rOut, 0],
    ].map(([a, b]) => new THREE.Vector2(a, b)),
    128,
  );
  g.rotateX(Math.PI / 2);
  return g;
}

/** Brushed-aluminium bands across the Luce key blade: dark, light, mid, dark. */
function bandTex() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 4;
  const g = c.getContext("2d")!;
  const l = g.createLinearGradient(0, 0, 256, 0);
  [[0, "#6e6f72"], [0.08, "#a9aaad"], [0.2, "#e6e6e8"], [0.5, "#dcdcde"], [0.7, "#b9babc"], [0.9, "#8e8f92"], [1, "#5e5f62"]].forEach(([o, col]) => l.addColorStop(o as number, col as string));
  g.fillStyle = l;
  g.fillRect(0, 0, 256, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Top-lit band for the lever paddle: bright top edge fading to a dark underside. */
function vbandTex() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 128;
  const g = c.getContext("2d")!;
  const l = g.createLinearGradient(0, 0, 0, 128);
  [[0, "#ffffff"], [0.3, "#e4e4e5"], [0.6, "#9c9d9f"], [1, "#3a3a3c"]].forEach(([o, col]) => l.addColorStop(o as number, col as string));
  g.fillStyle = l;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = true;
  return t;
}

type Mats = ReturnType<typeof makeMats>;
function makeMats() {
  const m = {
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xe6e8ea, metalness: 1, roughness: 0.16 }),
    satin: new THREE.MeshPhysicalMaterial({ color: 0x8e9196, metalness: 1, roughness: 0.38 }),
    graphite: new THREE.MeshPhysicalMaterial({ color: 0x1c1c1c, metalness: 0.2, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    well: new THREE.MeshPhysicalMaterial({ color: 0x040404, metalness: 0, roughness: 0.7 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b0b0b, metalness: 0, roughness: 0.18, clearcoat: 0.7, clearcoatRoughness: 0.08, reflectivity: 0.35, envMapIntensity: 0.22 }),
    keyGlass: new THREE.MeshPhysicalMaterial({ color: 0x0c0d0e, metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.62 }),
    red: new THREE.MeshPhysicalMaterial({ color: 0xb3102c, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color(0xff4060) }),
    black: new THREE.MeshBasicMaterial({ color: 0x020202 }),
    // Luce key: brushed satin aluminium, not mirror chrome
    blade: new THREE.MeshPhysicalMaterial({ color: 0xc2c2c2, metalness: 1, roughness: 0.45, anisotropy: 0.5 }),
    bowl: new THREE.MeshPhysicalMaterial({ color: 0xa6a7aa, metalness: 1, roughness: 0.5, envMapIntensity: 1.3 }),
    hubDark: new THREE.MeshStandardMaterial({ color: 0x2e2e30, metalness: 0, roughness: 0.6 }),
    lip: new THREE.MeshPhysicalMaterial({ color: 0xc8c8ca, metalness: 1, roughness: 0.28, envMapIntensity: 1.6 }),
    paddle: new THREE.MeshPhysicalMaterial({ color: 0xd8d8d8, map: vbandTex(), metalness: 1, roughness: 0.45, anisotropy: 0.5 }),
    bladeBands: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: bandTex(), metalness: 1, roughness: 0.4, anisotropy: 0.5, anisotropyRotation: Math.PI / 2, envMapIntensity: 1.15 }),
    slot: new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0, roughness: 0.5, envMapIntensity: 0.05 }),
    // Luce console: black glossy plate with a thin lighter rim
    panel: new THREE.MeshStandardMaterial({ color: 0x141414, emissive: 0x1c1c1c, metalness: 0, roughness: 0.85, envMapIntensity: 0.05 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0, roughness: 0.55 }),
    // toggle, matched to the Blender study (linear colours)
    tRim: capMat(capRim),
    tWell: capMat(capWell),
    tHub: Object.assign(capMat(capHub, true), { map: grainTex() }),
    tBar: Object.assign(capMat(capBar, true), { map: brushTex() }),
    tAlu: capMat(capBar),
    capBlade: Object.assign(capMat(capBlade), { map: grainTex() }),
    capLip: capMat(capLip, true),
    capBowl: capMat(capBowl, true),
  };
  Object.values(m).forEach((x) => (x.side = THREE.DoubleSide));
  m.tBar.side = THREE.FrontSide; // back faces at the bar's silhouette showed as dots
  return m;
}

/** The Luce glass sheen: a hard diagonal, lighter below-left. */
let SHEEN: THREE.Texture | null = null;
function sheenTex() {
  if (SHEEN) return SHEEN;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgba(255,255,255,0)";
  g.fillRect(0, 0, 128, 128);
  g.beginPath();
  g.moveTo(0, 30);
  g.lineTo(128, 128);
  g.lineTo(0, 128);
  g.closePath();
  const lg = g.createLinearGradient(0, 128, 90, 40);
  lg.addColorStop(0, "rgba(255,255,255,0.22)");
  lg.addColorStop(1, "rgba(255,255,255,0.08)");
  g.fillStyle = lg;
  g.fill();
  SHEEN = new THREE.CanvasTexture(c);
  SHEEN.colorSpace = THREE.SRGBColorSpace;
  return SHEEN;
}

/**
 * Painted light ("matcap"), drawn in code: for each direction a surface can face, the exact grey
 * the Luce render shows for it. The camera looks straight on, so this pins the light to the upper
 * left and the gradients to the reference, whatever the part's shape or rotation. Values are
 * sRGB 0-255, measured on the full-size Luce crops (key-luce.jpg, lever-luce.jpg).
 */
const sstep = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const ramp = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + ((vb - va) * (x - a)) / (b - a); }
  return pts[pts.length - 1][1];
};
function capTex(fn: (nx: number, ny: number, nz: number) => number) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      let nx = ((x + 0.5) / S) * 2 - 1, ny = 1 - ((y + 0.5) / S) * 2;
      const d = Math.hypot(nx, ny);
      if (d > 0.999) { nx *= 0.999 / d; ny *= 0.999 / d; }
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const v = Math.max(0, Math.min(255, fn(nx, ny, nz)));
      const i = (y * S + x) * 4;
      img.data[i] = v * 0.99;
      img.data[i + 1] = v;
      img.data[i + 2] = Math.min(255, v * 1.02);
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function capMat(fn: (nx: number, ny: number, nz: number) => number, vertexColors = false) {
  const m = new THREE.MeshMatcapMaterial({ matcap: capTex(fn), vertexColors, toneMapped: false, side: THREE.DoubleSide });
  // orthographic, straight-on camera: every pixel looks along -z
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace("vec3 viewDir = normalize( vViewPosition );", "vec3 viewDir = vec3( 0.0, 0.0, 1.0 );"); };
  return m;
}
/** Fine satin grain for the blade (the Luce metal is bead-blasted, not mirror-smooth). */
function grainTex() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const g = c.getContext("2d")!;
  const img = g.createImageData(128, 512);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 128 * 512; i++) {
    const v = 238 + rnd() * 17;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** Brushed grain for the toggle bar: fine speckle plus faint streaks along its length. */
function brushTex() {
  const c = document.createElement("canvas");
  c.width = 128; // around the bar
  c.height = 256; // along the bar
  const g = c.getContext("2d")!;
  const img = g.createImageData(128, 256);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const GX = 9, GY = 17;
  const grid = Array.from({ length: GX * GY }, () => rnd());
  const at = (i: number, j: number) => grid[(j % GY) * GX + (i % GX)];
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 128; x++) {
      const fx = (x / 128) * (GX - 1), fy = (y / 256) * (GY - 1);
      const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const n = (at(i, j) * (1 - sx) + at(i + 1, j) * sx) * (1 - sy) + (at(i, j + 1) * (1 - sx) + at(i + 1, j + 1) * sx) * sy;
      const v = 222 + n * 22 + rnd() * 11;
      const k = (y * 128 + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.min(255, v);
      img.data[k + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** linear vertex colour that scales a matcap's sRGB value by f */
const vlin = (f: number) => Math.pow(Math.max(0, f), 2.2);
// Key blade: bright where it tilts up to the light, ~178 face, dark where it turns down;
// left half of the face a shade darker; both side edges carry a bright rim (left 212, right 232).
const capBlade = (nx: number, ny: number) => {
  let v = ramp([[-1, 78], [-0.5, 72], [-0.42, 76], [-0.36, 92], [-0.31, 118], [-0.26, 150], [-0.21, 172], [-0.15, 182], [0, 185], [0.2, 186], [0.27, 205], [0.32, 226], [0.45, 234], [1, 230]], ny);
  if (nx < 0) v -= 40 * sstep(0.03, 0.14, -nx) * (1 - sstep(0.28, 0.33, ny)) * sstep(-0.32, -0.15, ny);
  else v -= 10 * sstep(0.08, 0.2, nx) * (1 - sstep(0.3, 0.45, nx));
  const a = Math.abs(nx);
  v += ((nx < 0 ? 210 : 232) - v) * sstep(0.3, 0.6, a);
  v += ((nx < 0 ? 130 : 160) - v) * sstep(0.82, 0.97, a);
  return v;
};
// Chrome lip, read off the reference: crest ~160; slopes facing down or right bright (to ~200),
// facing up or left dim (~105); dark where the tube turns away.
const capLip = (nx: number, ny: number) => {
  const r = Math.hypot(nx, ny);
  const dx = r > 1e-4 ? nx / r : 0, dy = r > 1e-4 ? ny / r : 0;
  const slope = 152 + 45 * (0.7 * dx - 0.7 * dy);
  const v = 172 + (slope - 172) * sstep(0.12, 0.6, r);
  return v + (45 - v) * sstep(0.86, 1, r);
};
// Bowl: plain satin grey; its radial shading comes from vertex colours.
const capBowl = (nx: number, ny: number) => 236 + 18 * (-nx * 0.6 + ny * 0.8);
// Toggle capsule: near-black gloss with a faint lighter top edge.
const capRim = (nx: number, ny: number) => 18 + 16 * sstep(0.3, 0.85, ny) - 6 * sstep(0.3, 0.85, -ny) + 12 * sstep(0.4, 0.85, Math.abs(nx)) + 16 * sstep(0.75, 0.95, Math.hypot(nx, ny));
// Toggle well: black gloss, its top inner wall catching the overhead light, the bottom wall less.
const capWell = (_nx: number, ny: number) => 20 + 18 * sstep(0.15, 0.75, -ny) + 14 * sstep(0.2, 0.8, ny);
// Toggle hub: a flat satin disc ~190-205, a touch lighter toward the top, edge rolling off.
const capHub = (nx: number, ny: number) => ramp([[0, 158], [0.5, 166], [0.8, 180], [0.93, 165], [1, 100]], Math.hypot(nx, ny)) + 40 * ny - 8 * nx;
// Toggle bar (bent slightly round the hub): bright bands near both ends and in the middle,
// darker between, flat ~150 along the top edge, falling to dark along the bottom edge.
const capBar = (nx: number, ny: number) => {
  // along the bar (the bend tilts the face from nx -.29 at the left end to +.29 at the right),
  // read off the reference: bright left end, dark band at 20%, bright at 40%, darker at 70-80%,
  // lighter again near the right end; left end cap lit, right end cap dim
  let v = ramp([[-1, 190], [-0.36, 200], [-0.29, 205], [-0.23, 150], [-0.17, 108], [-0.1, 140], [-0.05, 172], [0.02, 168], [0.1, 145], [0.17, 132], [0.23, 150], [0.27, 182], [0.33, 150], [1, 105]], nx);
  // across the bar: a lit top face with a crisp top line, then the front, a darker lower edge
  // with a faint light rim at the very bottom
  if (ny > 0) v += (-12 * sstep(0.18, 0.26, ny) * (1 - sstep(0.26, 0.32, ny))) + (205 - v) * sstep(0.28, 0.4, ny) + 28 * sstep(0.55, 0.68, ny) * (1 - sstep(0.75, 0.88, ny)) - 90 * sstep(0.9, 1, ny);
  else v += (118 - v) * sstep(0.55, 0.85, -ny) + 55 * sstep(0.86, 0.94, -ny) * (1 - sstep(0.96, 1, -ny));
  return v;
};
/** A soft round glow, used as the light of an LED under black glass. */
let GLOW: THREE.Texture | null = null;
function glowTex() {
  if (GLOW) return GLOW;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.18, "rgba(255,255,255,0.9)");
  r.addColorStop(0.42, "rgba(255,255,255,0.28)");
  r.addColorStop(0.75, "rgba(255,255,255,0.06)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  GLOW = new THREE.CanvasTexture(c);
  GLOW.colorSpace = THREE.SRGBColorSpace;
  return GLOW;
}

/** A stadium (pill) outline, w wide and h tall, as points round the edge. */
function stadium(w: number, h: number, seg = 40): [number, number][] {
  const r = w / 2;
  const cy = h / 2 - r;
  const pts: [number, number][] = [];
  for (let i = 0; i <= seg; i++) { const a = (Math.PI * i) / seg; pts.push([r * Math.cos(a), cy + r * Math.sin(a)]); }
  for (let i = 0; i <= seg; i++) { const a = Math.PI + (Math.PI * i) / seg; pts.push([r * Math.cos(a), -cy + r * Math.sin(a)]); }
  return pts;
}

/**
 * Sweep a profile round a stadium: each [offset, z] is a ring pushed out (or in, if negative)
 * from the w x h stadium at height z. Optional flat floor (closed) or flat ring down to a hole.
 */
function sweep(w: number, h: number, prof: [number, number][], closedLoop = false, hole: [number, number] | null = null, floor = false) {
  const rings = prof.map(([d, z]) => stadium(w + 2 * d, h + 2 * d).map(([x, y]) => [x, y, z] as [number, number, number]));
  if (closedLoop) rings.push(rings[0]);
  const n = rings[0].length;
  const pos: number[] = [];
  const idx: number[] = [];
  rings.forEach((r) => r.forEach((p) => pos.push(...p)));
  for (let k = 0; k < rings.length - 1; k++)
    for (let i = 0; i < n; i++) {
      const a = k * n + i, b = (k + 1) * n + i, c = (k + 1) * n + ((i + 1) % n), d = k * n + ((i + 1) % n);
      idx.push(a, b, c, a, c, d);
    }
  const lastZ = prof[prof.length - 1][1];
  const base = (rings.length - 1) * n;
  if (hole) {
    const hv = stadium(hole[0], hole[1]);
    const o = pos.length / 3;
    hv.forEach(([x, y]) => pos.push(x, y, lastZ));
    for (let i = 0; i < n; i++) idx.push(base + i, o + i, o + ((i + 1) % n), base + i, o + ((i + 1) % n), base + ((i + 1) % n));
  } else if (floor) {
    const c = pos.length / 3;
    pos.push(0, 0, lastZ);
    for (let i = 0; i < n; i++) idx.push(base + i, c, base + ((i + 1) % n));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The soft grey light inside the toggle well: bright round the hub, fading to the ends. */
let WGLOW: THREE.Texture | null = null;
function wellGlowTex() {
  if (WGLOW) return WGLOW;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const img = g.createImageData(128, 128);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 128; x++) {
      const d = Math.hypot((x - 63.5) / 64, (y - 63.5) / 64);
      const v = Math.round(255 * Math.pow(Math.max(0, 1 - d), 2.4));
      const i = (y * 128 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = v;
    }
  g.putImageData(img, 0, 0);
  WGLOW = new THREE.CanvasTexture(c);
  WGLOW.colorSpace = THREE.SRGBColorSpace;
  return WGLOW;
}

type Item = {
  kind: string;
  group: THREE.Group;
  sig: string;
  parts: Record<string, THREE.Object3D>;
  cur: Record<string, number>;
  tgt: Record<string, number>;
  dispose: () => void;
};

/** Soft contact shadow: a dark blurred patch where two parts meet (cheap ambient occlusion). */
function contact(w: number, h: number, opacity: number) {
  const m = new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x000000, transparent: true, opacity, depthWrite: false, toneMapped: false });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  p.renderOrder = 1;
  return p;
}

function led(color: string) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 1, toneMapped: false, side: THREE.DoubleSide });
}

/**
 * The toggle hub is in the bar's shadow below the bar: dark (~45) with a faintly lit rounded rim,
 * as in the reference. The shadow line follows the bar when it flips.
 */
function shadeHub(m: THREE.Object3D, barY: number) {
  const mesh = m as THREE.Mesh;
  if (mesh.userData.lastY !== undefined && Math.abs(mesh.userData.lastY - barY) < 0.15) return;
  mesh.userData.lastY = barY;
  const W = mesh.userData.W as number, HR = mesh.userData.HR as number;
  const g = mesh.geometry as THREE.BufferGeometry;
  const hp = g.attributes.position;
  let col = g.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!col) { col = new THREE.BufferAttribute(new Float32Array(hp.count * 3), 3); g.setAttribute("color", col); }
  const edge = barY - W * 0.1; // just under the bar's lower edge
  for (let i = 0; i < hp.count; i++) {
    const y = hp.getY(i);
    const rr = Math.hypot(hp.getX(i), y) / HR;
    const t = sstep(edge - W * 0.12, edge + W * 0.02, y);
    const dark = 0.24 * (1 + 0.9 * sstep(0.78, 0.95, rr));
    const f = dark + (1 - dark) * t;
    col.setXYZ(i, vlin(f), vlin(f), vlin(f));
  }
  col.needsUpdate = true;
}

function build(kind: string, w: number, h: number, el: HTMLElement, M: Mats): Item {
  const g = new THREE.Group();
  const parts: Item["parts"] = {};
  const own: (THREE.BufferGeometry | THREE.Material)[] = [];
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, z: number, name?: string, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.z = z;
    m.castShadow = shadow;
    m.receiveShadow = true;
    g.add(m);
    own.push(geo);
    if (name) parts[name] = m;
    return m;
  };
  const color = el.dataset.color || "#FFFFFF";
  if (kind === "lever") {
    // Proportions measured on the full-size Luce crop (W = well width): frame 1.16W x 2.05W,
    // well W x 1.75W, satin hub radius .42W, bar 1.25W x .32W sitting .075W below the hub centre.
    // All shading is painted light (see capRim .. capBar), light from the upper left.
    const W = w;
    const WH = W * 1.75;
    const z0 = 22; // the console face, in front of the page panel
    // frame: a soft dark cushion from the outer edge down into the well
    add(sweep(W, WH, [[W * 0.08, -W * 0.02], [W * 0.075, W * 0.01], [W * 0.06, W * 0.03], [W * 0.035, W * 0.04], [W * 0.012, W * 0.03], [0, 0], [-W * 0.005, -W * 0.03]]), M.tRim, z0, undefined, false);
    // well walls, then a floor painted with the reference's soft light (top wall lit, bottom less)
    const wd = W * 0.3;
    add(sweep(W * 0.99, WH * 0.99, [[0, -W * 0.03], [-W * 0.015, -wd * 0.4], [-W * 0.03, -wd * 0.8], [-W * 0.035, -wd]]), M.tWell, z0, undefined, false);
    {
      const fw = W * 0.92, fh = WH * 0.95;
      const sp = stadium(fw, fh, 40);
      const shp = new THREE.Shape(sp.map(([x, y]) => new THREE.Vector2(x, y)));
      const fg = new THREE.ShapeGeometry(shp, 24);
      fitUV(fg, fw, fh);
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 128;
      const cg = c.getContext("2d")!;
      const img = cg.createImageData(64, 128);
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 64; x++) {
          const ty = 1 - ((y + 0.5) / 128) * 2, tx = ((x + 0.5) / 64) * 2 - 1;
          // ty, tx in well units: the hub (radius .43W) sits at the centre; a soft haze lights the
          // floor just above it (~165 at its rim) and, fainter, just below it
          const yy = ty * (fh / 2) / W, xx = tx * (fw / 2) / W;
          const across = Math.exp(-((xx / 0.7) ** 2));
          const above = Math.exp(-(((yy - 0.4) / 0.2) ** 2)) * (0.8 + 0.2 * sstep(0.3, 0.5, yy));
          const below = Math.exp(-(((yy + 0.48) / 0.1) ** 2));
          const v = ramp([[-1, 16], [-0.85, 26], [-0.5, 36], [0, 30], [0.5, 34], [0.85, 30], [1, 20]], ty) * (1 - 0.4 * tx * tx) + 135 * above * across + 70 * below * across;
          const i = (y * 64 + x) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
      cg.putImageData(img, 0, 0);
      const ft = new THREE.CanvasTexture(c);
      ft.colorSpace = THREE.SRGBColorSpace;
      const fm = new THREE.MeshBasicMaterial({ map: ft, toneMapped: false });
      own.push(fg, fm);
      const fl = new THREE.Mesh(fg, fm);
      fl.position.z = z0 - wd;
      g.add(fl);
    }
    // hub: a low satin disc, its lower half in the bar's shadow
    const HR = W * 0.43;
    const hg = new THREE.SphereGeometry(HR, 96, 48);
    hg.scale(1, 1, 0.6);
    {
      const hp = hg.attributes.position;
      const col = new Float32Array(hp.count * 3);
      for (let i = 0; i < hp.count; i++) {
        const y = hp.getY(i) / W;
        const rr = Math.hypot(hp.getX(i), hp.getY(i)) / HR;
        // lower half in the bar's shadow, its rounded rim catching a little light (a crescent)
        const f = 1 + 0 * y * rr;
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = vlin(f);
      }
      hg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    const hubMesh = add(hg, M.tHub, z0 - wd, "hub");
    hubMesh.userData.W = W;
    hubMesh.userData.HR = HR;
    shadeHub(hubMesh, 0);
    const pad = new THREE.Group();
    const L = W * 1.3;
    const e = W * 0.06;
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 10; i++) { const t = (i / 10) * (Math.PI / 2); prof.push(new THREE.Vector2(0.5 * Math.pow(Math.sin(t), 0.6) + 0.0001, -L / 2 + e * (1 - Math.cos(t)))); }
    // enough rings along the length for the bend to shape the light bands
    for (let i = 1; i < 40; i++) prof.push(new THREE.Vector2(0.5001, -L / 2 + e + ((L - 2 * e) * i) / 40));
    for (let i = 0; i <= 10; i++) { const t = (Math.PI / 2) * (1 - i / 10); prof.push(new THREE.Vector2(0.5 * Math.pow(Math.sin(t), 0.6) + 0.0001, L / 2 - e * (1 - Math.cos(t)))); }
    const bar = new THREE.LatheGeometry(prof, 96, Math.PI);
    bar.rotateZ(-Math.PI / 2);
    // squircle cross-section: a flat face with rounded top and bottom edges, not a tube
    {
      const bp = bar.attributes.position;
      for (let i = 0; i < bp.count; i++) {
        const y = bp.getY(i), z = bp.getZ(i);
        const t = Math.atan2(z, y);
        const k = Math.pow(Math.pow(Math.abs(Math.cos(t)), 3) + Math.pow(Math.abs(Math.sin(t)), 3), -1 / 3);
        bp.setY(i, y * k);
        bp.setZ(i, z * k);
      }
    }
    bar.scale(1, W * 0.36, W * 0.18);
    // bent back slightly toward both ends, round the hub
    {
      const bp = bar.attributes.position;
      for (let i = 0; i < bp.count; i++) {
        const u = bp.getX(i) / (L / 2);
        bp.setZ(i, bp.getZ(i) - W * 0.1 * u * u);
      }
    }
    bar.computeVertexNormals();
    {
      const bp = bar.attributes.position;
      const col = new Float32Array(bp.count * 3).fill(1);
      bar.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    own.push(bar);
    const pm = new THREE.Mesh(bar, M.tBar);
    pm.castShadow = true;
    pad.add(pm);
    const stem = new THREE.CylinderGeometry(W * 0.12, W * 0.12, W * 0.6, 32);
    stem.rotateX(Math.PI / 2);
    own.push(stem);
    const sm = new THREE.Mesh(stem, M.tWell);
    sm.position.set(0, 0, -W * 0.4);
    // the bar's soft shadow on the hub just below it
    pad.position.z = z0 + W * 0.3;
    g.add(pad);
    parts.pad = pad;
  } else if (kind === "panel") {
    add(slab(w, h, 6, 3, 22), M.panel, -14, undefined, false);
    add(slab(w + 3, h + 3, 4, 2, 23.5), M.rim, -16, undefined, false);
  } else if (kind === "rotary") {
    // Measured on the full-size Luce crop (R = outer radius of the chrome lip):
    // black hole to .53R, satin grey bowl .53-.72R (~105), dark groove .74-.81R (~48),
    // broad chrome lip .83-.99R, then straight into the black console (no bezel).
    // Blade .78R wide, ends at .98R, slot .14R x 1.01R, pure black.
    const R = Math.min(w, h) / 2;
    const lathe = (pts: [number, number][]) => {
      const g2 = new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a * R, b * R)), 160);
      g2.rotateX(Math.PI / 2);
      return g2;
    };
    // lip profile (r, z): a thin bright bead at .86R, a dark notch, then the main chrome tube
    // .88-1.0R with its crest on the inner side, as on the reference
    const torus: [number, number][] = [[0.852, -0.01], [0.857, 0.01], [0.864, 0.022], [0.871, 0.016], [0.878, 0.008], [0.885, 0.035], [0.892, 0.058], [0.905, 0.07], [0.925, 0.074], [0.95, 0.066], [0.97, 0.05], [0.985, 0.03], [0.995, 0.008], [1.0, -0.02]];
    const lipG = lathe(torus);
    {
      const lp = lipG.attributes.position;
      const col = new Float32Array(lp.count * 3);
      for (let i = 0; i < lp.count; i++) {
        const th = Math.atan2(lp.getY(i), lp.getX(i));
        const rr = Math.hypot(lp.getX(i), lp.getY(i)) / R;
        const f = (0.72 + 0.48 * Math.pow(Math.max(0, Math.cos(th + (60 * Math.PI) / 180)), 4) + 0.42 * Math.pow(Math.max(0, Math.cos(th - (135 * Math.PI) / 180)), 4)) * (rr < 0.876 ? 1.06 : 1);
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = vlin(f);
      }
      lipG.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    add(lipG, M.capLip, 0, undefined, false);
    const bowl = lathe([[0.853, -0.01], [0.81, 0.0], [0.77, -0.02], [0.73, -0.04], [0.66, -0.06], [0.58, -0.08], [0.535, -0.09], [0.53, -0.2]]);
    {
      const bp = bowl.attributes.position;
      const col = new Float32Array(bp.count * 3);
      for (let i = 0; i < bp.count; i++) {
        const r = Math.hypot(bp.getX(i), bp.getY(i)) / R;
        const f = ramp([[0.53, 0.38], [0.56, 0.41], [0.6, 0.42], [0.65, 0.49], [0.7, 0.47], [0.74, 0.36], [0.8, 0.32], [0.83, 0.25], [0.855, 0.22]], r);
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = vlin(f);
      }
      bowl.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    add(bowl, M.capBowl, 0, undefined, false);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(R * 0.535, 96), M.black);
    own.push(hole.geometry);
    hole.position.z = -R * 0.19;
    g.add(hole);
    const key = new THREE.Group();
    // the blade arcs back into the ring at both ends: the top end tilts up into the light
    // (bright), the bottom end turns away (dark), exactly as on the Luce key
    const bar = bladeGrid(R, R * 0.39, R * 0.16, R * 0.26);
    own.push(bar);
    const bm = new THREE.Mesh(bar, M.capBlade);
    bm.castShadow = false;
    key.add(bm);
    const slot = new THREE.Shape();
    {
      const sw = R * 0.078, sh = R * 0.515 - sw;
      slot.moveTo(-sw, -sh);
      slot.lineTo(-sw, sh);
      slot.absarc(0, sh, sw, Math.PI, 0, true);
      slot.lineTo(sw, -sh);
      slot.absarc(0, -sh, sw, 0, Math.PI, true);
    }
    const sg = new THREE.ShapeGeometry(slot, 24);
    own.push(sg);
    const sl = new THREE.Mesh(sg, M.black);
    sl.position.z = R * 0.17;
    key.add(sl);
    // the blade shades the lip right beside it where it crosses the ring, top and bottom
    for (const sy of [1, -1]) {
      const ks = contact(R * 1.05, R * 0.42, 0.75);
      ks.position.set(R * 0.02, sy * R * 0.9, -R * 0.33);
      key.add(ks);
      own.push(ks.geometry, ks.material as THREE.Material);
    }
    key.position.z = R * 0.42;
    g.add(key);
    parts.key = key;
  } else if (kind === "sos") {
    add(slab(w + 12, h + 12, 2, 2), M.well, 1, undefined, false);
    add(slab(w + 12, h + 12, 1, 1.5), M.graphite, -0.5, undefined, false);
    add(slab(w, h, 8, 6), M.glass, 8);
  } else if (kind === "glass") {
    const round = Math.abs(w - h) < 6;
    if (round) {
      const R = Math.min(w, h) / 2;
      add(ring(R * 0.94, R + 2, 4), M.graphite, 0, undefined, false);
      add(dome(R * 0.95, 10), M.glass, 1);
      const sm = new THREE.MeshBasicMaterial({ map: sheenTex(), transparent: true, depthWrite: false, toneMapped: false });
      own.push(sm);
      const sg = new THREE.CircleGeometry(R * 0.86, 64);
      own.push(sg);
      const sh = new THREE.Mesh(sg, sm);
      sh.position.z = 12.5;
      g.add(sh);
    } else {
      add(slab(w + 4, h + 4, 2, 2), M.graphite, 1, undefined, false);
      add(slab(w, h, 8, 6), M.glass, 7);
    }
    const lit = new THREE.Mesh(round ? ring(Math.min(w, h) / 2 + 3, Math.min(w, h) / 2 + 5, 1) : slab(w + 10, h + 10, 0.5, 0.5), led(color));
    lit.position.z = round ? 3 : 0;
    lit.visible = false;
    g.add(lit);
    parts.lit = lit;
  } else if (kind === "track") {
    add(slab(w + 6, h + 6, 2, 2), M.graphite, 1, undefined, false);
    add(slab(w, h, 2, 2), M.well, 2.5, undefined, false);
    add(slab(w - 2, h - 2, 3, 2.5), M.glass, 3);
  } else if (kind === "knob") {
    const R = Math.min(w, h) / 2;
    add(ring(R * 0.96, R + 2.5, 5), M.graphite, 3);
    add(dome(R * 0.97, 12), M.red, 4);
  } else if (kind === "key") {
    add(slab(w + 2, h + 2, 1.5, 1.5, 11), M.well, 0.5, undefined, false);
    const body = add(slab(w, h, 9, 4, 10), M.glass, 5);
    parts.body = body;
    const gm = new THREE.MeshBasicMaterial({ map: glowTex(), color: new THREE.Color(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    own.push(gm);
    const gp = new THREE.PlaneGeometry(w * 1.1, h * 1.0);
    own.push(gp);
    const glow = new THREE.Group();
    const halo = new THREE.Mesh(gp, gm);
    halo.position.z = 14;
    glow.add(halo);
    // crisp lit lens in the middle of the key, like a Luce indicator
    const core = new THREE.Mesh(slab(w * 0.34, h * 0.42, 1, 0.5), led(color));
    own.push(core.geometry, core.material as THREE.Material);
    core.position.z = 14.5;
    glow.add(core);
    g.add(glow);
    parts.led = glow;
    parts.halo = halo;
    const sel = new THREE.Mesh(slab(w + 7, h + 7, 0.5, 0.5, 13), led("#FFFFFF"));
    sel.position.z = 0;
    sel.visible = false;
    g.add(sel);
    parts.sel = sel;
  }
  return {
    kind,
    group: g,
    sig: "",
    parts,
    cur: {},
    tgt: {},
    dispose: () => own.forEach((o) => o.dispose()),
  };
}

export function Luce3DLayerV12({ children, className = "" }: { children: ReactNode; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!host.current || !cv.current || !hasWebGL()) return;
    const box = host.current;
    const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    R.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    R.toneMapping = THREE.AgXToneMapping;
    R.toneMappingExposure = 1.0;
    R.outputColorSpace = THREE.SRGBColorSpace;
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.VSMShadowMap;
    R.setClearColor(0x000000, 0);
    cv.current.appendChild(R.domElement);
    Object.assign(R.domElement.style, { display: "block", width: "100%", height: "100%" });

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000);
    cam.position.z = 1000;
    const pm = new THREE.PMREMGenerator(R);
    let envReady = false;
    let envTex: THREE.Texture | null = null;
    let disposed = false;
    // Product-photo studio built in code: a black room with large soft boxes.
    // Brushed metal picks up long soft gradients from them, like the Luce renders.
    {
      const room = new THREE.Scene();
      // Same studio as the Blender study: near-black room, one huge soft box overhead and in
      // front (lights the tops of metal parts, leaves their undersides dark), a faint one behind.
      room.background = new THREE.Color(0.004, 0.004, 0.004);
      const box = (w: number, h: number, x: number, y: number, z: number, k: number) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide }));
        m.position.set(x, y, z);
        room.add(m);
      };
      box(7, 13, -2.6, 6.0, 2.5, 1.5); // bright strip, upper left: the Luce key light
      box(9, 13, -8.6, 6.0, 2.5, 0.55);
      box(9, 13, 7.4, 6.0, 2.5, 0.4);
      box(24, 10, 0, -6, 2.5, 0.04);
      envTex = pm.fromScene(room, 0).texture;
      scene.environment = envTex;
      envReady = true;
    }
    scene.environmentIntensity = 1.0;
    scene.add(new THREE.AmbientLight(0xffffff, 0.04));
    // only for soft shadows: kept weak so it does not add a hot spot to the metal
    const key = new THREE.DirectionalLight(0xffffff, 0.12);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 8;
    key.shadow.blurSamples = 12;
    key.shadow.bias = -0.0006;
    scene.add(key);
    scene.add(key.target);
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.55 }));
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const M = makeMats();
    // scene.environment ignores envMapIntensity, so give each material the map itself
    Object.values(M).forEach((m) => {
      if ("envMap" in m && envTex) (m as THREE.MeshStandardMaterial).envMap = envTex;
    });
    const items = new Map<HTMLElement, Item>();
    let W = 0;
    let H = 0;
    let dirty = true;
    let visible = false;

    const resize = () => {
      const r = box.getBoundingClientRect();
      if (Math.round(r.width) === W && Math.round(r.height) === H) return;
      W = Math.round(r.width);
      H = Math.round(r.height);
      R.setSize(W, H, false);
      Object.assign(cam, { left: 0, right: W, top: 0, bottom: -H });
      cam.updateProjectionMatrix();
      shadowPlane.scale.set(W, H, 1);
      shadowPlane.position.set(W / 2, -H / 2, -1);
      key.position.set(W / 2 - 400, -H / 2 + 700, 900);
      key.target.position.set(W / 2, -H / 2, 0);
      const s = key.shadow.camera;
      const half = Math.max(W, H) * 0.8;
      Object.assign(s, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 3000 });
      s.updateProjectionMatrix();
      dirty = true;
    };

    const sync = () => {
      const base = box.getBoundingClientRect();
      const seen = new Set<HTMLElement>();
      box.querySelectorAll<HTMLElement>("[data-3d]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || !el.offsetParent) return;
        seen.add(el);
        const kind = el.dataset["3d"]!;
        const w = el.offsetWidth || Math.round(r.width);
        const h = el.offsetHeight || Math.round(r.height);
        const shape = `${kind}|${w}|${h}|${el.dataset.color ?? ""}`;
        let it = items.get(el);
        if (!it || it.sig !== shape) {
          if (it) {
            scene.remove(it.group);
            it.dispose();
          }
          it = build(kind, w, h, el, M);
          it.sig = shape;
          items.set(el, it);
          scene.add(it.group);
          dirty = true;
        }
        const x = r.left - base.left + r.width / 2;
        const y = -(r.top - base.top + r.height / 2);
        if (it.group.position.x !== x || it.group.position.y !== y) {
          it.group.position.set(x, y, 0);
          dirty = true;
        }
        const on = el.dataset.on === "1";
        const op = parseFloat(el.style.opacity || "1");
        if (kind === "lever") { it.tgt.flip = on ? 1 : 0; it.cur.travel = it.tgt.travel = h * 0.24; }
        if (kind === "rotary") it.tgt.rot = (-(parseFloat(el.dataset.angle || "0")) * Math.PI) / 180;
        if (kind === "glass") it.parts.lit.visible = on;
        if (kind === "key") {
          const ledOn = !!el.dataset.color;
          it.parts.led.visible = ledOn;
          ((it.parts.halo as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * op;
          (((it.parts.led as THREE.Group).children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = op;
          it.parts.body.visible = true;
          it.parts.sel.visible = on;
        }
        it.group.scale.setScalar(Math.max(0.01, r.width / Math.max(1, w)));
        if (kind === "knob") it.group.visible = op > 0.5;
      });
      items.forEach((it, el) => {
        if (!seen.has(el)) {
          scene.remove(it.group);
          it.dispose();
          items.delete(el);
          dirty = true;
        }
      });
    };

    const animate = () => {
      let moving = false;
      items.forEach((it) => {
        for (const k of Object.keys(it.tgt)) {
          const c = it.cur[k] ?? it.tgt[k];
          const t = it.tgt[k];
          const n = Math.abs(t - c) < 0.002 ? t : c + (t - c) * 0.22;
          if (n !== c || it.cur[k] === undefined) moving = true;
          it.cur[k] = n;
        }
        if (it.kind === "lever") {
          const f = it.cur.flip ?? 0;
          const pad = it.parts.pad;
          pad.position.y = (f - 1) * it.cur.travel;
          pad.rotation.x = (f - 1) * -0.12;
          shadeHub(it.parts.hub, pad.position.y);
        }
        if (it.kind === "rotary") it.parts.key.rotation.z = it.cur.rot ?? 0;
      });
      return moving;
    };

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      resize();
      sync();
      if (animate()) dirty = true;
      if (dirty && envReady) {
        R.render(scene, cam);
        dirty = false;
      }
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "200px" });
    io.observe(box);
    setOn(true);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      items.forEach((it) => it.dispose());
      Object.values(M).forEach((m) => m.dispose());
      pm.dispose();
      R.dispose();
      R.domElement.remove();
      setOn(false);
    };
  }, []);

  return (
    <div ref={host} className={`relative ${on ? "nb-3d-on" : ""} ${className}`}>
      {children}
      <div ref={cv} aria-hidden className="pointer-events-none absolute inset-0 z-[5]" />
    </div>
  );
}
