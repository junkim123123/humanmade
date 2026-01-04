"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, ContactShadows, Environment, RoundedBox, Sphere } from "@react-three/drei";
import * as THREE from "three";

// Isometric Camera Setup
function IsometricCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    const distance = 4; // Bring camera much closer
    const angleX = Math.PI / 6; // 30도
    const angleY = Math.PI / 4; // 45도
    
    // Better angle: adjusted position for immersive view
    const x = distance * 1.2;
    const y = distance * 0.8;
    const z = distance;
    
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 30; // Reduced FOV for zoom effect (lower = more zoom)
      camera.zoom = 2.5; // Increase zoom significantly (equivalent to zoom=150 scale)
      camera.near = 0.1;
      camera.far = 1000;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
}

// Connection Lines - Glowing purple lines connecting elements
function ConnectionLine({ start, end, color = "#A78BFA" }: { start: [number, number, number]; end: [number, number, number]; color?: string }) {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} opacity={0.4} transparent linewidth={2} />
    </line>
  );
}

// Abstract Factory - Large transparent building with internal structure
function FactoryBuilding() {
  return (
    <group position={[-3, 1.2, -1]}>
      {/* Main building */}
      <RoundedBox args={[1.8, 2, 1.8]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#A78BFA"
          transmission={0.7}
          roughness={0.15}
          thickness={2.0}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </RoundedBox>
      
      {/* Internal structure - vertical beams */}
      {[0, 0.5, -0.5].map((x, i) => (
        <RoundedBox
          key={i}
          args={[0.08, 1.8, 0.08]}
          radius={0.02}
          smoothness={4}
          position={[x, 0, 0]}
        >
          <meshStandardMaterial color="#C4B5FD" emissive="#C4B5FD" emissiveIntensity={0.3} />
        </RoundedBox>
      ))}
      
      {/* Top antenna */}
      <RoundedBox args={[0.1, 0.6, 0.1]} radius={0.05} smoothness={4} position={[0, 1.4, 0]}>
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.5} />
      </RoundedBox>
    </group>
  );
}

// Shipping Container - Flat container with flowing particles
function ShippingContainer() {
  const particlesRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      particlesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const progress = ((time * 0.4) + (i * 0.3)) % 3;
          child.position.x = -1.5 + progress;
        }
      });
    }
  });
  
  return (
    <group position={[0, 0.8, 0]}>
      {/* Main container */}
      <RoundedBox args={[3.5, 0.4, 1.2]} radius={0.05} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#22D3EE"
          transmission={0.65}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
        />
      </RoundedBox>
      
      {/* Container lid */}
      <RoundedBox args={[3.6, 0.15, 1.25]} radius={0.05} smoothness={4} position={[0, 0.28, 0]} castShadow>
        <meshPhysicalMaterial
          color="#06B6D4"
          transmission={0.7}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
        />
      </RoundedBox>
      
      {/* Flowing particles inside */}
      <group ref={particlesRef}>
        {[...Array(6)].map((_, i) => (
          <mesh key={i} position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Warehouse Stack - Multiple stacked boxes
function WarehouseStack() {
  return (
    <group position={[3, 0.9, 1]}>
      {/* Bottom box */}
      <RoundedBox args={[1.2, 0.6, 1]} radius={0.05} smoothness={4} position={[0, 0.3, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#FDBA74"
          transmission={0.6}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
        />
      </RoundedBox>
      {/* Middle box */}
      <RoundedBox args={[1, 0.5, 0.8]} radius={0.05} smoothness={4} position={[-0.1, 0.75, 0.1]} castShadow>
        <meshPhysicalMaterial
          color="#FBBF24"
          transmission={0.65}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
        />
      </RoundedBox>
      {/* Top box */}
      <RoundedBox args={[0.8, 0.4, 0.6]} radius={0.05} smoothness={4} position={[-0.2, 1.15, 0.2]} castShadow>
        <meshPhysicalMaterial
          color="#FCD34D"
          transmission={0.7}
          roughness={0.2}
          thickness={1.5}
          ior={1.5}
          clearcoat={1.0}
        />
      </RoundedBox>
    </group>
  );
}

// Abstract Icons - Small floating elements representing products/services
function AbstractIcons() {
  const iconsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (iconsRef.current) {
      const time = state.clock.elapsedTime;
      iconsRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Group) {
          child.rotation.y = time * 0.3 + i;
          child.position.y = Math.sin(time * 0.5 + i) * 0.2;
        }
      });
    }
  });
  
  const iconPositions: Array<[number, number, number]> = [
    [-1.5, 2.5, -0.5],
    [1.5, 2.2, 0.8],
    [-2, 1.5, 1.5],
    [2.5, 1.8, -0.8],
    [0, 2.8, -1.2],
  ];
  
  const iconColors = ["#F43F5E", "#60A5FA", "#34D399", "#F59E0B", "#A78BFA"];
  
  return (
    <group ref={iconsRef}>
      {iconPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Main icon shape - icosahedron */}
          <mesh castShadow>
            <icosahedronGeometry args={[0.25, 0]} />
            <meshPhysicalMaterial
              color={iconColors[i]}
              transmission={0.5}
              roughness={0.1}
              thickness={0.5}
              ior={1.5}
              clearcoat={1.0}
            />
          </mesh>
          {/* Glow effect */}
          <mesh>
            <icosahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color={iconColors[i]}
              emissive={iconColors[i]}
              emissiveIntensity={0.3}
              transparent
              opacity={0.3}
            />
          </mesh>
        </group>
      ))}
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
      <spotLight
        position={[10, 10, 10]}
        angle={0.2}
        penumbra={1}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.4} color="#A78BFA" />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#22D3EE" />
      
      {/* Environment for glass reflections */}
      <Environment preset="city" />
      
      {/* Float animation - dramatic movement */}
      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={1}>
        <group position={[0, 0.5, 0]}>
          {/* Main Supply Chain Elements */}
          <FactoryBuilding />
          <ShippingContainer />
          <WarehouseStack />
          
          {/* Abstract Icons */}
          <AbstractIcons />
          
          {/* Connection Lines - Swell style purple lines */}
          <ConnectionLine start={[-2.1, 1.2, -1]} end={[-1.75, 0.8, 0]} />
          <ConnectionLine start={[1.75, 0.8, 0]} end={[2.1, 0.9, 1]} />
          <ConnectionLine start={[-3, 1.2, -1]} end={[-1.5, 2.5, -0.5]} />
          <ConnectionLine start={[0, 0.8, 0]} end={[1.5, 2.2, 0.8]} />
          <ConnectionLine start={[3, 0.9, 1]} end={[2.5, 1.8, -0.8]} />
          <ConnectionLine start={[-1.5, 2.5, -0.5]} end={[0, 2.8, -1.2]} />
          <ConnectionLine start={[1.5, 2.2, 0.8]} end={[0, 2.8, -1.2]} />
        </group>
      </Float>
      
      {/* Soft Contact Shadows */}
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.3}
        scale={12}
        blur={3}
        far={5}
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
