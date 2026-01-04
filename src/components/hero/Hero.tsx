"use client";

import Link from "next/link";
import ThreeScene from "./ThreeScene";

export default function Hero() {
  return (
    <div className="py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Copy */}
          <div className="flex flex-col gap-6 lg:gap-8 order-2 lg:order-1">
            {/* Eyebrow */}
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Sourcing Intelligence OS
            </p>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Stop overpaying wholesalers.
              <br />
              <span className="text-slate-700">Source direct with execution.</span>
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
              Use our free AI sourcing calculator to see your real landed cost and margins. We only get paid when you decide to order.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/analyze"
                className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-slate-900 text-white font-medium text-base hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Start free analysis
              </Link>
              <Link
                href="/reports/toy-example"
                className="inline-flex items-center text-slate-700 font-medium text-base hover:text-slate-900 transition-colors"
              >
                View sample report
              </Link>
            </div>

            {/* Trust Line */}
            <p className="text-sm text-slate-500">
              No credit card required. 3 minutes.
            </p>
          </div>

          {/* Right Column - 3D Scene */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center">
            <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[520px] rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 to-violet-50 overflow-hidden shadow-lg">
              <ThreeScene />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

