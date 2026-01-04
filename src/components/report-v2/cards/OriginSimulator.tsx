"use client";

import { useState } from "react";
import { computeOriginImpact, getTopOriginCountries } from "@/lib/report/localSimulators";

interface OriginSimulatorProps {
  report: any;
}

export default function OriginSimulator({ report }: OriginSimulatorProps) {
  const inputStatus = report.inputStatus || report.data?.inputStatus || report._proof?.inputStatus || report.extras?.inputStatus || {};
  const originMissing = !inputStatus.originConfirmed || !inputStatus.originCountry;
  
  // Only show if origin is missing
  if (!originMissing) {
    return null;
  }
  
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);
  const origins = getTopOriginCountries(report);
  
  const impact = selectedOrigin ? computeOriginImpact(report, selectedOrigin) : null;
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-[16px] font-semibold text-slate-900">Origin simulation</h3>
        <p className="text-[13px] text-slate-500 mt-1">See how origin affects duty and landed cost</p>
      </div>
      
      <div className="px-6 py-5 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {origins.map((origin) => (
            <button
              key={origin}
              onClick={() => setSelectedOrigin(origin === selectedOrigin ? null : origin)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                selectedOrigin === origin
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
            >
              {origin}
            </button>
          ))}
        </div>
        
        {impact && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-600">Selected origin:</span>
              <span className="text-slate-900 font-medium">{impact.selectedOrigin}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-600">Duty rate:</span>
              <span className="text-slate-900 font-medium">{impact.selectedDutyRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-slate-600">Landed cost impact:</span>
              <span className={`font-medium ${impact.landedCostImpact >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                {impact.landedCostImpact >= 0 ? "+" : ""}${impact.landedCostImpact.toFixed(2)} per unit
              </span>
            </div>
            {impact.marginImpactPct !== null && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-600">Margin impact:</span>
                <span className={`font-medium ${impact.marginImpactPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {impact.marginImpactPct >= 0 ? "+" : ""}{impact.marginImpactPct.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

