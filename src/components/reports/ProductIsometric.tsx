"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, ContactShadows, Environment, Text } from "@react-three/drei";
import * as THREE from "three";

// Isometric Camera Setup - 정확한 아이소메트릭 각도
function IsometricCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    // 아이소메트릭 뷰: x축 각도 30도, y축 각도 45도
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

// Brown Cube Component - 정교한 갈색 정육면체
function BrownCube() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // 미묘한 회전 애니메이션
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group position={[0, 0.6, 0]} rotation={[-0.05, 0.15, 0]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial
          color="#9E7B5D"
          roughness={0.35}
          metalness={0.15}
          flatShading={false}
        />
      </mesh>
      {/* 면별 다른 음영을 위한 추가 메시 */}
      <mesh position={[0, 0.4, -0.4]} receiveShadow>
        <boxGeometry args={[0.8, 0.01, 0.01]} />
        <meshStandardMaterial
          color="#8B6B4D"
          roughness={0.4}
          opacity={0.3}
          transparent
        />
      </mesh>
    </group>
  );
}

// Gray Base Platform - 정교한 회색 받침대
function GrayBase() {
  return (
    <group position={[0, 0, 0]} rotation={[-0.05, 0.15, 0]}>
      {/* Upper platform layer - 밝은 회색 */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.15, 1.2]} />
        <meshStandardMaterial
          color="#AAB2BD"
          roughness={0.55}
          metalness={0.25}
        />
      </mesh>
      {/* Lower platform layer - 어두운 회색 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.1, 1.5]} />
        <meshStandardMaterial
          color="#5F6B7A"
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>
      {/* 그림자를 위한 추가 레이어 */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.02, 1.35]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.8}
          opacity={0.4}
          transparent
        />
      </mesh>
    </group>
  );
}

// Blue Square - 떠 있는 파란색 정사각형
function BlueSquare() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.002;
      meshRef.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <Float speed={0.8} rotationIntensity={0.4} floatIntensity={0.3}>
      <group position={[0.8, 1.2, -0.5]} rotation={[0, 0, -0.15]}>
        {/* Main blue square */}
        <mesh ref={meshRef} castShadow>
          <boxGeometry args={[0.6, 0.05, 0.6]} />
          <meshStandardMaterial
            color="#2176D2"
            roughness={0.3}
            metalness={0.3}
            emissive="#2176D2"
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Subtle back layer for depth */}
        <mesh position={[0, -0.02, 0]} castShadow>
          <boxGeometry args={[0.62, 0.03, 0.62]} />
          <meshStandardMaterial
            color="#D8D8D8"
            roughness={0.8}
            metalness={0.1}
            opacity={0.6}
            transparent
          />
        </mesh>
      </group>
    </Float>
  );
}

// Brown Circle - 떠 있는 갈색 원
function BrownCircle() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = 2.2 + Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.4}>
      <mesh
        ref={meshRef}
        position={[-1.5, 2.2, 0.8]}
        castShadow
      >
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#7A5C2B"
          roughness={0.5}
          metalness={0.2}
          emissive="#7A5C2B"
          emissiveIntensity={0.1}
        />
      </mesh>
    </Float>
  );
}

// Main Scene
function SceneContent() {
  return (
    <>
      {/* Isometric Camera */}
      <IsometricCamera />
      
      {/* Advanced Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={15}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-radius={4}
        shadow-blurSamples={25}
      />
      <pointLight position={[-5, 3, -5]} intensity={0.4} color="#ffffff" />
      <pointLight position={[5, 2, 5]} intensity={0.3} color="#E3F2FD" />
      
      {/* Environment for better reflections */}
      <Environment preset="city" />
      
      {/* 3D Objects */}
      <GrayBase />
      <BrownCube />
      <BlueSquare />
      <BrownCircle />
      
      {/* Enhanced Contact Shadows - 더 정교한 그림자 */}
      <ContactShadows
        position={[0, -0.05, 0]}
        opacity={0.3}
        scale={10}
        blur={3}
        far={5}
        color="#4B5563"
        resolution={1024}
      />
      
      {/* 추가 그림자 레이어 */}
      <mesh
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial
          color="#F8F9FA"
          roughness={1}
          metalness={0}
          transparent
          opacity={0.8}
        />
      </mesh>
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
          stencil: false,
          depth: true,
        }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}

