import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/*
 * Real 3D for the Luce controls on /founders-v10 (owner, 2 Nov 2026: "cheap gradients, not 3D").
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

const HDR = "/fx/studio_small_09_1k.hdr";

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

type Mats = ReturnType<typeof makeMats>;
function makeMats() {
  const m = {
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xe6e8ea, metalness: 1, roughness: 0.16 }),
    satin: new THREE.MeshPhysicalMaterial({ color: 0x8e9196, metalness: 1, roughness: 0.38 }),
    graphite: new THREE.MeshPhysicalMaterial({ color: 0x1b1c1e, metalness: 0.2, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    well: new THREE.MeshPhysicalMaterial({ color: 0x040404, metalness: 0, roughness: 0.7 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: 0, roughness: 0.18, clearcoat: 0.7, clearcoatRoughness: 0.08, reflectivity: 0.35, envMapIntensity: 0.22 }),
    keyGlass: new THREE.MeshPhysicalMaterial({ color: 0x0c0d0e, metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.62 }),
    red: new THREE.MeshPhysicalMaterial({ color: 0xb3102c, metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color(0xff4060) }),
    black: new THREE.MeshBasicMaterial({ color: 0x020202 }),
    // Luce key: brushed satin aluminium, not mirror chrome
    blade: new THREE.MeshPhysicalMaterial({ color: 0xd2d5d9, metalness: 1, roughness: 0.3 }),
    bowl: new THREE.MeshPhysicalMaterial({ color: 0x6d7075, metalness: 1, roughness: 0.34 }),
    // Luce console: black glossy plate with a thin lighter rim
    panel: new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0, roughness: 0.55, envMapIntensity: 0.25 }),
    rim: new THREE.MeshPhysicalMaterial({ color: 0x3a3c40, metalness: 0.6, roughness: 0.35 }),
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

type Item = {
  kind: string;
  group: THREE.Group;
  sig: string;
  parts: Record<string, THREE.Object3D>;
  cur: Record<string, number>;
  tgt: Record<string, number>;
  dispose: () => void;
};

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
    // Luce toggle: glossy black capsule slot with a thin lit rim, a dark round boss,
    // and a flat satin paddle a little wider than the slot.
    add(slab(w + 4, h + 4, 2, 1.5), M.rim, 0, undefined, false);
    add(slab(w, h, 3, 2.5), M.glass, 2);
    add(dome(w * 0.43, 10), M.satin, 3);
    const pad = new THREE.Group();
    const bar = new RoundedBoxGeometry(w * 1.2, w * 0.36, w * 0.4, 5, w * 0.07);
    own.push(bar);
    const pm = new THREE.Mesh(bar, M.blade);
    pm.scale.z = 0.6;
    pm.castShadow = true;
    pad.add(pm);
    const stem = new THREE.CylinderGeometry(w * 0.13, w * 0.17, 12, 32);
    stem.rotateX(Math.PI / 2);
    own.push(stem);
    const sm = new THREE.Mesh(stem, M.bowl);
    sm.position.z = -6;
    pad.add(sm);
    pad.position.z = 14;
    g.add(pad);
    parts.pad = pad;
  } else if (kind === "panel") {
    add(slab(w, h, 6, 3, 22), M.panel, -14, undefined, false);
    add(slab(w + 3, h + 3, 4, 2, 23.5), M.rim, -16, undefined, false);
  } else if (kind === "rotary") {
    // Measured from the Luce reference (R = outer radius): chrome lip R .95-1, satin bowl
    // sloping in to a black hole at .56R; satin blade .81R wide, 2R tall; slot .14R x 1.07R.
    const R = Math.min(w, h) / 2;
    const plate = add(slab(R * 3.1, R * 2.5, 6, 3, R * 0.55), M.panel, -10, undefined, false);
    plate.receiveShadow = true;
    add(slab(R * 3.1 + 3, R * 2.5 + 3, 4, 2, R * 0.55 + 1.5), M.rim, -12, undefined, false);
    add(dome(R * 1.03, 2), M.well, -6, undefined, false);
    const lip = new THREE.LatheGeometry(
      [
        [R * 0.9, 0], [R * 0.93, 5], [R * 0.965, 7.5], [R, 6.5], [R * 1.02, 3], [R * 1.02, 0],
      ].map(([a, b]) => new THREE.Vector2(a, b)),
      128,
    );
    lip.rotateX(Math.PI / 2);
    add(lip, M.chrome, -2);
    const bowl = new THREE.LatheGeometry(
      [
        [R * 0.56, -1], [R * 0.56, 1], [R * 0.66, 2.5], [R * 0.78, 4], [R * 0.9, 5.5], [R * 0.93, 5],
      ].map(([a, b]) => new THREE.Vector2(a, b)),
      128,
    );
    bowl.rotateX(Math.PI / 2);
    add(bowl, M.bowl, -2);
    add(dome(R * 0.57, 0.5), M.black, -3, undefined, false);
    const key = new THREE.Group();
    // big edge radius, then squashed in depth: the face curves across like the Luce blade
    const bar = new RoundedBoxGeometry(R * 0.81, R * 2.0, R * 0.62, 10, R * 0.3);
    own.push(bar);
    const bm = new THREE.Mesh(bar, M.blade);
    bm.scale.z = 0.5;
    bm.castShadow = true;
    key.add(bm);
    const slot = slab(R * 0.14, R * 1.07, 1, 0.4);
    own.push(slot);
    const sl = new THREE.Mesh(slot, M.black);
    sl.position.z = R * 0.16;
    key.add(sl);
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

export const Luce3DCtx = createContext(false);

/** Wraps children in a 3D layer when Luce3DCtx is on; otherwise renders them as they are. */
export function Maybe3D({ children, className = "" }: { children: ReactNode; className?: string }) {
  return useContext(Luce3DCtx) ? <Luce3DLayer className={className}>{children}</Luce3DLayer> : <>{children}</>;
}

export function Luce3DLayer({ children, className = "" }: { children: ReactNode; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!host.current || !cv.current || !hasWebGL()) return;
    const box = host.current;
    const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    R.toneMapping = THREE.ACESFilmicToneMapping;
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
    let disposed = false;
    new RGBELoader().load(HDR, (hdr) => {
      if (disposed) return;
      scene.environment = pm.fromEquirectangular(hdr).texture;
      scene.environmentRotation.set(-0.5, 2.6, 0);
      hdr.dispose();
      envReady = true;
      dirty = true;
    });
    scene.environmentIntensity = 0.9;
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
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
        if (kind === "lever") it.tgt.flip = on ? 1 : 0;
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
          pad.position.y = -11 + f * 13;
          pad.rotation.x = (f - 0.5) * -0.9;
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

export const LUCE_3D_CSS = `
  html body .nb-3d-on [data-3d]{position:relative;z-index:6;background:transparent!important;box-shadow:none!important;border-color:transparent!important}
  html body .nb-3d-on [data-3d] [data-3d-hide],html body .nb-3d-on [data-3d-hide]{visibility:hidden!important}
  html body .nb-3d-on [data-3d]::after{display:none!important}
  html body .nb-3d-on [data-3d=key]{outline:none!important}
  html body .nb-3d-on [data-3d=glass]{outline:none!important}
`;
