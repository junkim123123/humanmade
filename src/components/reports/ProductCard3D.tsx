"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Float, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

// Isometric Camera Setup
function IsometricCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    const distance = 4;
    const angleX = Math.PI / 6; // 30도
    const angleY = Math.PI / 4; // 45도
    
    const x = distance * Math.cos(angleX) * Math.cos(angleY);
    const y = distance * Math.sin(angleX);
    const z = distance * Math.cos(angleX) * Math.sin(angleY);
    
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 50;
      camera.near = 0.1;
      camera.far = 10;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
}

// 1. Confectionery - Abstract Marshmallow (부드러운 알약형)
function MarshmallowAbstract() {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <group position={[0, 0.5, 0]}>
        {/* Main pill-shaped body */}
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
          <meshStandardMaterial
            color="#FFE5EC"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Soft highlight on top */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.4}
            metalness={0.1}
            transparent
            opacity={0.6}
          />
        </mesh>
        {/* Subtle accent torus */}
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.32, 0.05, 16, 32]} />
          <meshStandardMaterial
            color="#FFB6C1"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      </group>
    </Float>
  );
}

// 2. Toys - Abstract Plush (3개의 구 합쳐진 추상 형태)
function PlushAbstract() {
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.35}>
      <group position={[0, 0.6, 0]}>
        {/* Main body sphere (largest) */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial
            color="#60A5FA"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Head sphere (top-left) */}
        <mesh position={[-0.15, 0.45, 0.2]} castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial
            color="#3B82F6"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Smaller accent sphere (top-right) */}
        <mesh position={[0.2, 0.5, -0.15]} castShadow>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial
            color="#93C5FD"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Tiny detail spheres for fuzzy texture feel */}
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = 0.5;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius * 0.3,
                Math.sin(angle * 0.5) * 0.2,
                Math.sin(angle) * radius * 0.3,
              ]}
              castShadow
            >
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial
                color="#DBEAFE"
                roughness={0.4}
                metalness={0.1}
              />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

// 3. Snacks - Abstract Jelly (Glass/Translucent Icosahedron)
function JellyAbstract() {
  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.4}>
      <group position={[0, 0.5, 0]}>
        {/* Main icosahedron - glass effect */}
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshPhysicalMaterial
            color="#FF6B9D"
            transmission={0.6}
            thickness={0.5}
            roughness={0.1}
            metalness={0.0}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Secondary octahedron inside for depth */}
        <mesh castShadow>
          <octahedronGeometry args={[0.3, 0]} />
          <meshPhysicalMaterial
            color="#FFB6C1"
            transmission={0.7}
            thickness={0.3}
            roughness={0.05}
            metalness={0.0}
            ior={1.4}
            transparent
            opacity={0.4}
          />
        </mesh>
        {/* Accent small icosahedrons around */}
        {[...Array(4)].map((_, i) => {
          const angle = (i / 4) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 0.6,
                Math.sin(angle) * 0.3,
                Math.sin(angle * 0.5) * 0.4,
              ]}
              castShadow
            >
              <icosahedronGeometry args={[0.15, 0]} />
              <meshPhysicalMaterial
                color={i % 2 === 0 ? "#C44569" : "#F8B500"}
                transmission={0.5}
                thickness={0.2}
                roughness={0.1}
                metalness={0.0}
                ior={1.5}
              />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

interface ProductCard3DProps {
  category: "Confectionery" | "Toys" | "Snacks";
  className?: string;
}

function SceneContent({ category }: { category: string }) {
  return (
    <>
      <IsometricCamera />
      
      {/* Premium Studio Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-3, 2, -3]} intensity={0.3} color="#ffffff" />
      
      {/* Environment for distinct reflections on rounded edges */}
      <Environment preset="city" blur={1} />
      
      {/* Category-specific abstract model */}
      {category === "Confectionery" && <MarshmallowAbstract />}
      {category === "Toys" && <PlushAbstract />}
      {category === "Snacks" && <JellyAbstract />}
      
      {/* Minimal platform with RoundedBox */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.05, 32]} />
        <meshStandardMaterial
          color="#F8F9FA"
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Premium Contact Shadows - soft grounding */}
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
        resolution={1024}
      />
    </>
  );
}

export default function ProductCard3D({ category, className = "" }: ProductCard3DProps) {
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
        <SceneContent category={category} />
      </Canvas>
    </div>
  );
}
