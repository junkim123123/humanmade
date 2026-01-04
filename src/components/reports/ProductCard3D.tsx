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

// 1. Confectionery - Abstract Marshmallow (Torus intersecting with Capsule)
function MarshmallowAbstract() {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <group position={[0, 0.5, 0]}>
        {/* Main capsule body */}
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
          <meshStandardMaterial
            color="#F43F5E"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
        {/* Intersecting torus (donut shape) */}
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.38, 0.08, 16, 32]} />
          <meshStandardMaterial
            color="#F43F5E"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
        {/* Second intersecting torus for depth */}
        <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]} castShadow>
          <torusGeometry args={[0.35, 0.06, 16, 32]} />
          <meshStandardMaterial
            color="#FB7185"
            roughness={0.9}
            metalness={0.0}
            transparent
            opacity={0.7}
          />
        </mesh>
      </group>
    </Float>
  );
}

// 2. Toys - Abstract Plush (Three soft spheres merging)
function PlushAbstract() {
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.35}>
      <group position={[0, 0.6, 0]}>
        {/* Main body sphere (largest, bottom) */}
        <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#60A5FA"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Head sphere (top-left, merging) */}
        <mesh position={[-0.2, 0.4, 0.15]} castShadow>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial
            color="#60A5FA"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Third sphere (top-right accent) */}
        <mesh position={[0.25, 0.35, -0.1]} castShadow>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial
            color="#93C5FD"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      </group>
    </Float>
  );
}

// 3. Snacks - Abstract Jelly (Glass Icosahedron gem)
function JellyAbstract() {
  return (
    <Float speed={1.8} rotationIntensity={0.5} floatIntensity={0.4}>
      <group position={[0, 0.5, 0]}>
        {/* Main icosahedron - glass gem effect */}
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshPhysicalMaterial
            color="#34D399"
            transmission={0.6}
            roughness={0.1}
            thickness={0.5}
            metalness={0.0}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
          />
        </mesh>
        {/* Secondary smaller icosahedron inside for depth */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.25, 0]} />
          <meshPhysicalMaterial
            color="#6EE7B7"
            transmission={0.7}
            roughness={0.05}
            thickness={0.3}
            metalness={0.0}
            ior={1.4}
            transparent
            opacity={0.5}
          />
        </mesh>
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
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-3, 2, -3]} intensity={0.3} color="#ffffff" />
      
      {/* Environment for glass material sparkle */}
      <Environment preset="lobby" />
      
      {/* Category-specific abstract model */}
      {category === "Confectionery" && <MarshmallowAbstract />}
      {category === "Toys" && <PlushAbstract />}
      {category === "Snacks" && <JellyAbstract />}
      
      {/* Minimal platform */}
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
      
      {/* Soft Contact Shadows */}
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
