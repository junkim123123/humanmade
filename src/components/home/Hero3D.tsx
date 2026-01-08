"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 3D Box Component with animation
function AnimatedBox({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#1e40af"
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}

// Particle System
function Particles({ count = 100 }: { count?: number }) {
  const particles = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (particles.current) {
      particles.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const time = state.clock.elapsedTime;
          child.position.y = (Math.sin(time * 0.5 + i) * 0.5) + (i % 10) * 0.3 - 1.5;
          child.rotation.x += 0.01;
          child.rotation.y += 0.01;
        }
      });
    }
  });

  return (
    <group ref={particles}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
          ]}
        >
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial 
            color="#60a5fa" 
            emissive="#3b82f6" 
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main 3D Scene
function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
      
      {/* Animated Boxes */}
      <AnimatedBox position={[-2, 0, 0]} />
      <AnimatedBox position={[2, 0, 0]} />
      <AnimatedBox position={[0, -1.5, -1]} />
      <AnimatedBox position={[0, 1.5, -1]} />
      
      {/* Particles */}
      <Particles count={150} />
      
      {/* Environment for reflections */}
      <Environment preset="city" />
      
      {/* Controls - disabled for hero, but available for debugging */}
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
    </>
  );
}

// Loading fallback
function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-electric-blue-200 border-t-electric-blue-600 rounded-full animate-spin" />
    </div>
  );
}

export function Hero3D() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80 z-10" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-electric-blue-500/20 backdrop-blur-sm text-electric-blue-300 rounded-full text-sm font-semibold mb-6 border border-electric-blue-500/30">
            <span>Trusted by B2B Importers</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
            Source Smarter,
            <br />
            <span className="bg-gradient-to-r from-electric-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Import Faster
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Let's find your factory.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/analyze">
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[220px] h-14 text-base font-semibold bg-electric-blue-600 hover:bg-electric-blue-700 shadow-xl shadow-electric-blue-500/50 transition-all hover:scale-105"
              >
                무료 Analyze
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/reports/toy-example">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto min-w-[220px] h-14 text-base font-semibold border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all"
              >
                <Play className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Real-time quotes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Verified suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Risk analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}

