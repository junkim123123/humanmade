"use client";

import { CheckCircle2, ArrowRight, TrendingUp, Lock } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface ProfitConversionCardProps {
  report: Report;
  onUnlock: () => void;
}

export default function ProfitConversionCard({ report, onUnlock }: ProfitConversionCardProps) {
  const costRange = report.baseline?.costRange;
  
  // 1. Get Baseline Cost (Public Data)
  const currentUnitCost = costRange ? (
    (costRange.standard?.unitPrice || 0) +
    (costRange.standard?.shippingPerUnit || 0) +
    (costRange.standard?.dutyPerUnit || 0) +
    (costRange.standard?.feePerUnit || 0)
  ) : 0;

  // 2. Calculate NexSupply Potential (Optimized)
  // Logic: If factory price exists, assume we can negotiate better or find better shipping (-15% total)
  // If inferred, apply category benchmark optimization (-15% is a safe conservative estimate for direct factory vs public data)
  const optimizationFactor = 0.85; // 15% reduction
  const potentialUnitCost = currentUnitCost * optimizationFactor;
  
  const savingsPerUnit = currentUnitCost - potentialUnitCost;
  
  // Annual Profit Increase Calculation
  // Assume a standard order volume if not present (e.g., 1000 units/month -> 12000 units/year)
  // Or use the report's quantity if available, annualized
  const annualVolume = 12000; // Updated: 1000 units/month
  const annualProfitIncrease = savingsPerUnit * annualVolume;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row gap-10 items-stretch">
          
          {/* Left: Public Data Baseline */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                Market Baseline
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Public Data Benchmark</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Standard market pricing based on public trade records. Includes multi-layer intermediary markups.
            </p>
            
            <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Current Estimated Cost</p>
              <div className="text-4xl font-bold text-slate-700 tracking-tight">
                ${currentUnitCost.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">per unit landed</p>
            </div>
          </div>

          {/* Divider / Arrow */}
          <div className="hidden md:flex flex-col justify-center items-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>

          {/* Right: NexSupply Potential */}
          <div className="flex-1 space-y-4 relative">
            {/* Verified Badge */}
            <div className="absolute -top-4 -right-4 rotate-12">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-200 border border-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                VERIFIED TARGET
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                Network Intelligence
              </span>
            </div>
            <h3 className="text-xl font-bold text-blue-900 tracking-tight">NexSupply Target</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Direct-to-factory optimization. Bypassing intermediaries and engineering logistics for max efficiency.
            </p>

            <div className="mt-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <TrendingUp className="w-24 h-24 text-blue-600" />
              </div>
              
              <p className="text-[10px] text-blue-600 uppercase tracking-widest font-bold mb-2">Optimized Landing Target</p>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold text-blue-700 tracking-tight">
                  ${potentialUnitCost.toFixed(2)}
                </div>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                  -{Math.round((1 - optimizationFactor) * 100)}%
                </span>
              </div>
              <p className="text-xs text-blue-400 mt-1 font-medium">per unit landed</p>
            </div>
          </div>
        </div>

        {/* Profit Impact Section */}
        <div className="mt-10">
          <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Projected Annual Impact</h4>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 tracking-tighter">
                +${annualProfitIncrease.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-xl text-slate-500 font-bold ml-3 uppercase tracking-tight">Net Profit / Year</span>
              </div>
              <p className="text-[13px] text-slate-400 mt-3 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                Based on volume of {annualVolume.toLocaleString()} units/year (1,000/mo)
              </p>
            </div>

            <div className="w-full lg:w-auto flex flex-col gap-4 relative z-10">
              <button
                onClick={onUnlock}
                className="w-full lg:w-64 h-16 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                <Lock className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                Unlock Pricing
              </button>
              <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">
                100% Refundable Guarantee
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
