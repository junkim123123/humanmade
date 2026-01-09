// @ts-nocheck
"use client";

import type { Report } from "@/lib/report/types";

interface ReportSummaryHeaderProps {
  report: Report;
}

/**
 * Report Summary Header - 3-line structure
 * Shows: What we know, What we don't know, What input would narrow it
 */
export function ReportSummaryHeader({ report }: ReportSummaryHeaderProps) {
  const reportAny = report as any;
  const similarCount = reportAny._similarRecordsCount || 0;
  const hsCandidatesCount = reportAny._hsCandidatesCount || 0;
  const hasLandedCosts = reportAny._hasLandedCosts || false;
  const priceUnit = reportAny._priceUnit || "per unit";
  
  const standard = report.baseline.costRange.standard;
  const conservative = report.baseline.costRange.conservative;
  const fobMin = standard.unitPrice;
  const fobMax = conservative.unitPrice;
  
  // What we know (certain)
  const certainLine = (() => {
    if (similarCount > 0 && fobMin > 0 && fobMax > 0) {
      return `Based on ${similarCount} internal records, FOB ranges from ${fobMin.toFixed(2)} to ${fobMax.toFixed(2)} ${priceUnit}`;
    } else if (fobMin > 0 && fobMax > 0) {
      return `Category-based estimate, FOB ranges from ${fobMin.toFixed(2)} to ${fobMax.toFixed(2)} ${priceUnit}`;
    } else {
      return "Product analysis complete, calculating price range";
    }
  })();
  
  // What we don't know (uncertain)
  const uncertainLine = (() => {
    if (!hasLandedCosts) {
      return "Landed cost uncertain due to 0 supplier matches with pricing";
    } else if (hsCandidatesCount > 1) {
      return `Duty rate uncertain due to ${hsCandidatesCount} HS code candidates`;
    } else if (similarCount === 0) {
      return "Range is broad due to lack of similar import records";
    } else {
      return "Further verification recommended";
    }
  })();
  
  // What input would narrow it
  const inputLine = (() => {
    const suggestions: string[] = [];
    if (hsCandidatesCount > 1) {
      suggestions.push("Adding label photo would likely reduce HS candidates and duty error");
    }
    if (similarCount === 0) {
      suggestions.push("Entering barcode may increase similar record matching");
    }
    if (!hasLandedCosts) {
      suggestions.push("Entering material & size would reduce freight estimation error");
    }
    return suggestions[0] || "Additional inputs can narrow the ranges";
  })();

  return (
    <div className="space-y-4 mb-6">
      {/* What we know */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-xs font-medium text-green-700 mb-1">What we know</div>
        <div className="text-sm text-slate-900">{certainLine}</div>
      </div>

      {/* What we don't know */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-xs font-medium text-yellow-700 mb-1">What we don't know</div>
        <div className="text-sm text-slate-900">{uncertainLine}</div>
      </div>

      {/* What input would narrow it */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs font-medium text-blue-700 mb-1">Impactful next inputs</div>
        <div className="text-sm text-slate-900">{inputLine}</div>
      </div>
    </div>
  );
}

