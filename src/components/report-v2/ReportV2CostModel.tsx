"use client";

import { useState } from "react";
import type { Report } from "@/lib/report/types";

interface ReportV2CostModelProps {
  report: Report & {
    _priceUnit?: string;
  };
}

type InferenceSource = "assumed" | "from_category" | "from_customs" | "from_hs_estimate";

function getSourceBadge(source?: InferenceSource) {
  const badges = {
    assumed: { label: "Assumed", color: "bg-slate-100 text-slate-600" },
    from_category: { label: "From category", color: "bg-blue-50 text-blue-700" },
    from_customs: { label: "From customs records", color: "bg-green-50 text-green-700" },
    from_hs_estimate: { label: "From HS estimate", color: "bg-purple-50 text-purple-700" },
  };
  
  const badge = badges[source || "assumed"];
  return (
    <span className={`ml-2 px-2 py-0.5 text-xs rounded ${badge.color}`}>
      {badge.label}
    </span>
  );
}

export default function ReportV2CostModel({ report }: ReportV2CostModelProps) {
  const costRange = report.baseline?.costRange || {
    standard: { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0 },
    conservative: { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0 }
  };
  const reportAny = report as any;
  const priceUnit = reportAny._priceUnit || "per unit";
  
  // Get inferred inputs from baseline evidence
  const inferredInputs = report.baseline?.evidence?.inferredInputs || {};
  
  const [showRefineControls, setShowRefineControls] = useState(false);
  const [shippingMode, setShippingMode] = useState<"air" | "ocean">(
    inferredInputs.shippingMode?.value || "ocean"
  );
  const [unitWeight, setUnitWeight] = useState<string>("");
  const [cartonPack, setCartonPack] = useState<string>("");

  // Use V2 adapter totals if available (computed on server), otherwise calculate
  const v2Data = reportAny.v2;
  
  const standardTotal = v2Data?.costModel?.standard?.totalLandedCost ?? 
    (costRange.standard?.unitPrice || 0) +
    (costRange.standard?.shippingPerUnit || 0) +
    (costRange.standard?.dutyPerUnit || 0) +
    (costRange.standard?.feePerUnit || 0);
  
  const conservativeTotal = v2Data?.costModel?.conservative?.totalLandedCost ??
    (costRange.conservative?.unitPrice || 0) +
    (costRange.conservative?.shippingPerUnit || 0) +
    (costRange.conservative?.dutyPerUnit || 0) +
    (costRange.conservative?.feePerUnit || 0);

  // Check which components have inferred values
  const hasInferredFreight = (costRange.standard?.shippingPerUnit || 0) > 0;
  const hasInferredDuty = (costRange.standard?.dutyPerUnit || 0) > 0;
  const hasInferredFees = (costRange.standard?.feePerUnit || 0) > 0;
  const hasAnyInferred = hasInferredFreight || hasInferredDuty || hasInferredFees;

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Cost model</h2>
      
      <div className="space-y-6">
        {/* Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-slate-600 font-medium">Component</th>
                <th className="text-right py-2 px-3 text-slate-600 font-medium">Standard</th>
                <th className="text-right py-2 px-3 text-slate-600 font-medium">Conservative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 text-slate-900 flex items-center gap-2">
                  Factory unit price estimate
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Initial Intelligence Draft</span>
                </td>
                <td className="py-2 px-3 text-right text-slate-900">${(costRange.standard?.unitPrice || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-600">${(costRange.conservative?.unitPrice || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-900">
                  Freight
                  {hasInferredFreight && getSourceBadge(inferredInputs.shippingPerUnit?.source)}
                </td>
                <td className="py-2 px-3 text-right text-slate-900">${(costRange.standard?.shippingPerUnit || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-600">${(costRange.conservative?.shippingPerUnit || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-900">
                  Duty
                  {hasInferredDuty && getSourceBadge(inferredInputs.dutyRate?.source)}
                </td>
                <td className="py-2 px-3 text-right text-slate-900">${(costRange.standard?.dutyPerUnit || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-600">${(costRange.conservative?.dutyPerUnit || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-slate-900">
                  Fees
                  {hasInferredFees && getSourceBadge(inferredInputs.feesPerUnit?.source)}
                </td>
                <td className="py-2 px-3 text-right text-slate-900">${(costRange.standard?.feePerUnit || 0).toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-600">${(costRange.conservative?.feePerUnit || 0).toFixed(2)}</td>
              </tr>
              <tr className="border-t-2 border-slate-300 font-semibold">
                <td className="py-2 px-3 text-slate-900">Total</td>
                <td className="py-2 px-3 text-right text-slate-900">${standardTotal.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-slate-600">${conservativeTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Helper text for inferred estimates */}
        {hasAnyInferred && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              Freight, duty, and fees are estimated from category benchmarks. Add packaging details to narrow the range.
            </p>
          </div>
        )}

        {/* Refine Assumptions Button */}
        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={() => setShowRefineControls(!showRefineControls)}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showRefineControls ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Optional inputs
          </button>
        </div>

        {/* Sensitivity Controls (Collapsible) */}
        {showRefineControls && (
          <div className="border-t border-slate-200 pt-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Shipping mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShippingMode("air")}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    shippingMode === "air"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Air
                </button>
                <button
                  onClick={() => setShippingMode("ocean")}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    shippingMode === "ocean"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Ocean
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                We assumed {inferredInputs.shippingMode?.value || "ocean"}. Adjust if different.
              </p>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Unit weight (g)</label>
              <input
                type="text"
                value={unitWeight}
                onChange={(e) => setUnitWeight(e.target.value)}
                placeholder={`We assumed ${Math.round(inferredInputs.unitWeightG?.value || 0)}g`}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              {inferredInputs.unitWeightG?.explanation && (
                <p className="text-xs text-slate-500 mt-1">
                  {inferredInputs.unitWeightG.explanation}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Carton pack</label>
              <input
                type="text"
                value={cartonPack}
                onChange={(e) => setCartonPack(e.target.value)}
                placeholder={`We assumed ${inferredInputs.cartonPack?.value || 12} units per carton`}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              {inferredInputs.cartonPack?.explanation && (
                <p className="text-xs text-slate-500 mt-1">
                  {inferredInputs.cartonPack.explanation}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}




