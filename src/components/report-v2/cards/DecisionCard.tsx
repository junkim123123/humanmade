"use client";

import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { computeReportQuality, countMissingCriticalInputs, getMissingCriticalInputs } from "@/lib/report/truth";

interface DecisionCardProps {
  report: Report;
  onShowMissing: () => void;
}

export default function DecisionCard({ report, onShowMissing }: DecisionCardProps) {
  const costRange = report.baseline.costRange;
  const maxCost = 
    (costRange.standard.unitPrice || 0) +
    (costRange.standard.shippingPerUnit || 0) +
    (costRange.standard.dutyPerUnit || 0) +
    (costRange.standard.feePerUnit || 0);

  const quality = computeReportQuality(report);
  const missingInputsCount = countMissingCriticalInputs(report);
  const missingInputs = getMissingCriticalInputs(report);

  const shouldOrderReady = 
    quality.tier === "verified" || 
    (quality.tier === "trade_backed" && missingInputsCount === 0);
  
  // Always show "ready" with assumptions, never block with "needs_details"
  const decision = "ready_with_draft";
  
  const config = {
    ready_with_draft: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
      label: "Ready to review",
      description: missingInputsCount > 0 
        ? `Using ${missingInputsCount} inferred value(s) — review assumptions below`
        : "All key inputs captured or inferred with high confidence",
      color: "bg-emerald-50 border-emerald-200",
    },
    ready: {
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
      label: "Ready for test order",
      description: "All key inputs captured, trade-backed data available",
      color: "bg-emerald-50 border-emerald-200",
    },
    needs_details: {
      icon: <AlertCircle className="w-8 h-8 text-amber-600" />,
      label: "Review assumptions",
      description: `${missingInputsCount} critical input(s) inferred — review before ordering`,
      color: "bg-amber-50 border-amber-200",
    },
    verify: {
      icon: <AlertCircle className="w-8 h-8 text-slate-400" />,
      label: "Verify before ordering",
      description: "Estimate based on category benchmarks only",
      color: "bg-slate-50 border-slate-200",
    },
  };

  const cfg = config[decision];

  return (
    <div className={`rounded-lg border p-6 ${cfg.color} transition-all`}>
      <div className="flex items-start gap-4 mb-4">
        {cfg.icon}
        <div>
          <h3 className="font-semibold text-slate-900">{cfg.label}</h3>
          <p className="text-sm text-slate-600 mt-1">{cfg.description}</p>
        </div>
      </div>

      {missingInputs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {missingInputs.slice(0, 3).map((missing, i) => (
            <div
              key={i}
              className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200 flex items-center gap-1"
            >
              <span className="font-medium">Initial Intelligence Draft:</span>
              <span>{missing.label}</span>
            </div>
          ))}
        </div>
      )}

      {missingInputsCount > 0 && (
        <button
          onClick={() => {}} // Placeholder for unlock action
          className="w-full mb-3 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors border border-amber-200"
        >
          Unlock proprietary data to see exact numbers
        </button>
      )}

      <button
        onClick={onShowMissing}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {missingInputsCount > 0 ? "Review assumptions" : "View details"}
      </button>
    </div>
  );
}
