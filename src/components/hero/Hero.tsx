"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { CountUp } from "@/components/animation/CountUp";

// Animated Mesh Gradient Background
function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -inset-10 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
}

// Floating UI Card - Price Comparison with 3D Tilt Effect
function FloatingUICard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="w-full max-w-md mx-auto" style={{ perspective: 1000 }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative backdrop-blur-md bg-white/70 rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8 cursor-pointer"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Card Header */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Price Comparison</h3>
          <p className="text-sm text-slate-500 mt-1">Per unit cost analysis</p>
        </div>

        {/* Comparison Rows */}
        <div className="space-y-4">
          {/* Wholesale Row */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">Wholesale</p>
              <p className="text-sm text-slate-500">Traditional sourcing</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900">$12.50</p>
              <p className="text-xs text-slate-500">per unit</p>
            </div>
          </div>

          {/* NexSupply Row */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <div>
              <p className="font-semibold text-slate-900">NexSupply</p>
              <p className="text-sm text-purple-600">Direct sourcing</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">$8.30</p>
              <p className="text-xs text-purple-600 font-medium">per unit</p>
            </div>
          </div>
        </div>

        {/* Savings Badge */}
        <div className="mt-6 pt-6 border-t border-slate-200/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Profit Unlocked</span>
            <span className="text-lg font-bold text-emerald-600">
              <CountUp from={0} to={4.20} decimals={2} prefix="$" suffix="/unit" />
            </span>
          </div>
        </div>

        {/* Glossy overlay effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"></div>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  return (
    <div className="relative flex flex-col lg:flex-row items-center justify-between min-h-[90vh] bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <MeshGradient />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-16">
          {/* Left Column - Copy */}
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12 w-full lg:w-1/2">
            {/* Eyebrow */}
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Sourcing Intelligence OS
            </p>

            {/* Headline - Premium sizing */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Stop overpaying wholesalers.
              <br />
              <span className="text-slate-700">Source direct from factories.</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-xl">
              Use our free AI sourcing calculator to verify your real landed cost and secure 3x higher margins. We only make money when your goods arrive at the warehouse.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-slate-900 text-white font-medium text-base hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Calculate My Savings (Free)
              </Link>
              <Link
                href="/reports/toy-example"
                className="inline-flex items-center text-slate-700 font-medium text-base hover:text-slate-900 transition-colors"
              >
                View Sample Blueprint Report
              </Link>
            </div>

            {/* Trust Line */}
            <p className="text-sm text-slate-500">
              No credit card required. 3 minutes.
            </p>
          </div>

          {/* Right Column - Floating UI Card */}
          <div className="w-full lg:w-1/2 flex items-center justify-center lg:h-[90vh] relative mt-8 sm:mt-0">
            <FloatingUICard />
          </div>
        </div>
      </div>
    </div>
  );
}

