"use client";

import Link from "next/link";
import ThreeScene from "./ThreeScene";

export default function Hero() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between min-h-[90vh] bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Column - Copy */}
          <div className="flex flex-col gap-8 lg:gap-12 w-full lg:w-1/2">
            {/* Eyebrow */}
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Sourcing Intelligence OS
            </p>

            {/* Headline - HUGE */}
            <h1 className="text-6xl lg:text-8xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
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

          {/* Right Column - 3D Scene - BIG */}
          <div className="w-full lg:w-1/2 h-[60vh] lg:h-[90vh] relative">
            <ThreeScene />
          </div>
        </div>
      </div>
    </div>
  );
}

