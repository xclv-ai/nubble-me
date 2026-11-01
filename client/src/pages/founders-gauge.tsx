import { useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { RunItem } from "./founders-data";
import { MovesCtx, WEEKS, weekOf } from "./founders-fx-data";
import { AMBER, MUTE, RED } from "./founders-v3";

/*
 * The pressure gauge, ported from the iPhone app prototype (docs/redesign/proto/gauge3d.html),
 * itself drawn after the Ferrari Luce instrument cluster: 220-degree scale, yellow warm range,
 * tapered orange needle, matte bezel with a polished lip, glass with a diagonal glare.
 *
 * Pressure = how hard rivals pushed on you. The rule is shown on the page:
 * copied you = 40, weakened a claim = 20, worth knowing = 5. Capped at 100.
 */

const POINTS = { "code-red": 40, weakened: 20, "worth-knowing": 5 } as const;

export function pressureByWeek(run: RunItem[]) {
  const w = WEEKS.map(() => 0);
  run.forEach((m) => {
    if (m.kept) w[weekOf(m)] += POINTS[m.kept];
  });
  return w.map((v) => Math.min(100, v));
}

type Api = { set: (v: number, delta: string | null, deltaColor: string) => void; dispose: () => void };

function mountGauge(host: HTMLDivElement, reduce: boolean): Api {
  const R = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 0.95;
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.VSMShadowMap;
  host.appendChild(R.domElement);
  R.domElement.style.display = "block";
  R.domElement.style.touchAction = "pan-y";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.5, 40);
  const pm = new THREE.PMREMGenerator(R);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-1.2, 2.4, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 10;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5, near: 0.5, far: 10 });
  scene.add(key);

  const noiseTex = (w: number, h: number, fn: (x: number, y: number) => number) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    const d = g.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const v = fn(x, y);
        const i = (y * w + x) * 4;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        d.data[i + 3] = 255;
      }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  const grain = noiseTex(256, 256, () => 150 + Math.random() * 60);
  grain.repeat.set(6, 6);
  const brushed = noiseTex(512, 64, (_x, y) => 140 + Math.sin(y * 1.7 + Math.random() * 0.6) * 20 + Math.random() * 25);

  const rig = new THREE.Group();
  scene.add(rig);

  // panel
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.62, roughnessMap: grain, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.5 }),
  );
  panel.position.z = 0;
  panel.receiveShadow = true;
  rig.add(panel);

  // bezel: a turned profile, crisp chamfers, flat face
  const prof = [
    [0.7, 0.105],
    [0.705, 0.15],
    [0.72, 0.166],
    [0.784, 0.166],
    [0.799, 0.15],
    [0.8, 0.0],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const bezelMat = new THREE.MeshPhysicalMaterial({
    side: THREE.DoubleSide,
    color: 0x1b1b1c,
    roughness: 0.72,
    metalness: 0,
    roughnessMap: grain,
    sheen: 0.15,
    sheenRoughness: 0.9,
    sheenColor: new THREE.Color(0x333333),
  });
  const bezel = new THREE.Group();
  for (let i = 0; i < prof.length - 1; i++) {
    const m = new THREE.Mesh(new THREE.LatheGeometry([prof[i], prof[i + 1]], 240), bezelMat);
    m.castShadow = true;
    m.receiveShadow = true;
    bezel.add(m);
  }
  bezel.rotation.x = Math.PI / 2;
  rig.add(bezel);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.705, 0.008, 16, 200),
    new THREE.MeshPhysicalMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.18, roughnessMap: brushed }),
  );
  lip.position.z = 0.108;
  rig.add(lip);

  // dial face
  const S = 2048;
  const fc = document.createElement("canvas");
  fc.width = fc.height = S;
  const g = fc.getContext("2d")!;
  const cx = S / 2;
  const cy = S / 2;
  const ang = (v: number) => ((160 + 220 * v) * Math.PI) / 180;
  const WARM = 0.6;
  const YEL = "#F5C81E";
  const WHT = "#E9E9E9";
  const drawFace = () => {
    g.fillStyle = "#050505";
    g.fillRect(0, 0, S, S);
    for (let i = 0; i <= 100; i++) {
      const v = i / 100;
      const a = ang(v);
      const maj = i % 10 === 0;
      const mid = i % 5 === 0;
      const r2 = S * 0.452;
      const r1 = maj ? S * 0.385 : mid ? S * 0.418 : S * 0.435;
      g.strokeStyle = v <= WARM ? YEL : WHT;
      g.lineWidth = maj ? 14 : mid ? 7 : 3.2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      g.stroke();
    }
    g.font = "400 150px Geist, system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    [0, 20, 40, 60, 80, 100].forEach((n) => {
      const a = ang(n / 100);
      g.fillStyle = n / 100 <= WARM ? YEL : WHT;
      g.fillText(String(n), cx + Math.cos(a) * S * 0.315, cy + Math.sin(a) * S * 0.315);
    });
  };
  drawFace();
  const faceTex = new THREE.CanvasTexture(fc);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = R.capabilities.getMaxAnisotropy();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.7, 160), new THREE.MeshPhysicalMaterial({ map: faceTex, roughness: 0.55, metalness: 0, roughnessMap: grain }));
  face.position.z = 0.02;
  face.receiveShadow = true;
  rig.add(face);

  // needle
  const ns = new THREE.Shape();
  ns.moveTo(-0.016, 0);
  ns.lineTo(0.016, 0);
  ns.lineTo(0.007, 0.31);
  ns.quadraticCurveTo(0, 0.325, -0.007, 0.31);
  ns.closePath();
  const needle = new THREE.Mesh(
    new THREE.ExtrudeGeometry(ns, { depth: 0.012, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 3 }),
    new THREE.MeshPhysicalMaterial({ color: 0xff8a2a, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0xff5a00, emissiveIntensity: 0.55 }),
  );
  needle.castShadow = true;
  const pivot = new THREE.Group();
  pivot.position.z = 0.075;
  pivot.add(needle);
  needle.position.y = 0.345;
  rig.add(pivot);

  // glass dome
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(4.0, 128, 32, 0, Math.PI * 2, 0, Math.asin(0.705 / 4.0)),
    new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.45,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glass.rotation.x = Math.PI / 2;
  glass.position.z = 0.112 - 4.0 * Math.cos(Math.asin(0.705 / 4.0));
  rig.add(glass);

  // glare: crisp diagonal sheen, slides with tilt
  const gc = document.createElement("canvas");
  gc.width = gc.height = 1024;
  const gg = gc.getContext("2d")!;
  const grd = gg.createLinearGradient(446, 256, 768, 696);
  grd.addColorStop(0, "rgba(255,255,255,0.20)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.10)");
  grd.addColorStop(1, "rgba(255,255,255,0.03)");
  gg.fillStyle = grd;
  gg.beginPath();
  gg.moveTo(144, -124);
  gg.lineTo(1080, 1016);
  gg.lineTo(1300, -300);
  gg.closePath();
  gg.fill();
  const glareTex = new THREE.CanvasTexture(gc);
  glareTex.colorSpace = THREE.SRGBColorSpace;
  glareTex.repeat.set(0.5, 0.5);
  glareTex.offset.set(0.25, 0.25);
  const mk = document.createElement("canvas");
  mk.width = mk.height = 256;
  {
    const m = mk.getContext("2d")!;
    m.fillStyle = "#000";
    m.fillRect(0, 0, 256, 256);
    m.fillStyle = "#fff";
    m.beginPath();
    m.arc(128, 128, 127, 0, 7);
    m.fill();
  }
  const glare = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 128),
    new THREE.MeshBasicMaterial({ map: glareTex, alphaMap: new THREE.CanvasTexture(mk), transparent: true, depthTest: false, depthWrite: false }),
  );
  glare.position.z = 0.2;
  glare.renderOrder = 10;
  rig.add(glare);

  // centre number on its own printed disc, counts with the needle
  const nc = document.createElement("canvas");
  nc.width = nc.height = 512;
  const ng = nc.getContext("2d")!;
  const numTex = new THREE.CanvasTexture(nc);
  numTex.colorSpace = THREE.SRGBColorSpace;
  const numDisc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 96), new THREE.MeshPhysicalMaterial({ map: numTex, roughness: 0.55, metalness: 0, roughnessMap: grain }));
  numDisc.position.z = 0.021;
  rig.add(numDisc);
  const dc = document.createElement("canvas");
  dc.width = 1400;
  dc.height = 160;
  const dg = dc.getContext("2d")!;
  const dTex = new THREE.CanvasTexture(dc);
  dTex.colorSpace = THREE.SRGBColorSpace;
  const dLine = new THREE.Mesh(new THREE.PlaneGeometry(1.09, 0.125), new THREE.MeshBasicMaterial({ map: dTex, transparent: true, depthWrite: false }));
  dLine.position.set(0, -0.469, 0.022);
  rig.add(dLine);

  let delta: { text: string; color: string } | null = null;
  let shown = -1;
  const drawNum = (n: number, done: boolean) => {
    if (n === shown && !done) return;
    shown = n;
    ng.fillStyle = "#050505";
    ng.fillRect(0, 0, 512, 512);
    ng.textAlign = "center";
    ng.textBaseline = "middle";
    ng.strokeStyle = "#2a2a2a";
    ng.lineWidth = 3;
    ng.beginPath();
    ng.arc(256, 256, 248, 0, 7);
    ng.stroke();
    ng.fillStyle = "#F0F0F0";
    ng.font = "500 228px Geist, system-ui, sans-serif";
    ng.fillText(String(n), 256, 226);
    ng.fillStyle = "#C8C8C8";
    ng.font = "600 66px Geist, system-ui, sans-serif";
    ng.fillText("PRESSURE", 256, 378);
    numTex.needsUpdate = true;
    dg.clearRect(0, 0, 1400, 160);
    if (done && delta) {
      dg.textAlign = "center";
      dg.textBaseline = "middle";
      dg.font = "700 92px Geist, system-ui, sans-serif";
      dg.fillStyle = delta.color;
      dg.fillText(delta.text, 700, 84);
    }
    dTex.needsUpdate = true;
  };

  let target = 0;
  let from = 0;
  let val = 0;
  let start = performance.now();
  let landed = false;
  const sweep = (p: number) => 1 - Math.pow(1 - p, 3) + Math.sin(p * Math.PI) * 0.04 * (1 - p);

  // tilt: pointer on desktop, the instrument turns a few degrees, the glare slides
  let tx = 0;
  let ty = 0;
  let gx = 0;
  let gy = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = host.getBoundingClientRect();
    tx = THREE.MathUtils.clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
    ty = THREE.MathUtils.clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
  };
  window.addEventListener("pointermove", onMove);

  const fit = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    R.setSize(w, h);
    cam.aspect = w / h;
    // the bezel (radius 0.8) fills the shorter side with a small margin
    const half = 0.86 / Math.min(1, cam.aspect);
    cam.position.set(0, 0, half / Math.tan((15 * Math.PI) / 180));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(host);

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(host);

  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    gx += (tx - gx) * 0.08;
    gy += (ty - gy) * 0.08;
    rig.rotation.set(-gy * 0.06, gx * 0.06, 0);
    key.position.set(-1.2 + gx * 0.5, 2.4 - gy * 0.5, 3.2);
    glareTex.offset.set(0.25 - gx * 0.12, 0.25 + gy * 0.12);
    const p = reduce ? 1 : Math.min(1, Math.max(0, (performance.now() - start) / 1500));
    val = from + (target - from) * sweep(p);
    const n = Math.max(0, Math.min(100, Math.round(val * 100)));
    if (p >= 1 && !landed) {
      landed = true;
      drawNum(Math.round(target * 100), true);
    } else if (!landed) drawNum(n, false);
    pivot.rotation.z = ((-250 - 220 * val) * Math.PI) / 180;
    R.render(scene, cam);
  };
  raf = requestAnimationFrame(tick);

  document.fonts?.load("500 40px Geist").then(() => {
    drawFace();
    faceTex.needsUpdate = true;
    shown = -1;
    drawNum(Math.round(val * 100), landed);
  });

  return {
    set(v, d, color) {
      from = val;
      target = Math.max(0, Math.min(1, v / 100));
      delta = d ? { text: d, color } : null;
      start = performance.now();
      landed = false;
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      pm.dispose();
      R.dispose();
      R.domElement.remove();
    },
  };
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The pressure gauge with one chip per week. Default: the week with the most pressure. */
export function PressureGauge() {
  const { run } = useContext(MovesCtx);
  const weeks = useMemo(() => pressureByWeek(run), [run]);
  const total = Math.min(100, weeks.reduce((a, b) => a + b, 0));
  const top = weeks.indexOf(Math.max(...weeks));
  const [sel, setSel] = useState<number>(top);
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [gl, setGl] = useState(true);
  const started = useRef(false);

  const valueOf = (i: number) => (i < 0 ? total : weeks[i]);
  const deltaOf = (i: number): [string | null, string] => {
    if (i < 0) return ["15 Sep to 31 Oct", "#9A9A9A"];
    if (i === 0) return ["first week we read", "#9A9A9A"];
    const d = weeks[i] - weeks[i - 1];
    return [`${d > 0 ? "▲" : d < 0 ? "▼" : "="} ${Math.abs(d)} vs week before`, d > 0 ? "#FF3B4E" : d < 0 ? "#2FD36B" : "#9A9A9A"];
  };

  useEffect(() => {
    if (!host.current) return;
    if (!hasWebGL()) {
      setGl(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      api.current = mountGauge(host.current, reduce);
    } catch {
      setGl(false);
      return;
    }
    // sweep up the first time it scrolls into view
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const [d, c] = deltaOf(sel);
        api.current?.set(valueOf(sel), d, c);
      }
    }, { threshold: 0.4 });
    io.observe(host.current);
    return () => {
      io.disconnect();
      api.current?.dispose();
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (i: number) => {
    setSel(i);
    started.current = true;
    const [d, c] = deltaOf(i);
    api.current?.set(valueOf(i), d, c);
  };

  const label = (i: number) => (i < 0 ? "All" : WEEKS[i].label);
  const chips = [-1, ...WEEKS.map((_, i) => i)];
  const inScope = run.filter((m) => sel < 0 || weekOf(m) === sel);
  const scored = inScope.filter((m) => m.kept);
  const quiet = inScope.length - scored.length;
  const KIND = { "code-red": "copied you", weakened: "weakened a claim", "worth-knowing": "worth knowing" } as const;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[13px] text-white">Pressure on pokpok.ai</p>
          <p className="font-mono text-[12px]" style={{ color: MUTE }}>
            {sel < 0 ? "15 Sep to 31 Oct" : `week of ${WEEKS[sel].label}`}
          </p>
        </div>
        <p className="text-[14px] leading-[1.5]" style={{ color: "#C9CFD2" }}>
          How hard your rivals pushed on you. 0 is a quiet week. 100 means drop everything.
        </p>
      </div>
      {gl ? (
        <div
          ref={host}
          role="img"
          aria-label={`Pressure gauge reading ${valueOf(sel)} out of 100`}
          className="mx-auto aspect-square w-full max-w-[340px] cursor-pointer overflow-hidden rounded-xl"
          style={{ background: "#050505" }}
          onClick={() => pick(sel)}
        />
      ) : (
        <div className="mx-auto flex aspect-square w-full max-w-[340px] flex-col items-center justify-center rounded-full border-[10px] border-[#1b1b1c] bg-[#050505]">
          <span className="text-[72px] font-medium text-white">{valueOf(sel)}</span>
          <span className="font-mono text-[13px] tracking-[0.1em]" style={{ color: "#C8C8C8" }}>
            PRESSURE
          </span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5">
        {chips.map((i) => {
          const on = i === sel;
          const v = valueOf(i);
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              aria-pressed={on}
              className="flex min-h-[48px] flex-col items-center justify-center rounded-md border font-mono leading-tight"
              style={{ borderColor: on ? AMBER : "#2A3338", background: on ? "#2A2210" : "transparent" }}
            >
              <span className="text-[11.5px]" style={{ color: on ? "#FFFFFF" : "#A9B1B5" }}>
                {label(i)}
              </span>
              <span className="text-[16px] font-medium" style={{ color: v >= 40 ? RED : v > 0 ? AMBER : MUTE }}>
                {v}
              </span>
            </button>
          );
        })}
      </div>
      <div className="rounded-lg border px-4 py-3" style={{ borderColor: "#1E2529", background: "#0B0E0F" }}>
        <p className="mb-2 font-mono text-[12px]" style={{ color: MUTE }}>
          How {sel < 0 ? "the total" : "this week"} adds up
        </p>
        <ul className="flex flex-col gap-1.5">
          {scored.map((m) => (
            <li key={m.url + m.date} className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 text-[14px] leading-[1.4]">
              <span className="font-mono font-medium" style={{ color: m.kept === "code-red" ? RED : m.kept === "weakened" ? "#FF8B3E" : AMBER }}>
                +{POINTS[m.kept!]}
              </span>
              <span className="min-w-0 text-[#D9DDDF]">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[#3A4449] underline-offset-2 hover:text-white">
                  {m.title}
                </a>{" "}
                <span className="font-mono text-[12px]" style={{ color: MUTE }}>
                  {m.date}, {KIND[m.kept!]}
                </span>
              </span>
            </li>
          ))}
          <li className="grid grid-cols-[44px_minmax(0,1fr)] gap-2 text-[14px] leading-[1.4]">
            <span className="font-mono font-medium" style={{ color: MUTE }}>
              0
            </span>
            <span className="min-w-0" style={{ color: MUTE }}>
              {quiet ? `${quiet} more rival move${quiet === 1 ? "" : "s"} read, not about you.` : "Nothing else read."}
            </span>
          </li>
        </ul>
        <p className="mt-2 text-[12.5px] leading-[1.5]" style={{ color: MUTE }}>
          Copied you: 40. Weakened one of your claims: 20. Worth knowing: 5. Capped at 100.
        </p>
      </div>
    </div>
  );
}
