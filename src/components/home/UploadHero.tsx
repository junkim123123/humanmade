"use client";

import React from "react";

interface UploadHeroProps {
  onPrimaryClick?: () => void;
}

const breakdown = [
  { label: "Factory FOB", value: "$1.24" },
  { label: "Freight & Duty", value: "$0.86" },
  { label: "NexSupply Fee (10%)", value: "$0.12" },
];

export default function UploadHero({ onPrimaryClick }: UploadHeroProps) {

  const handlePrimary = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
      return;
    }
    window.location.href = "/analyze";
  };

  return (
    <div className="landing-container">
      <div className="py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <h1 className="text-[36px] leading-[1.1] font-bold tracking-[-0.02em] text-slate-900 sm:text-[48px]">
                Stop Overpaying Wholesalers.<br />Source Direct with Execution.
              </h1>
              <p className="text-[17px] leading-[1.5] text-slate-600 max-w-md">
                Use our Free AI Sourcing Calculator to see your real margins. We only get paid when you decide to order.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handlePrimary}
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-900 px-6 text-[15px] font-medium text-white transition-all hover:bg-slate-800 active:scale-[0.98] whitespace-nowrap"
              >
                Start Free Analysis
              </button>
              <a
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-[15px] font-medium text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] whitespace-nowrap"
                href="/sample-report/v2"
              >
                View sample report
              </a>
            </div>
            
            {/* Micro-copy */}
            <p className="text-[13px] text-slate-500">
              No credit card required. 3 minutes.
            </p>
          </div>

          {/* Right: Report Preview Card */}
          <div className="lg:justify-self-end w-full max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Header with Sample badge */}
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-medium text-slate-500">Delivered cost per unit</div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Sample scenario
                </span>
              </div>

              {/* Main Price */}
              <div className="mt-5">
                <span className="text-[40px] font-semibold tracking-tight text-slate-900 tabular-nums">$2.22</span>
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-slate-100" />

              {/* Breakdown */}
              <div className="space-y-2.5">
                {breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[14px] text-slate-500">{item.label}</span>
                    <span className="text-[14px] font-medium text-slate-900 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
