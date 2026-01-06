"use client";

import type { Report } from "@/lib/report/types";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { normalizeRange } from "@/lib/calc/cost-normalization";
import ReportV2ProofStrip from "./ReportV2ProofStrip";

interface ReportV2DecisionProps {
  report: Report & {
    _priceUnit?: string;
    targetSellPrice?: number;
  };
}

function getVerdict(
  costRange: Report["baseline"]["costRange"], 
  evidenceLevel: string | undefined,
  missingInputs: string[],
  targetSellPrice?: number
): {
  verdict: "go" | "caution" | "no-go";
  label: string;
  icon: React.ReactNode;
  color: string;
} {
  // Calculate total manually (same as Cost Model)
  const maxCost = 
    (costRange.standard.unitPrice || 0) +
    (costRange.standard.shippingPerUnit || 0) +
    (costRange.standard.dutyPerUnit || 0) +
    (costRange.standard.feePerUnit || 0);
  
  // Rule set: Verdict based on evidenceLevel and missing inputs
  // Go only when evidenceLevel is verified_quote or exact_import and totals are fully computed
  const isHighEvidence = evidenceLevel === "verified_quote" || evidenceLevel === "exact_import";
  const hasKeyMissingInputs = missingInputs.length > 0;
  const hasComplianceRedFlags = false; // TODO: Check from report.baseline.riskFlags.compliance
  
  // Check for negative margin when target price is provided
  if (targetSellPrice) {
    const margin = ((targetSellPrice - maxCost) / targetSellPrice) * 100;
    if (margin < 0) {
      return { verdict: "no-go", label: "No go", icon: <XCircle className="w-5 h-5" />, color: "text-emerald-500" };
    }
    if (margin >= 15 && isHighEvidence && !hasKeyMissingInputs) {
      return { verdict: "go", label: "Go", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-600" };
    }
    if (margin >= 5) {
      return { verdict: "caution", label: "Verify before ordering", icon: <AlertCircle className="w-5 h-5" />, color: "text-yellow-600" };
    }
    return { verdict: "no-go", label: "No go", icon: <XCircle className="w-5 h-5" />, color: "text-emerald-500" };
  }
  
  // Without target price: Caution when evidenceLevel is similar_import or category_prior, or when key inputs are missing
  if (hasKeyMissingInputs || evidenceLevel === "similar_import" || evidenceLevel === "category_prior") {
    return { verdict: "caution", label: "Verify before ordering", icon: <AlertCircle className="w-5 h-5" />, color: "text-yellow-600" };
  }
  
  // Only Go when we have high evidence and no missing inputs
  if (isHighEvidence && !hasKeyMissingInputs) {
    return { verdict: "go", label: "Go", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-600" };
  }
  
  // Default to caution
  return { verdict: "caution", label: "Verify before ordering", icon: <AlertCircle className="w-5 h-5" />, color: "text-yellow-600" };
}

function getBiggestDrivers(costRange: Report["baseline"]["costRange"]): string[] {
  const drivers: Array<{ name: string; value: number }> = [
    { name: "Factory unit price estimate", value: costRange.standard.unitPrice },
    { name: "Shipping", value: costRange.standard.shippingPerUnit },
    { name: "Duty", value: costRange.standard.dutyPerUnit },
    { name: "Fees", value: costRange.standard.feePerUnit },
  ];
  
  drivers.sort((a, b) => b.value - a.value);
  return drivers.slice(0, 2).map(d => d.name);
}

function getBiggestUnknowns(report: Report): string[] {
  const unknowns: string[] = [];
  const evidence = report.baseline.evidence;
  
  if (!evidence.assumptions.weight || evidence.assumptions.weight.includes("assumed")) {
    unknowns.push("Unit weight");
  }
  if (!evidence.assumptions.packaging || evidence.assumptions.packaging.includes("assumed")) {
    unknowns.push("Packaging specs");
  }
  if (report.baseline.riskFlags.tariff.hsCodeRange.length > 1) {
    unknowns.push("HS code classification");
  }
  if (report.baseline.riskScores.compliance > 50) {
    unknowns.push("Compliance requirements");
  }
  
  return unknowns.slice(0, 2);
}

function getWhySummary(report: Report, evidenceLevel: string | undefined, missingInputs: string[]): string[] {
  const summary: string[] = [];
  const costRange = report.baseline.costRange;
  const reportAny = report as any;
  const v2Data = reportAny.v2;
  const priceUnit = reportAny._priceUnit || "per unit";

  let minCost: number;
  let maxCost: number;
  let isFOBOnly = false;

  if (v2Data?.deliveredCostRange) {
    const normalized = normalizeRange(v2Data.deliveredCostRange, 'ReportV2Decision.getWhySummary');
    minCost = normalized.min;
    maxCost = normalized.max;
  } else {
    const standardTotal =
      (costRange.standard.unitPrice || 0) +
      (costRange.standard.shippingPerUnit || 0) +
      (costRange.standard.dutyPerUnit || 0) +
      (costRange.standard.feePerUnit || 0);
    const conservativeTotal =
      (costRange.conservative.unitPrice || 0) +
      (costRange.conservative.shippingPerUnit || 0) +
      (costRange.conservative.dutyPerUnit || 0) +
      (costRange.conservative.feePerUnit || 0);

    minCost = Math.min(standardTotal, conservativeTotal);
    maxCost = Math.max(standardTotal, conservativeTotal);
  }

  const hasUnitPrice = (costRange.standard.unitPrice || 0) > 0;
  const hasShipping = (costRange.standard.shippingPerUnit || 0) > 0;
  const hasDuty = (costRange.standard.dutyPerUnit || 0) > 0;
  const hasFees = (costRange.standard.feePerUnit || 0) > 0;
  isFOBOnly = hasUnitPrice && !hasShipping && !hasDuty && !hasFees;

  if (hasUnitPrice) {
    if (isFOBOnly) {
      summary.push(`FOB estimate $${maxCost.toFixed(2)} ${priceUnit}`);
    } else {
      summary.push(`Delivered cost estimate $${minCost.toFixed(2)}–$${maxCost.toFixed(2)} ${priceUnit}`);
    }
  } else {
    summary.push("Cost estimate pending inputs");
  }

  const level = evidenceLevel || "category_prior";
  const levelLabel: Record<string, string> = {
    verified_quote: "Evidence: Verified quote",
    exact_import: "Evidence: Exact import data",
    similar_import: "Evidence: Similar import data",
    category_prior: "Evidence: Category benchmarks",
  };
  summary.push(levelLabel[level] || levelLabel.category_prior);

  if (missingInputs.length > 0) {
    summary.push(`Missing info: ${missingInputs.slice(0, 2).join(", ")}`);
  }

  return summary.slice(0, 3);
}

export default function ReportV2Decision({ report }: ReportV2DecisionProps) {
  const costRange = report.baseline.costRange;
  const reportAny = report as any;
  const targetSellPrice = reportAny.targetSellPrice;
  const evidenceLevel = report.evidenceLevel;
  
  // Extract missing inputs from report
  const missingInputs: string[] = [];
  if (!reportAny.pipeline_result?.analysis?.labelData?.netWeight) {
    missingInputs.push("unit_weight");
  }
  if (!reportAny.pipeline_result?.analysis?.labelData || 
      Object.keys(reportAny.pipeline_result?.analysis?.labelData || {}).length === 0) {
    missingInputs.push("packaging_photo");
  }
  if (!reportAny.pipeline_result?.analysis?.barcode) {
    missingInputs.push("barcode");
  }
  if (!reportAny.pipeline_result?.analysis?.hsCode) {
    missingInputs.push("hs_code");
  }
  
  const verdict = getVerdict(costRange, evidenceLevel, missingInputs, targetSellPrice);
  const drivers = getBiggestDrivers(costRange);
  const unknowns = getBiggestUnknowns(report);
  const whySummary = getWhySummary(report, evidenceLevel, missingInputs);
  
  // Use V2 adapter if available, otherwise calculate from baseline
  const v2Data = reportAny.v2;
  let minCost: number;
  let maxCost: number;
  
  if (v2Data?.deliveredCostRange) {
    // Use pre-computed range from server and normalize to ensure min/max ordering
    const normalized = normalizeRange(v2Data.deliveredCostRange, 'ReportV2Decision.component');
    minCost = normalized.min;
    maxCost = normalized.max;
  } else {
    // Fallback: calculate and ensure correct ordering
    const standardTotal = 
      (costRange.standard.unitPrice || 0) +
      (costRange.standard.shippingPerUnit || 0) +
      (costRange.standard.dutyPerUnit || 0) +
      (costRange.standard.feePerUnit || 0);
    const conservativeTotal = 
      (costRange.conservative.unitPrice || 0) +
      (costRange.conservative.shippingPerUnit || 0) +
      (costRange.conservative.dutyPerUnit || 0) +
      (costRange.conservative.feePerUnit || 0);
    
    // Fix: Always ensure min < max (not assume conservative is min)
    minCost = Math.min(standardTotal, conservativeTotal);
    maxCost = Math.max(standardTotal, conservativeTotal);
  }
  
  const priceUnit = reportAny._priceUnit || "per unit";
  
  // Check if only unit price exists (shipping, duty, fees all zero)
  const hasUnitPrice = (costRange.standard.unitPrice || 0) > 0;
  const hasShipping = (costRange.standard.shippingPerUnit || 0) > 0;
  const hasDuty = (costRange.standard.dutyPerUnit || 0) > 0;
  const hasFees = (costRange.standard.feePerUnit || 0) > 0;
  const isFOBOnly = hasUnitPrice && !hasShipping && !hasDuty && !hasFees;
  
  let marginRange: string | null = null;
  if (targetSellPrice) {
    const minMargin = ((targetSellPrice - maxCost) / targetSellPrice) * 100;
    const maxMargin = ((targetSellPrice - minCost) / targetSellPrice) * 100;
    marginRange = `${Math.round(minMargin)}% - ${Math.round(maxMargin)}%`;
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Overview</h2>
        {/* Proof Strip */}
        <ReportV2ProofStrip report={report} />
      
      <div className="space-y-6">
        {/* Cost Range */}
        <div>
          <div className="text-sm text-slate-600 mb-1">
            {isFOBOnly ? "FOB estimate" : "Delivered cost estimate"}
          </div>
          {hasUnitPrice && (minCost > 0 || maxCost > 0) ? (
            <>
              <div className="text-2xl font-semibold text-slate-900">
                ${minCost.toFixed(2)} - ${maxCost.toFixed(2)} <span className="text-base font-normal text-slate-600">{priceUnit}</span>
              </div>
              {isFOBOnly && (
                <p className="text-xs text-slate-500 mt-1">Shipping, duty, and fees not yet calculated</p>
              )}
            </>
          ) : (
            <div className="text-lg text-slate-500">Cost estimate not yet available</div>
          )}
        </div>

        {/* Margin Range */}
        {marginRange && (
          <div>
            <div className="text-sm text-slate-600 mb-1">Margin range</div>
            <div className="text-xl font-semibold text-slate-900">
              {marginRange}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div>
          <div className="text-sm text-slate-600 mb-2">Recommendation</div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${verdict.color} border-current`}>
            {verdict.icon}
            <span className="font-semibold">{verdict.label}</span>
          </div>
        </div>

        {/* What drives this */}
        <div>
          <div className="text-sm text-slate-600 mb-2">What drives this</div>
          <div className="space-y-1">
            {drivers.length > 0 && (
              <div className="text-sm text-slate-700">
                Biggest cost drivers: {drivers.join(", ")}
              </div>
            )}
            {unknowns.length > 0 && (
              <div className="text-sm text-slate-700">
                Biggest unknowns: {unknowns.join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

