"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PresentationControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

// Shipping Box Component
function ShippingBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Very subtle idle rotation
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0.5, 0]}
      rotation={[0.1, 0.2, 0]}
      scale={[1.2, 1, 0.8]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#8B6F47"
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}

// Container Component (ocean container/pallet)
function Container() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Very subtle idle rotation
      meshRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, -0.3, -0.5]}
      rotation={[0, 0.1, 0]}
      scale={[2.5, 0.4, 1.2]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#6B7280"
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

// Report Card Component (AI sourcing report)
function ReportCard() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Very subtle rotation
      meshRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <group position={[1.2, 0.8, 0.3]} rotation={[0, -0.3, 0.15]}>
      {/* Main card */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1, 0.02]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
      {/* Border accent */}
      <mesh position={[0, 0, 0.011]}>
        <boxGeometry args={[0.82, 1.02, 0.005]} />
        <meshStandardMaterial
          color="#3B82F6"
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

// Profit Coin Component (golden cylinder)
function ProfitCoin() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Very slow, subtle rotation
      meshRef.current.rotation.y += 0.003;
      // Subtle vertical float
      meshRef.current.position.y = 1.8 + Math.sin(Date.now() * 0.0008) * 0.05;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[-0.8, 1.8, 0.5]}
      rotation={[Math.PI / 2, 0, 0]}
      castShadow
    >
      <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
      <meshStandardMaterial
        color="#D4AF37"
        metalness={0.95}
        roughness={0.15}
        emissive="#F4C430"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

// Main Scene Group
function SceneContent() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
        shadow-radius={4}
        shadow-blurSamples={25}
      />

      {/* Environment for subtle reflections */}
      <Environment preset="city" />

      {/* Main floating group with PresentationControls */}
      <PresentationControls
        global
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 3, Math.PI / 3]}
        azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        config={{ mass: 2, tension: 400 }}
        snap
      >
        <Float
          speed={0.5}
          floatIntensity={0.3}
          rotationIntensity={0.2}
        >
          {/* All objects grouped together */}
          <group>
            <Container />
            <ShippingBox />
            <ReportCard />
            <ProfitCoin />
          </group>
        </Float>
      </PresentationControls>

      {/* Contact Shadows for grounding - soft and SaaS-like */}
      <ContactShadows
        position={[0, -0.5, 0]}
        opacity={0.25}
        scale={10}
        blur={2.5}
        far={8}
        color="#4B5563"
      />
    </>
  );
}

// Main Export Component
export default function ThreeScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 2.5, 6], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]} // Limit pixel ratio for better mobile performance
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}

