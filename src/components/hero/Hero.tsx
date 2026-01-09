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
        className="relative backdrop-blur-md bg-white/80 rounded-2xl shadow-2xl shadow-purple-500/10 border-2 border-slate-200/50 p-4 sm:p-6 lg:p-8 cursor-pointer"
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
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-slate-900">Price Comparison</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider">Example Basis</span>
          </div>
          <p className="text-sm text-slate-500">Sample Product: Premium Cotton T-shirt</p>
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
              <p className="text-xl font-bold text-slate-900">$12.5</p>
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
              <p className="text-2xl font-bold text-purple-600">$8.3</p>
              <p className="text-xs text-purple-600 font-medium">per unit</p>
            </div>
          </div>
        </div>

        {/* Savings Badge */}
        <div className="mt-6 pt-6 border-t border-slate-200/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Profit Unlocked</span>
            <span className="text-lg font-bold text-emerald-600">
              <CountUp from={0} to={4.2} decimals={1} prefix="$" suffix="/unit" />
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
    <div className="relative flex flex-col lg:flex-row items-center justify-between min-h-[90vh] bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <MeshGradient />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-16">
          {/* Left Column - Copy */}
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-12 w-full lg:w-1/2">
            {/* Eyebrow */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
                Your AI Sourcing Team
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100 w-fit uppercase tracking-tight">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Sample Analysis Basis: Premium Cotton T-shirt
              </div>
            </div>

            {/* Headline - Premium sizing - Updated to concise messaging */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05] drop-shadow-sm">
              Triple Your Margin.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">Go Factory Direct.</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl font-medium">
              Use our free AI sourcing calculator to verify your real landed cost and secure 3x higher margins. We only make money when your goods arrive at the warehouse.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-start gap-4">
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
              >
                Analyze My Sourcing (Free)
              </Link>
              <Link
                href="/reports/sample-report/v2"
                className="inline-flex items-center text-slate-500 font-medium text-sm hover:text-blue-600 transition-colors group"
              >
                <span className="border-b border-transparent group-hover:border-blue-600 transition-all">View Sample AI Report</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            {/* Urgency Micro-copy */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200/60">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></div>
              <p className="text-sm text-amber-800">
                Toys & Confectionery categories are seeing 15% faster lead times this month.
              </p>
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

