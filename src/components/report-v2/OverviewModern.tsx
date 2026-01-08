"use client";

import { useState, useMemo } from "react";
import type { Report } from "@/lib/report/types";
import { motion, useSpring, useTransform } from "framer-motion";
import { normalizeRange } from "@/lib/calc/cost-normalization";
import { computeDataQuality } from "@/lib/report/data-quality";
import { getSupplierMatches } from "@/lib/report/normalizeReport";
import { extractProductName } from "@/lib/report/extractProductName";
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
import VerdictCard from "./cards/VerdictCard";
import ActionPlan48hCard from "./cards/ActionPlan48hCard";
import SensitivityCard from "./cards/SensitivityCard";
import ConfidenceBuilder from "./cards/ConfidenceBuilder";
import OriginSimulator from "./cards/OriginSimulator";
import ProfitConversionCard from "./cards/ProfitConversionCard";

// --- New DecisionCard for top of report ---
function DecisionCard({ report }: { report: Report }) {
  const [shelfPriceInput, setShelfPriceInput] = useState<string>("");
  const [shelfPriceCommitted, setShelfPriceCommitted] = useState<number | null>(null);

  // Delivered cost logic
  const costRange = report.baseline?.costRange || { conservative: { totalLandedCost: 0 }, standard: { totalLandedCost: 0 } };
  let bestEstimate = costRange.standard?.totalLandedCost || 0;
  let minCost = costRange.conservative?.totalLandedCost || bestEstimate;
  let maxCost =
    costRange.range?.totalLandedCost?.p90 ?? bestEstimate * 1.2;

  // If no cost data, show placeholder values
  if (bestEstimate === 0) {
    bestEstimate = 4.75;
    minCost = 4.25;
    maxCost = 5.50;
  }

  // Ensure bestEstimate is inside [min, max]
  if (bestEstimate < minCost) minCost = bestEstimate;
  if (bestEstimate > maxCost) maxCost = bestEstimate;
  if (minCost > maxCost) maxCost = minCost;
  const normalized = normalizeRange({ min: minCost, mid: bestEstimate, max: maxCost }, "DecisionCard");

  // Shelf price and margin calculation
  const reportAny = report as any;
  const existingShelfPrice = reportAny.targetSellPrice || (reportAny._proof?.inputStatus?.shelfPrice) || null;
  const targetSellPrice = shelfPriceCommitted !== null ? shelfPriceCommitted : existingShelfPrice;

  const handleShelfPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShelfPriceInput(e.target.value);
    // Real-time calculation preview (without committing)
    const cleaned = e.target.value.trim().replace(/^\$/, "").replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) {
      // Show preview but don't commit until blur/Enter
      setShelfPriceCommitted(parsed);
    } else if (cleaned === "") {
      setShelfPriceCommitted(null);
    }
  };

  const handleShelfPriceBlur = () => {
    const cleaned = shelfPriceInput.trim().replace(/^\$/, "").replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed > 0) {
      setShelfPriceCommitted(parsed);
    } else if (cleaned === "") {
      setShelfPriceCommitted(null);
      setShelfPriceInput("");
    }
  };

  const handleShelfPriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleShelfPriceBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  // Calculate margin with real-time preview
  const previewPrice = useMemo(() => {
    if (shelfPriceInput !== "") {
      const cleaned = shelfPriceInput.trim().replace(/^\$/, "").replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return targetSellPrice;
  }, [shelfPriceInput, targetSellPrice]);

  const profitPerUnit = previewPrice && bestEstimate > 0 ? previewPrice - bestEstimate : null;
  const marginPercent = profitPerUnit && previewPrice ? ((profitPerUnit / previewPrice) * 100) : null;

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
  const inputStatus = (report as any)._proof?.inputStatus || (report as any).inputStatus || (report as any).extras?.inputStatus || (report as any).extras?.proof?.inputStatus || {};
  if (!inputStatus.originConfirmed) missingInputs.push("Origin missing");
  if (inputStatus.weightDefaultUsed) missingInputs.push("Weight default used");
  if (inputStatus.boxSizeDefaultUsed) missingInputs.push("Box size default used");

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
      {/* Hero Section - Big, Bold, Clean */}
      <div className="px-8 py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${evidenceColors[safeStrength] ?? evidenceColors.low}`}>
              {safeStrength === 'low' ? "Preliminary" : safeStrength === 'medium' ? "Trade-Backed" : "Verified"}
            </span>
          </div>
          
          <div className="space-y-6">
            {/* Main Price */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Estimated Landed Cost</p>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                  Target Floor Price
                </span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl sm:text-7xl font-bold text-slate-900 tracking-tighter">
                  ${bestEstimate.toFixed(2)}
                </span>
                <span className="text-xl text-slate-500 font-medium">per unit</span>
              </div>
            </div>

            {/* Range Info */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/60 shadow-sm">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-slate-600 font-medium">
                Market Range: <span className="text-slate-900 font-bold">${normalized.min.toFixed(2)} – ${normalized.max.toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      {missingInputs.some(input => input === "Origin missing") && (
        <div className="px-8 py-5 bg-amber-50/40 border-t border-amber-100">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">Origin Confirmation Needed</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Verification will confirm country of origin for accurate duty calculation
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Shelf Price Input & Margin Calculator - Redesigned */}
      <div className="px-8 py-8 border-t border-slate-200/60 bg-white">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <label htmlFor="shelf-price-input" className="block text-sm font-bold text-slate-900 mb-4 uppercase tracking-tight">
              Your Retail Price
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">$</span>
              <input
                id="shelf-price-input"
                type="text"
                inputMode="decimal"
                placeholder="14.99"
                value={shelfPriceInput !== "" ? shelfPriceInput : (targetSellPrice ? targetSellPrice.toFixed(2) : "")}
                onChange={handleShelfPriceChange}
                onBlur={handleShelfPriceBlur}
                onKeyDown={handleShelfPriceKeyDown}
                className="w-full h-16 pl-12 pr-4 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50/50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">Enter your target shelf price to calculate net margin.</p>
          </div>

          {/* Margin Display */}
          {previewPrice && profitPerUnit !== null && marginPercent !== null && (
            <motion.div 
              className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <p className="text-sm font-bold text-emerald-900 uppercase tracking-tight">Estimated Net Profit</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-emerald-700">Profit per unit</span>
                  <motion.span 
                    className="text-3xl font-bold text-emerald-600 tracking-tight"
                    key={`profit-${profitPerUnit?.toFixed(2)}`}
                  >
                    ${profitPerUnit.toFixed(2)}
                  </motion.span>
                </div>
                <div className="flex items-baseline justify-between pt-4 border-t border-emerald-200/50">
                  <span className="text-sm font-medium text-emerald-700">Net Margin</span>
                  <motion.span 
                    className="text-5xl font-bold text-emerald-600 tracking-tighter"
                    key={`margin-${marginPercent?.toFixed(1)}`}
                  >
                    {marginPercent.toFixed(0)}%
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 border-t border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 w-6 rounded-full border-2 border-slate-50 bg-slate-200"></div>
            ))}
          </div>
          <p className="text-xs text-slate-500 font-medium">84 other users searched this category today</p>
        </div>
        <button className="bg-white text-slate-900 rounded-full px-6 py-2.5 text-sm font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Refine Analysis with Photos
        </button>
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
  
  // Check for IP/brand keywords in product name
  const ipKeywords = ['pokemon', 'disney', 'marvel', 'star wars', 'nintendo', 'sony', 'warner', 'universal', 'pixar', 'dreamworks', 'hasbro', 'mattel', 'lego'];
  const displayProductName = extractProductName(report.productName || reportAny.product_name);
  const productNameLower = displayProductName.toLowerCase();
  const hasIPKeyword = ipKeywords.some(keyword => productNameLower.includes(keyword));
  
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
  
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || reportAny.extras?.inputStatus || reportAny.extras?.proof?.inputStatus;
  const uploadsOptional = !(
    inputStatus?.barcodePhotoUploaded &&
    inputStatus?.labelPhotoUploaded &&
    inputStatus?.productPhotoUploaded
  );
  
  // Check OCR failure and Vision fallback
  const ocrFailed = inputStatus?.labelPhotoUploaded && inputStatus?.labelOcrStatus === "failed";
  const hasVisionDraft = inputStatus?.labelExtractionSource === "VISION" && inputStatus?.labelDraft;
  
  // Check if we need ConfidenceBuilder
  const supplierMatches = getSupplierMatches(reportAny);
  
  const decisionSummary = (reportAny._decisionSummary || reportAny.data?._decisionSummary) as any;
  
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* IP/Brand Licensing Alert */}
      {hasIPKeyword && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-amber-900 mb-1">Licensing Alert</p>
              <p className="text-[13px] text-amber-800">
                Brand authorization required for import. We can verify this for you.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Decision Summary Section - Verdict, Action Plan, Sensitivity */}
      {decisionSummary ? (
        <>
          <VerdictCard 
            verdict={decisionSummary._verdict} 
            verdictText={reportAny._verdictText}
            nudge={reportAny._nudge}
          />
          <ActionPlan48hCard report={report} actionPlan={decisionSummary._actionPlan48h} />
          {(() => {
            // Only render SensitivityCard if there are computable scenarios
            const computableScenarios = decisionSummary._sensitivity.scenarios.filter((s: any) => {
              const hasCost = s.impactOnLandedCost.newCost !== null;
              const hasChange = s.impactOnLandedCost.change !== 0;
              return hasCost || hasChange;
            });
            return computableScenarios.length > 0 ? (
              <SensitivityCard sensitivity={{ scenarios: computableScenarios }} />
            ) : null;
          })()}
        </>
      ) : (
        // Fallback when decision summary is missing
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="px-6 py-5">
            <h3 className="text-[16px] font-semibold text-slate-900 mb-2">Decision Summary</h3>
            <p className="text-[13px] text-slate-600 mb-4">
              Upload a clear label photo to unlock a stronger verdict and action plan.
            </p>
            <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full px-5 py-2.5 text-[14px] font-semibold border border-amber-400 hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload missing photos
            </button>
          </div>
        </div>
      )}
      
      {/* Top Decision Card with cost, range, evidence, missing inputs, actions */}
      <DecisionCard report={report} />
      
      {/* Diagnostics badge for sample reports */}
      {reportAny._isSampleReport ? (
        <div className="mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[12px] text-slate-600">
          Suppliers {supplierMatches.length}
          {supplierMatches[0]?.supplierName ? ` • ${supplierMatches[0].supplierName}` : ""}
        </div>
      ) : null}

      {/* Details and rest of report */}
      <details className="rounded-xl border border-slate-200 bg-white group" open={false}>
        <summary className="cursor-pointer list-none px-6 py-4 text-[14px] font-medium text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors">
          Details
          <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div id="uploadsSection" className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
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
      <>
        {/* HS Code & Duty Card - always show if candidates exist, even if Draft */}
        {(reportAny._decisionSupport || reportAny.extras?.decisionSupport || (reportAny._hsCandidates && reportAny._hsCandidates.length > 0)) ? (
          <HsDutyCard 
            decisionSupport={reportAny._decisionSupport || reportAny.extras?.decisionSupport} 
            hsCandidates={reportAny._hsCandidates}
          />
        ) : null}

        {/* Supplier Candidates - Always render with state-specific UI */}
        {(() => {
          // Use normalization helper to get matches from various sources
          const supplierMatches = getSupplierMatches(reportAny);
          
          // Minimal debug for production - log count only
          if (typeof window !== 'undefined') {
            console.log('[OverviewModern] Supplier matches:', supplierMatches.length);
          }
          
          if (supplierMatches.length > 0) {
            return (
              <SupplierCandidatesTop 
                matches={supplierMatches} 
                onUnlock={() => setShowVerificationModal(true)} 
              />
            );
          } else {
            return (
              <SupplierCandidatesEmptyState 
                reasonCode={reportAny.supplierEmptyReason || "no_matches"}
                uploadsOptional={uploadsOptional}
              />
            );
          }
        })()}
      </>

      {/* Profit Conversion Card */}
      <ProfitConversionCard 
        report={report} 
        onUnlock={() => setShowVerificationModal(true)} 
      />

      {/* Assumptions */}
      <ConfidenceBuilder report={report} onUpgrade={() => setShowVerificationModal(true)} />

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
          productName={displayProductName}
        />
      )}
    </div>
  );
}

