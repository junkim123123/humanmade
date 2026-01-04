"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, ContactShadows, Environment, RoundedBox } from "@react-three/drei";
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

// Glass Card Component - Floating Glass Card with internal jewel
function GlassCard({ tintColor, category }: { tintColor: string; category: string }) {
  const groupRef = useRef<THREE.Group>(null);

  // Slow rotation to show off glass refraction
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Glass Card - Thick Rounded Rectangle */}
        <RoundedBox args={[2, 3, 0.2]} radius={0.1} smoothness={4} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={tintColor}
            transmission={0.95}
            roughness={0.2}
            thickness={2.0}
            ior={1.5}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            attenuationColor={tintColor}
            attenuationDistance={1}
          />
        </RoundedBox>
        
        {/* Internal Jewel - White Sphere focal point */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.3}
            metalness={0.1}
            emissive="#FFFFFF"
            emissiveIntensity={0.2}
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
  // Category-specific tint colors
  const tintColors: Record<string, string> = {
    Confectionery: "#F43F5E", // Rose
    Toys: "#60A5FA", // Blue
    Snacks: "#34D399", // Emerald
  };

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
      
      {/* Environment for glass reflections - essential for glassmorphism */}
      <Environment preset="city" />
      
      {/* Glass Card */}
      <GlassCard tintColor={tintColors[category]} category={category} />
      
      {/* Minimal platform */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.05, 32]} />
        <meshStandardMaterial
          color="#F8F9FA"
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={0.6}
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
