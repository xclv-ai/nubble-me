import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/*
 * /founders-v11 version of the Luce 3D layer (v10's stays in founders-luce-3d.tsx, unchanged).
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
  const hw = R * 0.34;
  const flare = R * 0.03;
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
  [[0, "#8a8a8c"], [0.12, "#b4b5b8"], [0.3, "#ffffff"], [0.42, "#f2f2f3"], [0.6, "#b8b8ba"], [0.72, "#7a7b7e"], [1, "#5a5a5c"]].forEach(([o, col]) => l.addColorStop(o as number, col as string));
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
    bowl: new THREE.MeshPhysicalMaterial({ color: 0x6a6b6d, metalness: 1, roughness: 0.38, envMapIntensity: 1.0 }),
    hubDark: new THREE.MeshStandardMaterial({ color: 0x2e2e30, metalness: 0, roughness: 0.6 }),
    lip: new THREE.MeshPhysicalMaterial({ color: 0xdedede, metalness: 1, roughness: 0.2, envMapIntensity: 2.0 }),
    paddle: new THREE.MeshPhysicalMaterial({ color: 0xd8d8d8, map: vbandTex(), metalness: 1, roughness: 0.45, anisotropy: 0.5 }),
    bladeBands: new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: bandTex(), metalness: 1, roughness: 0.42, anisotropy: 0.5, anisotropyRotation: Math.PI / 2, envMapIntensity: 1.6 }),
    slot: new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0, roughness: 0.5, envMapIntensity: 0.05 }),
    // Luce console: black glossy plate with a thin lighter rim
    panel: new THREE.MeshStandardMaterial({ color: 0x141414, emissive: 0x1c1c1c, metalness: 0, roughness: 0.85, envMapIntensity: 0.05 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0, roughness: 0.55 }),
    // toggle, matched to the Blender study (linear colours)
    tRim: new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(0.02, 0.02, 0.021), metalness: 0, roughness: 0.62, specularIntensity: 0.5 }),
    tWell: new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(0.025, 0.025, 0.026), metalness: 0, roughness: 0.55, envMapIntensity: 0.3 }),
    tHub: new THREE.MeshPhysicalMaterial({ vertexColors: true, color: new THREE.Color().setRGB(0.7, 0.7, 0.71), metalness: 1, roughness: 0.34 }),
    tBar: new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(0.9, 0.9, 0.91), vertexColors: true, metalness: 1, roughness: 0.32, anisotropy: 0.6, envMapIntensity: 1.0 }),
    tAlu: new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(0.8, 0.8, 0.81), metalness: 1, roughness: 0.3, envMapIntensity: 0.9 }),
  };
  Object.values(m).forEach((x) => (x.side = THREE.DoubleSide));
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
    // Modelled first in Blender against the Luce reference, then rebuilt here with the same
    // measurements (W = slot width): soft raised collar, shallow cup, glossy well with a grey
    // glow, a wide low satin hub, and a round-section aluminium bar wider than the slot.
    const W = w;
    const z0 = 22; // the console face, in front of the page panel
    add(sweep(W * 1.2, h * 1.1, Array.from({ length: 25 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2;
      return [W * 0.06 * Math.cos(a), W * 0.036 * Math.sin(a) - W * 0.012] as [number, number];
    }), true), M.tRim, z0, undefined, false);
    add(sweep(W * 1.3, h * 1.15, [[0, 0], [-W * 0.03, -W * 0.012], [-W * 0.07, -W * 0.03], [-W * 0.11, -W * 0.045], [-(W * 1.3 - W) / 2, -W * 0.05]], false, [W * 0.94, h * 0.97 - W * 0.06]), M.tRim, z0, undefined, false);
    const wd = W * 0.32;
    add(sweep(W, h * 0.97, [[0, 0], [-W * 0.02, -wd * 0.3], [-W * 0.04, -wd * 0.7], [-W * 0.05, -wd]], false, null, true), M.tWell, z0 - W * 0.03, undefined, false);
    const gm = new THREE.MeshBasicMaterial({ map: wellGlowTex(), color: new THREE.Color(1.5, 1.5, 1.5), opacity: 0.85, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    own.push(gm);
    const gp = new THREE.PlaneGeometry(W * 2.2, W * 2.8);
    own.push(gp);
    const glow = new THREE.Mesh(gp, gm);
    glow.position.set(0, W * 0.3, z0 - W * 0.03 - wd + 0.4);
    g.add(glow);
    const hg = new THREE.SphereGeometry(W * 0.52, 96, 48);
    hg.scale(1, 1, 0.3);
    // the lower half sits in the bar's shadow: darken it smoothly, as in the reference
    {
      const hp = hg.attributes.position;
      const col = new Float32Array(hp.count * 3);
      for (let i = 0; i < hp.count; i++) {
        const t = hp.getY(i) / (W * 0.52);
        const k = 0.3 + 0.7 / (1 + Math.exp(-(t + 0.05) * 14));
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
      }
      hg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    add(hg, M.tHub, z0 - W * 0.13);
    const pad = new THREE.Group();
    const L = W * 1.42;
    const e = W * 0.1;
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 8; i++) { const t = (i / 8) * (Math.PI / 2); prof.push(new THREE.Vector2(0.5 * Math.sin(t) + 0.0001, -L / 2 + e * (1 - Math.cos(t)))); }
    for (let i = 0; i <= 8; i++) { const t = (Math.PI / 2) * (1 - i / 8); prof.push(new THREE.Vector2(0.5 * Math.sin(t) + 0.0001, L / 2 - e * (1 - Math.cos(t)))); }
    const bar = new THREE.LatheGeometry(prof, 64);
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
      bar.computeVertexNormals();
    }
    bar.scale(1, W * 0.42, W * 0.2);
    // brushed-metal shading the light alone cannot give: bright top edge, light upper band,
    // darker lower third, darker rounded ends
    {
      const bp = bar.attributes.position;
      const col = new Float32Array(bp.count * 3);
      for (let i = 0; i < bp.count; i++) {
        const v = bp.getY(i) / (W * 0.21); // -1 bottom .. 1 top
        const u = Math.abs(bp.getX(i)) / (L / 2); // 0 middle .. 1 end
        const sm = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
        let k = 0.22 + 0.3 * sm(-0.6, -0.1, v) + 0.22 * sm(0.0, 0.5, v) + 0.26 * sm(0.7, 0.92, v);
        k *= 1 - 0.65 * Math.pow(Math.max(0, (u - 0.62) / 0.38), 1.2);
        col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
      }
      bar.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    own.push(bar);
    const pm = new THREE.Mesh(bar, M.tBar);
    pm.castShadow = true;
    pad.add(pm);
    const stem = new THREE.CylinderGeometry(W * 0.13, W * 0.13, W * 0.4, 32);
    stem.rotateX(Math.PI / 2);
    own.push(stem);
    const sm = new THREE.Mesh(stem, M.tAlu);
    sm.position.z = -W * 0.22;
    pad.add(sm);
    // the bar's soft shadow on the lower half of the hub
    const ps = contact(W * 1.05, W * 0.6, 0.35);
    ps.position.set(0, -W * 0.28, -W * 0.04);
    pad.add(ps);
    own.push(ps.geometry, ps.material as THREE.Material);
    pad.position.z = z0 + W * 0.1;
    g.add(pad);
    parts.pad = pad;
  } else if (kind === "panel") {
    add(slab(w, h, 6, 3, 22), M.panel, -14, undefined, false);
    add(slab(w + 3, h + 3, 4, 2, 23.5), M.rim, -16, undefined, false);
  } else if (kind === "rotary") {
    // Measured from the Luce reference (R = outer radius): chrome lip R .95-1, satin bowl
    // sloping in to a black hole at .56R; satin blade .81R wide, 2R tall; slot .14R x 1.07R.
    const R = Math.min(w, h) / 2;
    const lip = new THREE.LatheGeometry(
      [
        [R * 0.8, 0], [R * 0.82, 4], [R * 0.88, 7.5], [R * 0.95, 8.5], [R * 1.0, 6], [R * 1.03, 2], [R * 1.04, 0],
      ].map(([a, b]) => new THREE.Vector2(a, b)),
      128,
    );
    lip.rotateX(Math.PI / 2);
    add(lip, M.lip, -2);
    const bowl = new THREE.LatheGeometry(
      [
        [R * 0.66, -1], [R * 0.66, 0.5], [R * 0.7, 2], [R * 0.72, 3.2], [R * 0.8, 4.2], [R * 0.81, 2],
      ].map(([a, b]) => new THREE.Vector2(a, b)),
      128,
    );
    bowl.rotateX(Math.PI / 2);
    add(bowl, M.bowl, -2);
    add(dome(R * 0.67, 0.5), M.black, -3, undefined, false);
    const key = new THREE.Group();
    // big edge radius, then squashed in depth: the face curves across like the Luce blade
    // runs the full diameter, ends sitting on the bezel; brushed bands give the cylinder look
    const bar = fitUV(bladeShape(R, R * 0.12, R * 0.07), R * 0.88, R * 2.0);
    own.push(bar);
    const bm = new THREE.Mesh(bar, M.bladeBands);
    bm.castShadow = false;
    key.add(bm);
    const slot = slab(R * 0.09, R * 1.07, 1, 0.3);
    own.push(slot);
    const sl = new THREE.Mesh(slot, M.black);
    sl.position.z = R * 0.155;
    key.add(sl);
    const sg = new THREE.Mesh(fitUV(slab(R * 0.09, R * 0.98, 0.5, 0.2), R * 0.09, R * 0.98), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x555555, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    own.push(sg.geometry, sg.material as THREE.Material);
    sg.position.z = R * 0.17;
    key.add(sg);
    const ks = contact(R * 1.25, R * 2.25, 0.85);
    ks.position.set(R * 0.06, -R * 0.05, -7.5);
    key.add(ks);
    own.push(ks.geometry, ks.material as THREE.Material);
    key.position.z = 10;
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

export function Luce3DLayerV11({ children, className = "" }: { children: ReactNode; className?: string }) {
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
      box(7, 13, -0.6, 6.0, 2.5, 1.5); // bright centre strip, slightly left
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
          // redraw when the picked square changes, or the white frame stays on the old square
          if (it.parts.sel.visible !== on || it.cur.op !== op) dirty = true;
          it.cur.op = op;
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
          pad.rotation.x = (f - 1) * -0.5;
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
