import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Html, OrbitControls, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";
import { FX_RIVALS, MOVES_BY_RIVAL, type FxRival } from "./founders-fx-data";

/*
 * The war table: a 3D map of pokpok.ai's market.
 * Each rival is a tower. Its height is the number of moves we read from it, 15 Sep to 31 Oct 2026.
 * Peec copied pokpok's main difference on 16 Sep, so its tower is red and fires a beam at you.
 */

const RED = "#FF4D4F";
const AMBER = "#FFB224";

const COLOR: Partial<Record<FxRival, string>> = { "Peec AI": RED, Profound: AMBER };

function pos(i: number): [number, number, number] {
  const a = -Math.PI / 2 + (i * Math.PI * 2) / FX_RIVALS.length + 0.35;
  const r = i % 2 ? 3.1 : 2.6;
  return [Math.cos(a) * r, 0, Math.sin(a) * r];
}

function Sweep({ still }: { still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ref.current && !still) ref.current.rotation.z -= d * 0.9;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[3.9, 48, 0, 0.7]} />
      <meshBasicMaterial color="#3DD68C" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function Rings() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {[1.3, 2.6, 3.9].map((r) => (
        <mesh key={r}>
          <ringGeometry args={[r - 0.012, r + 0.012, 96]} />
          <meshBasicMaterial color="#2A3338" />
        </mesh>
      ))}
      <mesh>
        <circleGeometry args={[4.2, 64]} />
        <meshBasicMaterial color="#07090A" />
      </mesh>
    </group>
  );
}

function Tower({ i, name, selected, onPick, still }: { i: number; name: FxRival; selected: boolean; onPick: () => void; still: boolean }) {
  const moves = MOVES_BY_RIVAL[name].length;
  const h = 0.12 + moves * 0.2;
  const color = COLOR[name] ?? (moves ? "#7C8A91" : "#3A4449");
  const [x, , z] = pos(i);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = still ? 0.5 : (clock.elapsedTime * 0.8) % 1;
    ring.current.scale.setScalar(1 + t * 2.2);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
  });
  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, h / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <boxGeometry args={[0.34, h, 0.34]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.9 : 0.35} roughness={0.4} />
      </mesh>
      {name === "Peec AI" && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.32, 0.38, 48]} />
          <meshBasicMaterial color={RED} transparent />
        </mesh>
      )}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.42, 0.47, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      )}
      <Html position={[0, h + 0.35, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="whitespace-nowrap text-center font-mono leading-tight"
          style={{ color: COLOR[name] ?? "#C9CFD2", fontSize: 12, textShadow: "0 0 6px #000, 0 0 2px #000" }}
        >
          <div style={{ fontWeight: selected ? 600 : 400 }}>{name}</div>
          <div style={{ fontSize: 10.5, opacity: 0.8 }}>{moves ? `${moves} move${moves > 1 ? "s" : ""}` : "quiet"}</div>
        </div>
      </Html>
    </group>
  );
}

function Beam({ still }: { still: boolean }) {
  const [x, , z] = pos(0);
  const h = 0.12 + MOVES_BY_RIVAL["Peec AI"].length * 0.2;
  const ref = useRef<any>(null);
  useFrame((_, d) => {
    if (ref.current?.material && !still) ref.current.material.dashOffset -= d * 1.5;
  });
  return (
    <QuadraticBezierLine
      ref={ref}
      start={[x, h, z]}
      end={[0, 0.35, 0]}
      mid={[x / 2, h + 1.4, z / 2]}
      color={RED}
      lineWidth={2}
      dashed
      dashScale={6}
      gapSize={0.6}
    />
  );
}

function You({ still }: { still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current && !still) ref.current.position.y = 0.32 + Math.sin(clock.elapsedTime * 2) * 0.04;
  });
  return (
    <group>
      <mesh ref={ref} position={[0, 0.32, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
      </mesh>
      <Html position={[0, -0.05, 0.55]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap font-mono text-white" style={{ fontSize: 13, textShadow: "0 0 6px #000" }}>
          pokpok.ai (you)
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
    const d = aspect < 1.1 ? 11.5 : 8;
    camera.position.set(0, d * 0.72, d * 0.88);
    camera.lookAt(0, 0.4, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

export default function WarTable({ selected, onSelect }: { selected: FxRival; onSelect: (r: FxRival) => void }) {
  const still = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const touch = useMemo(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches, []);
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 6.5, 8], fov: 38 }}
      style={{ touchAction: "pan-y" }}
      gl={{ antialias: true, alpha: true }}
    >
      <Fit />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 5]} intensity={1.2} />
      <Rings />
      <Sweep still={still} />
      <You still={still} />
      <Beam still={still} />
      {FX_RIVALS.map((r, i) => (
        <Tower key={r} i={i} name={r} selected={selected === r} onPick={() => onSelect(r)} still={still} />
      ))}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={!touch}
        autoRotate={!still}
        autoRotateSpeed={0.5}
        minPolarAngle={0.5}
        maxPolarAngle={1.2}
      />
    </Canvas>
  );
}
