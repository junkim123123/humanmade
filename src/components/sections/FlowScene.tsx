"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PresentationControls, ContactShadows, Text, Environment } from "@react-three/drei";
import * as THREE from "three";

// Factory Building Component
function Factory() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <group ref={groupRef} position={[-3, 0, 0]}>
      {/* Main building */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1, 1]} />
        <meshStandardMaterial
          color="#64748B"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* Roof accent */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.3, 0.2, 1.1]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      {/* Small building extension */}
      <mesh position={[0.7, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.6, 0.4]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.15}
        color="#475569"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#ffffff"
      >
        Factory
      </Text>
    </group>
  );
}

// Container/Ship Component
function Shipment() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Container body */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.6, 0.8]} />
        <meshStandardMaterial
          color="#0F766E"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>
      {/* Container top */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.6, 0.2, 0.9]} />
        <meshStandardMaterial
          color="#134E4A"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.15}
        color="#134E4A"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#ffffff"
      >
        Shipment
      </Text>
    </group>
  );
}

// Warehouse Component
function Warehouse() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0003;
    }
  });

  return (
    <group ref={groupRef} position={[3, 0, 0]}>
      {/* Main warehouse */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.8, 1]} />
        <meshStandardMaterial
          color="#F59E0B"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Shelving units */}
      <mesh position={[-0.3, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial
          color="#D97706"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0.3, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial
          color="#D97706"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.12}
        color="#D97706"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#ffffff"
      >
        US Warehouse
      </Text>
    </group>
  );
}

// Path Component (connecting boxes)
function Path() {
  return (
    <group>
      {/* Left path segment */}
      <mesh position={[-1.5, 0.1, 0]} receiveShadow>
        <boxGeometry args={[1.5, 0.1, 0.3]} />
        <meshStandardMaterial
          color="#94A3B8"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      {/* Right path segment */}
      <mesh position={[1.5, 0.1, 0]} receiveShadow>
        <boxGeometry args={[1.5, 0.1, 0.3]} />
        <meshStandardMaterial
          color="#94A3B8"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      {/* Arrow markers */}
      {[-1, 0, 1].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.15, 3]} />
          <meshStandardMaterial color="#64748B" />
        </mesh>
      ))}
    </group>
  );
}

// Step Card Component
function StepCard({
  position,
  label,
  price,
  color,
}: {
  position: [number, number, number];
  label: string;
  price: string;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.0008 + position[0]) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Card background */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.05]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {/* Label text */}
      <Text
        position={[0, 0.08, 0.03]}
        fontSize={0.08}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label}
      </Text>
      {/* Price text */}
      <Text
        position={[0, -0.08, 0.03]}
        fontSize={0.06}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {price}
      </Text>
    </group>
  );
}

// Main Scene Content
function SceneContent() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-radius={3}
        shadow-blurSamples={20}
      />

      {/* Environment */}
      <Environment preset="city" />

      {/* Main floating group with PresentationControls */}
      <PresentationControls
        global
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 6, Math.PI / 6]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
        snap
      >
        <Float
          speed={0.3}
          floatIntensity={0.2}
          rotationIntensity={0.1}
        >
          <group>
            {/* Path */}
            <Path />

            {/* Nodes */}
            <Factory />
            <Shipment />
            <Warehouse />

            {/* Step Cards */}
            <StepCard
              position={[-2.5, 1.5, 0]}
              label="Analyze"
              price="Free"
              color="#3B82F6"
            />
            <StepCard
              position={[0, 1.5, 0]}
              label="Verify"
              price="$45"
              color="#8B5CF6"
            />
            <StepCard
              position={[2.5, 1.5, 0]}
              label="Execute"
              price="7%"
              color="#10B981"
            />
          </group>
        </Float>
      </PresentationControls>

      {/* Contact Shadows */}
      <ContactShadows
        position={[0, -0.3, 0]}
        opacity={0.2}
        scale={12}
        blur={2}
        far={6}
        color="#4B5563"
      />
    </>
  );
}

// Main Export Component
export default function FlowScene() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 4, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}

