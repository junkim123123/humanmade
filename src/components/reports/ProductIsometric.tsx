"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, ContactShadows, Environment, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Isometric Camera Setup - zoomed in for texture focus
function IsometricCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    const distance = 5; // Slightly closer for texture focus
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

// Source (Factory) - Large rounded cube
function Factory() {
  return (
    <group position={[-2, 0.8, 0]}>
      <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.1} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial
          color="#64748B"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Process (Shipping) - Connecting cylinder/capsule
function ShippingConnection() {
  return (
    <group position={[0, 0.6, 0]}>
      {/* Main connecting cylinder */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.12, 3.8, 32]} />
        <meshStandardMaterial
          color="#3B82F6"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

// Destination (Warehouse) - Stack of 2 thinner rounded boxes
function Warehouse() {
  return (
    <group position={[2, 0.6, 0]}>
      {/* Bottom box */}
      <RoundedBox args={[1, 0.8, 0.9]} radius={0.1} smoothness={4} position={[0, 0.4, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#F59E0B"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Top box */}
      <RoundedBox args={[0.8, 0.6, 0.7]} radius={0.1} smoothness={4} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial
          color="#F59E0B"
          roughness={0.4}
          metalness={0.1}
        />
      </RoundedBox>
    </group>
  );
}

// Floating particles traveling along the connection (flow simulation)
function FlowParticles() {
  const particlesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      particlesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          // Travel from left to right along the connection
          const progress = ((time * 0.3) + (i * 0.5)) % 4;
          child.position.x = -2 + progress;
          // Subtle vertical float
          child.position.y = 0.6 + Math.sin(time * 2 + i) * 0.1;
        }
      });
    }
  });

  return (
    <group ref={particlesRef}>
      {[...Array(6)].map((_, i) => (
        <mesh key={i} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#3B82F6"
            roughness={0.3}
            metalness={0.2}
            emissive="#3B82F6"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main Scene
function SceneContent() {
  return (
    <>
      <IsometricCamera />
      
      {/* Studio Lighting Setup */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
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
      
      {/* Environment for realistic reflections */}
      <Environment preset="city" blur={1} />
      
      {/* Float animation - gentle hover */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group>
          {/* Supply Chain Composition */}
          <Factory />
          <ShippingConnection />
          <Warehouse />
          
          {/* Flow particles */}
          <FlowParticles />
        </group>
      </Float>
      
      {/* Soft Contact Shadows */}
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
