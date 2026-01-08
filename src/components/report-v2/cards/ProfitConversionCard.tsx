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
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-stretch">
          
          {/* Left: Public Data Baseline */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                Current Status
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Public Data Baseline</h3>
            <p className="text-sm text-slate-500">
              Based on general market data and public records. Includes standard intermediary markups.
            </p>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Estimated Landed Cost</p>
              <div className="text-3xl font-bold text-slate-700">
                ${currentUnitCost.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-1">per unit</p>
            </div>
          </div>

          {/* Divider / Arrow */}
          <div className="hidden md:flex flex-col justify-center items-center text-slate-300">
            <ArrowRight className="w-8 h-8" />
          </div>

          {/* Right: NexSupply Potential */}
          <div className="flex-1 space-y-4 relative">
            {/* Verified Badge */}
            <div className="absolute -top-2 -right-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                Verified Potential
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                Optimization Goal
              </span>
            </div>
            <h3 className="text-lg font-semibold text-blue-900">NexSupply Network</h3>
            <p className="text-sm text-slate-500">
              Direct factory access bypassing layers. Optimized logistics and duty engineering.
            </p>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <TrendingUp className="w-16 h-16 text-blue-600" />
              </div>
              
              <p className="text-xs text-blue-600 uppercase tracking-wider font-medium mb-1">Target Landed Cost</p>
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-bold text-blue-700">
                  ${potentialUnitCost.toFixed(2)}
                </div>
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  -{Math.round((1 - optimizationFactor) * 100)}%
                </span>
              </div>
              <p className="text-xs text-blue-400 mt-1">per unit</p>
            </div>
          </div>
        </div>

        {/* Profit Impact Section */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-medium text-slate-200 mb-1">Annual Profit Potential</h4>
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">
                +${annualProfitIncrease.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-lg text-slate-400 font-normal ml-2">/ year</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Based on estimated volume of {annualVolume.toLocaleString()} units/year
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3">
              <button
                onClick={onUnlock}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Unlock This Price for $49
              </button>
              <p className="text-xs text-center text-slate-400">
                One-time deposit, 100% refundable if no match found
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
