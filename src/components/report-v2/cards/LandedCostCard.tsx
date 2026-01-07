"use client";

import { BarChart3 } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface LandedCostCardProps {
  costRange: Report["baseline"]["costRange"];
}

export default function LandedCostCard({ costRange }: LandedCostCardProps) {
  const conservative = costRange?.conservative?.totalLandedCost || 0;
  const standard = costRange?.standard?.totalLandedCost || 0;
  const min = Math.min(conservative, standard);
  const max = Math.max(conservative, standard);
  const mid = (min + max) / 2;
  const unitPriceDraft = true;

  // Range visualization
  const rangePercent = max > 0 ? ((mid - min) / (max - min)) * 100 : 50;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Landed cost</h3>
      </div>

      {/* Range Visualization */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-slate-900">${min.toFixed(2)}</span>
          <span className="text-xs text-slate-500">–</span>
          <span className="text-2xl font-bold text-slate-900">${max.toFixed(2)}</span>
        </div>
        
        {/* Animated Range Bar */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${(max - min) / max * 100}%` }}
          />
        </div>

        {/* Most likely marker */}
        <div className="flex justify-center mt-2 relative">
          <div 
            className="flex flex-col items-center"
            style={{ marginLeft: `${rangePercent}%` }}
          >
            <div className="w-1 h-2 bg-slate-400" />
            <span className="text-xs text-slate-600 mt-1">${mid.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Cost drivers */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        <CostDriver 
          label="Factory unit price estimate" 
          value={costRange?.standard?.unitPrice || 0} 
          percent={standard > 0 ? ((costRange?.standard?.unitPrice || 0) / standard * 100) : 0}
          draft={unitPriceDraft}
        />
        <CostDriver 
          label="Shipping" 
          value={costRange?.standard?.shippingPerUnit || 0} 
          percent={standard > 0 ? ((costRange?.standard?.shippingPerUnit || 0) / standard * 100) : 0}
        />
        <CostDriver 
          label="Duty" 
          value={costRange?.standard?.dutyPerUnit || 0} 
          percent={standard > 0 ? ((costRange?.standard?.dutyPerUnit || 0) / standard * 100) : 0}
        />
        <CostDriver 
          label="Fees" 
          value={costRange?.standard?.feePerUnit || 0} 
          percent={standard > 0 ? ((costRange?.standard?.feePerUnit || 0) / standard * 100) : 0}
        />
      </div>
    </div>
  );
}

function CostDriver({ label, value, percent, draft }: { label: string; value: number; percent: number; draft?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 flex items-center gap-2">
        {label}
        {draft && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Draft</span>}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-400"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="font-medium text-slate-900 w-12 text-right">${value.toFixed(2)}</span>
      </div>
    </div>
  );
}
