"use client";

import { useState } from "react";
import type { Report } from "@/lib/report/types";
import { normalizeRange } from "@/lib/calc/cost-normalization";
import { computeDataQuality } from "@/lib/report/data-quality";
import { getSupplierMatches } from "@/lib/report/normalizeReport";
import AssumptionsCard from "./cards/AssumptionsCard";
import ConfirmedFactsPanel from "./cards/ConfirmedFactsPanel";
import OCRRecoveryCard from "./cards/OCRRecoveryCard";
import LabelDraftCard from "./cards/LabelDraftCard";
import HsDutyCard from "./cards/HsDutyCard";
import SupplierCandidatesTop from "./SupplierCandidatesTop";
import SupplierCandidatesEmptyState from "./SupplierCandidatesEmptyState";
import LabelConfirmationModal from "./modals/LabelConfirmationModal";
import { VerificationModal } from "@/components/modals/VerificationModal";
import ExtractionSummary from "./ExtractionSummary";

// --- New DecisionCard for top of report ---
function DecisionCard({ report }: { report: Report }) {
  // Delivered cost logic
  const costRange = report.baseline?.costRange || { conservative: { totalLandedCost: 0 }, standard: { totalLandedCost: 0 } };
  const bestEstimate = costRange.standard?.totalLandedCost || 0;
  let minCost = costRange.conservative?.totalLandedCost || bestEstimate;
  let maxCost =
    costRange.range?.totalLandedCost?.p90 ?? bestEstimate * 1.2;
  // Ensure bestEstimate is inside [min, max]
  if (bestEstimate < minCost) minCost = bestEstimate;
  if (bestEstimate > maxCost) maxCost = bestEstimate;
  if (minCost > maxCost) maxCost = minCost;
  const normalized = normalizeRange({ min: minCost, mid: bestEstimate, max: maxCost }, "DecisionCard");

  // Evidence badge logic
  const { strength, reason: evidenceSummary } = computeDataQuality(report);
  const safeStrength: "low" | "medium" | "high" = strength ?? "low";
  const evidenceColors: Record<"low"|"medium"|"high", string> = {
    low: "bg-yellow-100 text-yellow-700 border-yellow-300",
    medium: "bg-blue-100 text-blue-700 border-blue-300",
    high: "bg-green-100 text-green-700 border-green-300",
  };

  // Missing input chips (up to 3)
  const missingInputs: string[] = [];
  const inputStatus = (report as any)._proof?.inputStatus || (report as any).inputStatus || {};
  if (!inputStatus.originConfirmed) missingInputs.push("Origin missing");
  if (inputStatus.weightDefaultUsed) missingInputs.push("Weight default used");
  if (inputStatus.boxSizeDefaultUsed) missingInputs.push("Box size default used");

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-slate-900 mb-1">Decision</h3>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[28px] font-bold text-slate-900 tracking-tight">
              ${bestEstimate.toFixed(2)}
            </span>
            <span className="text-[13px] text-slate-500">per unit</span>
            <span className="text-[13px] text-slate-400">({`Range: $${normalized.min.toFixed(2)} – $${normalized.max.toFixed(2)}`})</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${evidenceColors[safeStrength] ?? evidenceColors.low}`}>{safeStrength.charAt(0).toUpperCase() + safeStrength.slice(1)} evidence</span>
          <span className="text-[13px] text-slate-600">{evidenceSummary}</span>
        </div>
      </div>
      {missingInputs.length > 0 && (
        <div className="px-6 py-2 flex flex-wrap gap-2">
          {missingInputs.slice(0, 3).map((chip, i) => (
            <span key={i} className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full border border-slate-200">{chip}</span>
          ))}
        </div>
      )}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 border-t border-slate-100">
        <div className="flex gap-2">
          <button className="bg-slate-900 text-white rounded-full px-4 py-2 text-[14px] font-medium hover:bg-slate-800 transition-colors">Start verification</button>
          <button className="bg-slate-100 text-slate-900 rounded-full px-4 py-2 text-[14px] font-medium border border-slate-200 hover:bg-slate-200 transition-colors">Upload missing photos</button>
        </div>
      </div>
    </div>
  );
}

function VerdictCard({ report }: { report: Report }) {
  const costRange = report.baseline?.costRange || { conservative: { totalLandedCost: 0 }, standard: { totalLandedCost: 0 } };
  const midCost = costRange.standard?.totalLandedCost || 0;
  const minCostRaw = costRange.conservative?.totalLandedCost || midCost;
  const maxCostRaw = midCost * 1.2;
  const normalized = normalizeRange({ min: minCostRaw, mid: midCost, max: maxCostRaw }, "VerdictCard");
  const { reason: dataQualityReason } = computeDataQuality(report);

  const items = [
    "Supplier outreach and at least 3 viable quotes",
    "HS and duty confirmation",
    "Label and origin checks",
    "Execution plan to your destination country port",
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold text-slate-900">Decision snapshot</h3>
          <span className="text-[12px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Estimate
          </span>
        </div>
        <div>
          <div className="text-[13px] text-slate-500 mb-1">Delivered cost range estimate</div>
          <div className="text-[28px] font-bold text-slate-900 tracking-tight">
            ${normalized.min.toFixed(2)} – ${normalized.max.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-slate-50">
        <p className="text-[13px] text-slate-600 mb-3">
          What can change: some details are missing so this range may shift. Verification tightens it.
        </p>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700">
              <span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface OverviewModernProps {
  report: Report & {
    _priceUnit?: string;
    targetSellPrice?: number;
    _proof?: any;
    _recommendedMatches?: any[];
    _similarRecordsSample?: any[];
    _coverage?: any;
  };
}

export default function OverviewModern({ report }: OverviewModernProps) {
  const [showLabelConfirmation, setShowLabelConfirmation] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  const reportAny = report as any;
  
  // Debug: Log supplier matches on mount (always log, not just dev)
  if (typeof window !== 'undefined') {
    const supplierMatches = reportAny._supplierMatches;
    console.log('[OverviewModern] Report data check:', {
      hasSupplierMatches: !!supplierMatches,
      supplierMatchesType: typeof supplierMatches,
      supplierMatchesLength: Array.isArray(supplierMatches) ? supplierMatches.length : 'not array',
      firstMatch: Array.isArray(supplierMatches) && supplierMatches.length > 0 ? {
        id: supplierMatches[0]?.id,
        supplierName: supplierMatches[0]?.supplierName,
        supplierId: supplierMatches[0]?.supplierId,
        hasName: !!(supplierMatches[0]?.supplierName && supplierMatches[0].supplierName !== "Unknown"),
      } : null,
      reportKeys: Object.keys(reportAny).filter(k => k.includes('supplier') || k.includes('factory') || k.includes('match')),
      reportId: reportAny.id,
      isSampleReport: reportAny.id === 'sample-report',
    });
  }
  
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus;
  const uploadsOptional = !(
    inputStatus?.barcodePhotoUploaded &&
    inputStatus?.labelPhotoUploaded &&
    inputStatus?.productPhotoUploaded
  );
  
  // Check OCR failure and Vision fallback
  const ocrFailed = inputStatus?.labelPhotoUploaded && inputStatus?.labelOcrStatus === "failed";
  const hasVisionDraft = inputStatus?.labelExtractionSource === "VISION" && inputStatus?.labelDraft;
  
  // Check if we need ConfidenceBuilder
  return (
    <div className="space-y-6">
      {/* Top Decision Card with cost, range, evidence, missing inputs, actions */}
      <DecisionCard report={report} />

      {/* Details and rest of report */}
      <details className="rounded-xl border border-slate-200 bg-white group" open={false}>
        <summary className="cursor-pointer list-none px-6 py-4 text-[14px] font-medium text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors">
          Details
          <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
          {/* Vision Label Draft Card (if OCR failed and Vision extracted) */}
          {hasVisionDraft && (
            <LabelDraftCard 
              report={report}
              onConfirm={() => setShowLabelConfirmation(true)}
            />
          )}

          {/* OCR Recovery Card (if OCR failed but NO Vision fallback) */}
          {ocrFailed && !hasVisionDraft && (
            <OCRRecoveryCard 
              reportId={report.id}
              failureReason={inputStatus?.labelOcrFailureReason}
            />
          )}

          {/* Confirmed Facts */}
          <ConfirmedFactsPanel report={report} />

          {/* Extraction Summary */}
          <ExtractionSummary report={report} />
        </div>
      </details>

      {/* Decision Support Cards */}
      {reportAny._decisionSupport && (
        <>
          {/* HS Code & Duty Card */}
          <HsDutyCard decisionSupport={reportAny._decisionSupport} />

          {/* Supplier Candidates - Always render with state-specific UI */}
          {(() => {
            // Use normalization helper to get matches from various sources
            const supplierMatches = getSupplierMatches(reportAny);
            
            // Minimal debug for production - log count only
            if (typeof window !== 'undefined') {
              console.log('[OverviewModern] Supplier matches:', supplierMatches.length);
            }
            
            if (supplierMatches.length > 0) {
              return <SupplierCandidatesTop matches={supplierMatches} />;
            } else {
              return (
                <SupplierCandidatesEmptyState 
                  reasonCode={reportAny.supplierEmptyReason || "no_signals"}
                  uploadsOptional={uploadsOptional}
                />
              );
            }
          })()}
        </>
      )}

      {/* Assumptions */}
      <AssumptionsCard 
        report={report}
      />

      {/* Label Confirmation Modal */}
      {showLabelConfirmation && (
        <LabelConfirmationModal
          report={report}
          onClose={() => setShowLabelConfirmation(false)}
          onSuccess={() => {
            setShowLabelConfirmation(false);
            window.location.reload();
          }}
        />
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          reportId={report.id}
          productName={report.productName}
        />
      )}
    </div>
  );
}
