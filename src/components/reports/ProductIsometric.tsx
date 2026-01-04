"use client";

import { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Float, ContactShadows, Environment, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Isometric Camera Setup
function IsometricCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    const distance = 6;
    const angleX = Math.PI / 6; // 30도
    const angleY = Math.PI / 4; // 45도
    
    const x = distance * Math.cos(angleX) * Math.cos(angleY);
    const y = distance * Math.sin(angleX);
    const z = distance * Math.cos(angleX) * Math.sin(angleY);
    
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 45;
      camera.near = 0.1;
      camera.far = 20;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
}

// Factory - Left (Large glass cube)
function Factory() {
  return (
    <group position={[-2.5, 0.9, 0]}>
      <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#A78BFA"
          transmission={0.6}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Shipment - Middle (Flat rectangular glass slab)
function Shipment() {
  return (
    <group position={[0, 0.6, 0]}>
      <RoundedBox args={[2.5, 0.3, 1]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#22D3EE"
          transmission={0.6}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Warehouse - Right (Stack of 3 thin glass slabs)
function Warehouse() {
  return (
    <group position={[2.5, 0.6, 0]}>
      {/* Bottom slab */}
      <RoundedBox args={[1, 0.5, 0.8]} radius={0.05} smoothness={4} position={[0, 0.25, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#FDBA74"
          transmission={0.6}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
      {/* Middle slab */}
      <RoundedBox args={[0.9, 0.4, 0.7]} radius={0.05} smoothness={4} position={[0, 0.7, 0]} castShadow>
        <meshPhysicalMaterial
          color="#FDBA74"
          transmission={0.6}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
      {/* Top slab */}
      <RoundedBox args={[0.8, 0.35, 0.6]} radius={0.05} smoothness={4} position={[0, 1.15, 0]} castShadow>
        <meshPhysicalMaterial
          color="#FDBA74"
          transmission={0.6}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Connection Flow - Glowing grey line connecting blocks
function ConnectionFlow() {
  return (
    <group>
      {/* Factory to Shipment connection */}
      <mesh position={[-1.2, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.3, 16]} />
        <meshStandardMaterial
          color="#94A3B8"
          emissive="#94A3B8"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Shipment to Warehouse connection */}
      <mesh position={[1.2, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 2.3, 16]} />
        <meshStandardMaterial
          color="#94A3B8"
          emissive="#94A3B8"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

// Main Scene
function SceneContent() {
  return (
    <>
      <IsometricCamera />
      
      {/* Crucial Lighting for Glass */}
      <ambientLight intensity={0.5} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Environment - Essential for glass reflections */}
      <Environment preset="city" />
      
      {/* Float animation - gentle hover */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group>
          {/* Supply Chain Glass Blocks */}
          <Factory />
          <Shipment />
          <Warehouse />
          
          {/* Connection Flow */}
          <ConnectionFlow />
        </group>
      </Float>
      
      {/* Soft Contact Shadows */}
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
        color="#475569"
        resolution={1024}
      />
    </>
  );
}

interface ProductIsometricProps {
  className?: string;
}

export default function ProductIsometric({ className = "" }: ProductIsometricProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
