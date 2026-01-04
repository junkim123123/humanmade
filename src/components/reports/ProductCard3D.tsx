"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

// Confectionery - Marshmallow (부드러운 마시멜로우 형태)
function Marshmallow() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.15}>
      <group ref={groupRef} position={[0, 0.5, 0]}>
        {/* Main marshmallow body - 둥근 원통형 */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.6, 32]} />
          <meshStandardMaterial
            color="#FFF5E6"
            roughness={0.3}
            metalness={0.05}
            emissive="#FFF5E6"
            emissiveIntensity={0.1}
          />
        </mesh>
        {/* Top rounded cap */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.25}
            metalness={0.05}
          />
        </mesh>
        {/* Bottom rounded cap */}
        <mesh position={[0, -0.35, 0]} castShadow>
          <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial
            color="#FFF8E1"
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
        {/* Sparkle effects */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 0.45;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * radius, (Math.sin(angle * 2) * 0.2) - 0.1, Math.sin(angle) * radius]}
              castShadow
            >
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial
                color="#FFE0B2"
                roughness={0.1}
                metalness={0.8}
                emissive="#FFE0B2"
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

// Toys - Plush Toy (부드러운 플러시 토이 형태)
function PlushToy() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.15;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <Float speed={0.4} rotationIntensity={0.25} floatIntensity={0.2}>
      <group ref={groupRef} position={[0, 0.6, 0]}>
        {/* Main body - 부드러운 구형 */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial
            color="#FFB6C1"
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial
            color="#FFC0CB"
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.25, 0.7, 0.2]} rotation={[-0.3, -0.3, 0.3]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#FFA0B0"
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0.25, 0.7, 0.2]} rotation={[-0.3, 0.3, -0.3]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#FFA0B0"
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.12, 0.58, 0.3]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.12, 0.58, 0.3]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.5, 0.3, 0]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.4, 16]} />
          <meshStandardMaterial
            color="#FFB6C1"
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, -0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.4, 16]} />
          <meshStandardMaterial
            color="#FFB6C1"
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
      </group>
    </Float>
  );
}

// Snacks - Jelly Snacks (반투명 젤리 형태)
function JellySnacks() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={0.6} rotationIntensity={0.3} floatIntensity={0.25}>
      <group ref={groupRef} position={[0, 0.5, 0]}>
        {/* Jelly container base */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.15, 0.6]} />
          <meshStandardMaterial
            color="#E8E8E8"
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
        {/* Jelly pieces - 다양한 색상 */}
        {[
          { pos: [-0.2, 0.2, -0.15], color: "#FF6B9D" },
          { pos: [0.15, 0.25, 0.1], color: "#C44569" },
          { pos: [-0.1, 0.3, 0.2], color: "#F8B500" },
          { pos: [0.2, 0.2, -0.2], color: "#00D2FF" },
        ].map((jelly, i) => (
          <mesh key={i} position={jelly.pos} castShadow>
            <dodecahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial
              color={jelly.color}
              roughness={0.2}
              metalness={0.1}
              transparent
              opacity={0.75}
              emissive={jelly.color}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
        {/* Container lid */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.62, 0.05, 0.62]} />
          <meshStandardMaterial
            color="#F0F0F0"
            roughness={0.3}
            metalness={0.5}
            transparent
            opacity={0.9}
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
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-3, 2, -3]} intensity={0.3} color="#ffffff" />
      
      <Environment preset="city" />
      
      {/* Product-specific 3D model */}
      {category === "Confectionery" && <Marshmallow />}
      {category === "Toys" && <PlushToy />}
      {category === "Snacks" && <JellySnacks />}
      
      {/* Platform */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[1.5, 0.05, 1.5]} />
        <meshStandardMaterial
          color="#F8F9FA"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      <ContactShadows
        position={[0, 0.025, 0]}
        opacity={0.2}
        scale={2}
        blur={1.5}
        far={1}
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

