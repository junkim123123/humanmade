"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

// Factory - 왼쪽 (추상 공장)
function Factory() {
  return (
    <group position={[-2.5, 0.8, 0]}>
      {/* Main factory building */}
      <RoundedBox args={[1.2, 1, 1]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial
          color="#64748B"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Chimney 1 */}
      <RoundedBox args={[0.15, 0.8, 0.15]} radius={0.05} smoothness={4} position={[-0.4, 1.2, 0.3]} castShadow>
        <meshStandardMaterial
          color="#475569"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Chimney 2 */}
      <RoundedBox args={[0.15, 0.6, 0.15]} radius={0.05} smoothness={4} position={[0.4, 1.1, 0.3]} castShadow>
        <meshStandardMaterial
          color="#475569"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Shipment Container - 중앙 (해상 운송)
function Shipment() {
  return (
    <group position={[0, 0.6, 0]}>
      {/* Main container body */}
      <RoundedBox args={[1.8, 0.8, 1]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial
          color="#60A5FA"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Container top lid */}
      <RoundedBox args={[1.85, 0.15, 1.05]} radius={0.05} smoothness={4} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial
          color="#3B82F6"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Subtle highlights for glossy effect */}
      <RoundedBox args={[1.7, 0.05, 0.9]} radius={0.05} smoothness={4} position={[0, 0.45, -0.4]}>
        <meshStandardMaterial
          color="#34D399"
          roughness={0.3}
          metalness={0.15}
          transparent
          opacity={0.3}
        />
      </RoundedBox>
    </group>
  );
}

// Warehouse - 오른쪽 (창고 스택)
function Warehouse() {
  return (
    <group position={[2.5, 0.5, 0]}>
      {/* Bottom box */}
      <RoundedBox args={[1.1, 0.6, 0.9]} radius={0.05} smoothness={4} position={[0, 0.3, 0]} castShadow receiveShadow rotation={[0, 0, 0.05]}>
        <meshStandardMaterial
          color="#D97706"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Middle box */}
      <RoundedBox args={[0.9, 0.5, 0.7]} radius={0.05} smoothness={4} position={[-0.1, 0.75, 0.1]} castShadow rotation={[0, 0, -0.03]}>
        <meshStandardMaterial
          color="#F59E0B"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Top box */}
      <RoundedBox args={[0.7, 0.4, 0.5]} radius={0.05} smoothness={4} position={[-0.2, 1.15, 0.2]} castShadow rotation={[0, 0, 0.05]}>
        <meshStandardMaterial
          color="#FBBF24"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Connecting Pipeline - 연결 파이프라인
function Pipeline() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // 미묘한 애니메이션으로 흐름 표현
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.name === "flow") {
          const time = state.clock.elapsedTime;
          child.position.x = Math.sin(time * 0.5 + i) * 0.05;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Factory to Shipment */}
      <RoundedBox args={[2.3, 0.08, 0.08]} radius={0.05} smoothness={4} position={[-1.25, 0.65, 0]} castShadow>
        <meshStandardMaterial
          color="#64748B"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Shipment to Warehouse */}
      <RoundedBox args={[2.3, 0.08, 0.08]} radius={0.05} smoothness={4} position={[1.25, 0.55, 0]} castShadow>
        <meshStandardMaterial
          color="#64748B"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Flow indicators */}
      {[...Array(8)].map((_, i) => {
        const x = -2.5 + (i * 0.7);
        return (
          <mesh
            key={i}
            name="flow"
            position={[x, 0.65, 0]}
            castShadow
          >
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#3B82F6"
              roughness={0.3}
              metalness={0.8}
              emissive="#3B82F6"
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Main Scene
function SceneContent() {
  return (
    <>
      <IsometricCamera />
      
      {/* Premium Studio Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={15}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-radius={3}
      />
      
      {/* Environment for realistic reflections on rounded edges */}
      <Environment preset="city" blur={1} />
      
      {/* Float animation for entire scene - gentle floating */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group>
          {/* Supply Chain Objects */}
          <Factory />
          <Shipment />
          <Warehouse />
          
          {/* Connecting Pipeline */}
          <Pipeline />
        </group>
      </Float>
      
      {/* Premium Contact Shadows - soft grounding */}
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
        color="#4B5563"
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
