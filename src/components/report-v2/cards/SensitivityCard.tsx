"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SensitivityCardProps {
  sensitivity: {
    scenarios: Array<{
      label: string;
      assumptionChange: string;
      impactOnLandedCost: {
        change: number;
        newCost: number | null;
      };
      impactOnMargin: {
        change: number | null;
        newMargin: number | null;
      };
    }>;
  };
}

export default function SensitivityCard({ sensitivity }: SensitivityCardProps) {
  const { scenarios } = sensitivity;
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-[16px] font-semibold text-slate-900">What changes your profit the most</h3>
        <p className="text-[13px] text-slate-500 mt-1">Sensitivity analysis based on key assumptions</p>
      </div>
      
      <div className="px-6 py-5 space-y-4">
        {scenarios
          .filter(scenario => {
            // Only show computable scenarios (no N/A placeholders)
            const hasCost = scenario.impactOnLandedCost.newCost !== null;
            const hasChange = scenario.impactOnLandedCost.change !== 0;
            return hasCost || hasChange;
          })
          .map((scenario, idx) => {
            const costChange = scenario.impactOnLandedCost.change;
            const costIcon = costChange > 0 ? TrendingUp : costChange < 0 ? TrendingDown : Minus;
            const costColor = costChange > 0 ? "text-red-600" : costChange < 0 ? "text-emerald-600" : "text-slate-400";
            const CostIcon = costIcon;
            
            return (
              <div key={idx} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="text-[14px] font-semibold text-slate-900 mb-1">{scenario.label}</h4>
                    <p className="text-[12px] text-slate-600 mb-2">{scenario.assumptionChange}</p>
                  </div>
                  {costChange !== 0 && (
                    <div className={`flex items-center gap-1 ${costColor}`}>
                      <CostIcon className="w-4 h-4" />
                      <span className="text-[13px] font-medium">
                        {costChange > 0 ? "+" : ""}{costChange.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  {scenario.impactOnLandedCost.newCost !== null && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-600">Landed cost impact:</span>
                      <span className="text-slate-900 font-medium">
                        ${scenario.impactOnLandedCost.newCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {scenario.impactOnMargin.change !== null && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-600">Margin impact:</span>
                      <span className="text-slate-900 font-medium">
                        {scenario.impactOnMargin.change > 0 ? "+" : ""}
                        {scenario.impactOnMargin.change.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
      
      {scenarios.filter(s => {
        const hasCost = s.impactOnLandedCost.newCost !== null;
        const hasChange = s.impactOnLandedCost.change !== 0;
        return hasCost || hasChange;
      }).length === 0 && null}
    </div>
  );
}

