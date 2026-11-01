import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import { FX_RIVALS, MOVES_BY_RIVAL as DEFAULT_BY_RIVAL, type FxRival } from "./founders-fx-data";
import type { RunItem } from "./founders-data";

/* Set by the WarTable props before each render: v4 and v5 pass different runs. */
let MOVES_BY_RIVAL: Record<FxRival, RunItem[]> = DEFAULT_BY_RIVAL;
let MAX = 1;
let BIG = false;

/*
 * The war table: a 3D map of pokpok.ai's market.
 * Each rival is a tower. Its height is the number of moves we read from it, 15 Sep to 31 Oct 2026.
 * Peec copied pokpok's main difference on 16 Sep, so its tower fires a beam at you.
 * Three sensor modes (ideas from God's Eye View): normal, night vision, thermal (heat = moves).
 */

export type Sensor = "normal" | "night" | "thermal";

const RED = "#FF4D4F";
const AMBER = "#FFB224";

const HEAT = ["#2B1C8F", "#7A2BD6", "#D9366B", "#FF8C00", "#FFD166", "#FFF6D5"];
function heat(moves: number) {
  const t = Math.min(1, moves / MAX);
  return HEAT[Math.round(t * (HEAT.length - 1))];
}

function palette(s: Sensor) {
  if (s === "night") return { ground: "#020F06", ring: "#1D5A2C", sweep: "#7CFF9B", beam: "#B6FFC6", you: "#D9FFE2", label: "#9CFFB3" };
  if (s === "thermal") return { ground: "#04042A", ring: "#1E1E6E", sweep: "", beam: "#FFFFFF", you: "#FFFFFF", label: "#FFFFFF" };
  return { ground: "#07090A", ring: "#2A3338", sweep: "#3DD68C", beam: RED, you: "#FFFFFF", label: "#C9CFD2" };
}

function towerColor(name: FxRival, s: Sensor) {
  const moves = MOVES_BY_RIVAL[name].length;
  if (s === "thermal") return heat(moves);
  if (s === "night") return moves ? (name === "Peec AI" ? "#CFFFD9" : "#57C46F") : "#1F4A29";
  if (name === "Peec AI") return RED;
  if (name === "Profound") return AMBER;
  return moves ? "#7C8A91" : "#3A4449";
}

export const ANGLE = (i: number) => -Math.PI / 2 + (i * Math.PI * 2) / FX_RIVALS.length + 0.35;
function pos(i: number): [number, number, number] {
  const a = ANGLE(i);
  const r = i % 2 ? 3.1 : 2.6;
  return [Math.cos(a) * r, 0, Math.sin(a) * r];
}

function Sweep({ still, color }: { still: boolean; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ref.current && !still) ref.current.rotation.z -= d * 0.9;
  });
  if (!color) return null;
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[3.9, 48, 0, 0.7]} />
      <meshBasicMaterial color={color} transparent opacity={0.13} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function Ground({ p }: { p: ReturnType<typeof palette> }) {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {[1.3, 2.6, 3.9].map((r) => (
        <mesh key={r}>
          <ringGeometry args={[r - 0.012, r + 0.012, 96]} />
          <meshBasicMaterial color={p.ring} />
        </mesh>
      ))}
      <mesh>
        <circleGeometry args={[4.2, 64]} />
        <meshBasicMaterial color={p.ground} />
      </mesh>
    </group>
  );
}

function Tower({ i, name, selected, onPick, still, sensor }: { i: number; name: FxRival; selected: boolean; onPick: () => void; still: boolean; sensor: Sensor }) {
  const moves = MOVES_BY_RIVAL[name].length;
  const h = 0.12 + moves * 0.2;
  const color = towerColor(name, sensor);
  const p = palette(sensor);
  const [x, , z] = pos(i);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = still ? 0.5 : (clock.elapsedTime * 0.8) % 1;
    ring.current.scale.setScalar(1 + t * 2.2);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
  });
  const pick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onPick();
  };
  const labelColor = sensor === "normal" ? (name === "Peec AI" ? RED : name === "Profound" ? AMBER : p.label) : sensor === "thermal" ? color : p.label;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} onClick={pick} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
        <boxGeometry args={[0.34, h, 0.34]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={sensor === "normal" ? (selected ? 0.9 : 0.35) : 0.85} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, 0]} onClick={pick}>
        <boxGeometry args={[1.1, 0.9, 1.1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {name === "Peec AI" && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.32, 0.38, 48]} />
          <meshBasicMaterial color={sensor === "normal" ? RED : p.beam} transparent />
        </mesh>
      )}
      <Html position={[0, h + 0.6, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="whitespace-nowrap font-mono leading-tight"
          style={{
            color: labelColor,
            fontSize: BIG ? 13.5 : 12,
            padding: "2px 6px",
            border: `1px solid ${selected ? labelColor : "transparent"}`,
            background: selected ? "rgba(0,0,0,0.55)" : "transparent",
            textShadow: "0 0 6px #000, 0 0 2px #000",
          }}
        >
          <div style={{ fontSize: BIG ? 12 : 9.5, opacity: 0.75 }}>TGT-0{i + 1}</div>
          <div style={{ fontWeight: selected ? 600 : 400 }}>{name}</div>
          <div style={{ fontSize: BIG ? 12.5 : 10.5, opacity: 0.85 }}>{moves ? `${moves} move${moves > 1 ? "s" : ""}` : "quiet"}</div>
        </div>
      </Html>
    </group>
  );
}

function Beam({ still, color }: { still: boolean; color: string }) {
  const [x, , z] = pos(0);
  const h = 0.12 + MOVES_BY_RIVAL["Peec AI"].length * 0.2;
  const ref = useRef<any>(null);
  useFrame((_, d) => {
    if (ref.current?.material && !still) ref.current.material.dashOffset -= d * 1.5;
  });
  return <QuadraticBezierLine ref={ref} start={[x, h, z]} end={[0, 0.35, 0]} mid={[x / 2, h + 1.4, z / 2]} color={color} lineWidth={2} dashed dashScale={6} gapSize={0.6} />;
}

function You({ still, color }: { still: boolean; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current && !still) ref.current.position.y = 0.32 + Math.sin(clock.elapsedTime * 2) * 0.04;
  });
  return (
    <group>
      <mesh ref={ref} position={[0, 0.32, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <Html position={[0, -0.05, 0.55]} center distanceFactor={9} zIndexRange={[20, 11]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap font-mono" style={{ color, fontSize: 12, fontWeight: 600, padding: "1px 5px", background: "rgba(0,0,0,0.6)", textShadow: "0 0 6px #000" }}>
          YOU
        </div>
      </Html>
    </group>
  );
}

/** Pull the camera back on narrow screens so the whole table fits. */
function Fit() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const d = aspect < 1.1 ? 12.5 : 9.2;
    camera.position.set(0, d * 0.72, d * 0.88);
    camera.lookAt(0, 0.4, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

/** Turns the whole table. Drifts slowly until a rival is tracked, then locks it to the front. */
function Turntable({ children, track, still }: { children: React.ReactNode; track: number | null; still: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    const g = ref.current;
    if (!g) return;
    if (track === null) {
      if (!still) g.rotation.y += d * 0.12;
      return;
    }
    const target = ANGLE(track) + Math.PI / 2; // the tracked rival goes to the far side, facing you
    let diff = target - g.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += still ? diff : diff * Math.min(1, d * 3);
  });
  return <group ref={ref}>{children}</group>;
}

export default function WarTable({
  selected,
  tracking,
  onSelect,
  sensor,
  byRival = DEFAULT_BY_RIVAL,
  big = false,
}: {
  selected: FxRival;
  tracking: boolean;
  onSelect: (r: FxRival) => void;
  sensor: Sensor;
  byRival?: Record<FxRival, RunItem[]>;
  big?: boolean;
}) {
  MOVES_BY_RIVAL = byRival;
  BIG = big;
  MAX = Math.max(1, ...FX_RIVALS.map((r) => byRival[r].length));
  const still = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const p = palette(sensor);
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 6.5, 8], fov: 38 }} style={{ touchAction: "pan-y" }} gl={{ antialias: true, alpha: true }}>
      <Fit />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 5]} intensity={1.2} />
      <Turntable track={tracking ? FX_RIVALS.indexOf(selected) : null} still={still}>
        <Ground p={p} />
        <Sweep still={still} color={p.sweep} />
        <You still={still} color={p.you} />
        <Beam still={still} color={p.beam} />
        {FX_RIVALS.map((r, i) => (
          <Tower key={r} i={i} name={r} selected={selected === r} onPick={() => onSelect(r)} still={still} sensor={sensor} />
        ))}
      </Turntable>
    </Canvas>
  );
}
