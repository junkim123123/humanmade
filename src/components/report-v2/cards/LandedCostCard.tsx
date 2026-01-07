"use client";

import { useState } from "react";
import { BarChart3, Info, X } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface LandedCostCardProps {
  costRange: Report["baseline"]["costRange"];
}

export default function LandedCostCard({ costRange }: LandedCostCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const conservative = costRange?.conservative?.totalLandedCost || 0;
  const standard = costRange?.standard?.totalLandedCost || 0;
  const min = Math.min(conservative, standard);
  const max = Math.max(conservative, standard);
  const mid = (min + max) / 2;
  const unitPriceDraft = true;

  // Range visualization
  const rangePercent = max > 0 ? ((mid - min) / (max - min)) * 100 : 50;

  // Extract cost breakdown
  const fobPrice = costRange?.standard?.unitPrice || 0;
  const shipping = costRange?.standard?.shippingPerUnit || 0;
  const duty = costRange?.standard?.dutyPerUnit || 0;
  const fees = costRange?.standard?.feePerUnit || 0;
  const total = standard;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow relative">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Landed cost</h3>
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="ml-auto p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Show cost breakdown"
        >
          <Info className="w-4 h-4 text-slate-500" />
        </button>
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

      {/* Cost Breakdown Tooltip */}
      {showTooltip && (
        <div className="absolute top-16 right-4 z-50 w-80 bg-white border border-slate-300 rounded-lg shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900 text-sm">Cost Breakdown</h4>
            <button
              onClick={() => setShowTooltip(false)}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
              aria-label="Close breakdown"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">FOB Price (Factory)</span>
              <span className="font-semibold text-slate-900">${fobPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Shipping</span>
              <span className="font-semibold text-slate-900">${shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Duty</span>
              <span className="font-semibold text-slate-900">${duty.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">Import Fees</span>
              <span className="font-semibold text-slate-900">${fees.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
              <span className="text-sm font-semibold text-slate-900">Total Landed Cost</span>
              <span className="text-lg font-bold text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
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
