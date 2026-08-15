"use client";

import { Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";

import type { AnalysisResult } from "@/lib/contracts";

type BarDatum = {
  dimension: string;
  subset: string;
  score: number;
  x: number;
  z: number;
  color: string;
};

function ScoreBar({
  datum,
  onHover,
}: {
  datum: BarDatum;
  onHover: (datum: BarDatum | null) => void;
}) {
  const height = Math.max(datum.score * 0.075, 0.06);

  return (
    <group position={[datum.x, 0, datum.z]}>
      <RoundedBox
        args={[1.35, height, 1.12]}
        radius={0.07}
        smoothness={3}
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(datum);
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshStandardMaterial
          color={datum.color}
          metalness={0.22}
          roughness={0.32}
          emissive={datum.color}
          emissiveIntensity={0.04}
        />
      </RoundedBox>
      <Html
        center
        position={[0, height + 0.32, 0]}
        distanceFactor={11}
        style={{ pointerEvents: "none" }}
      >
        <span className="score-landscape-value">{datum.score.toFixed(1)}</span>
      </Html>
    </group>
  );
}

function DimensionLabel({ label, x }: { label: string; x: number }) {
  return (
    <Html
      center
      position={[x, 0.1, 2.65]}
      distanceFactor={11}
      style={{ pointerEvents: "none" }}
    >
      <span className="score-landscape-axis-label">{label}</span>
    </Html>
  );
}

export function ScoreLandscape3D({ result }: { result: AnalysisResult }) {
  const [hovered, setHovered] = useState<BarDatum | null>(null);
  const subsetA = result.subsets.find((subset) => subset.id === "subset-a")!;
  const subsetB = result.subsets.find((subset) => subset.id === "subset-b")!;
  const subsets = [subsetA, subsetB];
  const dimensionPositions = [-3, 0, 3];
  const subsetPositions = [-1.05, 1.05];
  const colors = ["#a9e4ed", "#eacb78"];
  const bars = result.dimensions.flatMap((dimension, dimensionIndex) =>
    subsets.map((subset, subsetIndex) => ({
      dimension: dimension.shortLabel ?? dimension.label,
      subset: subset.source,
      score: subset.dimensions[dimension.id].display,
      x: dimensionPositions[dimensionIndex] ?? dimensionIndex * 3,
      z: subsetPositions[subsetIndex],
      color: colors[subsetIndex],
    })),
  );

  return (
    <section className="score-landscape" aria-labelledby="score-landscape-title">
      <div className="score-landscape-header">
        <div>
          <p className="section-kicker">Interactive score space</p>
          <h2 id="score-landscape-title">Dataset × dimension × score</h2>
        </div>
        <div className="score-landscape-legend" aria-label="Dataset colors">
          <span><i className="landscape-a" />A · Mecka</span>
          <span><i className="landscape-b" />B · Scale</span>
        </div>
      </div>

      <div className="score-landscape-frame">
        <div
          className="score-landscape-chart"
          role="img"
          aria-label="Interactive 3D bar chart comparing Mecka and Scale across Behavior, Visual, and Embodiment diversity scores. Drag to rotate and scroll to zoom."
        >
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [10, 8.5, 12], fov: 39, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: true }}
            shadows
            onPointerMissed={() => setHovered(null)}
          >
            <color attach="background" args={["#0a0d11"]} />
            <fog attach="fog" args={["#0a0d11", 17, 30]} />
            <ambientLight intensity={0.72} />
            <directionalLight
              position={[6, 12, 8]}
              intensity={2.4}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight position={[-8, 5, -4]} color="#72d8e8" intensity={24} />
            <pointLight position={[8, 4, 6]} color="#e9c769" intensity={18} />

            <gridHelper
              args={[14, 14, "#2a343e", "#151b21"]}
              position={[0, 0, 0]}
            />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
              <planeGeometry args={[14, 11]} />
              <meshStandardMaterial color="#0c1015" roughness={0.92} />
            </mesh>

            {bars.map((datum) => (
              <ScoreBar
                key={`${datum.dimension}-${datum.subset}`}
                datum={datum}
                onHover={setHovered}
              />
            ))}
            {result.dimensions.map((dimension, index) => (
              <DimensionLabel
                key={dimension.id}
                label={dimension.shortLabel ?? dimension.label}
                x={dimensionPositions[index] ?? index * 3}
              />
            ))}

            <OrbitControls
              target={[0, 2.8, 0]}
              enablePan={false}
              enableDamping
              dampingFactor={0.07}
              minDistance={11}
              maxDistance={25}
              minPolarAngle={0.55}
              maxPolarAngle={1.38}
            />
          </Canvas>
        </div>

        <div className={`score-landscape-readout ${hovered ? "is-active" : ""}`}>
          <span>{hovered ? `${hovered.subset} · ${hovered.dimension}` : "Explore the measured score space"}</span>
          <strong>{hovered ? `${hovered.score.toFixed(1)} / 100` : "Hover a bar"}</strong>
        </div>

        <div className="score-landscape-note">
          <span>Drag to rotate · scroll to zoom</span>
          <span>Backend measurements · weights do not alter these bars</span>
        </div>
      </div>

      <div className="score-landscape-table" aria-label="Exact scores shown in the 3D chart">
        {result.dimensions.map((dimension) => (
          <div key={dimension.id}>
            <span>{dimension.shortLabel ?? dimension.label}</span>
            <strong className="metric-a">A {subsetA.dimensions[dimension.id].display.toFixed(1)}</strong>
            <strong className="metric-b">B {subsetB.dimensions[dimension.id].display.toFixed(1)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
