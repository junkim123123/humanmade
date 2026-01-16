"use client";

import FlowScene from "./FlowScene";

export default function FlowDiorama() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Copy - Centered */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
            From product photo to landed cost, then to your door.
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            We turn a single product photo into a verified sourcing plan, with factories, costs, and logistics mapped out.
          </p>
        </div>

        {/* 3D Diorama Canvas */}
        <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] mb-12 lg:mb-16 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 overflow-hidden shadow-lg">
          <FlowScene />
        </div>

        {/* 3-Column Text Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Analyze */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h3 className="text-lg font-semibold text-slate-900">Cost Analysis (Free)</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Upload a product photo. Our AI calculates your real landed cost and margin estimate in minutes.
            </p>
          </div>

          {/* Verify */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <h3 className="text-lg font-semibold text-slate-900">Feasibility ($49)</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              $49 unlocks a full feasibility report: 3 direct factory quotes, real tariffs, and a door-to-door delivery roadmap.
            </p>
          </div>

          {/* Execute */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <h3 className="text-lg font-semibold text-slate-900">Fulfillment (7%)</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              We handle production and quality control. You pay a 7% fee only when your verified goods are ready to ship.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

