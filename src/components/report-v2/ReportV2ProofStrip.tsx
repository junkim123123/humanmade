"use client";

import type { Report } from "@/lib/report/types";
import { safePercent } from "@/lib/format/percent";

interface ProofData {
  hsCode: string | null;
  hsConfidence: number; // 0-100
  labelTerms: string[]; // max 3 terms (legacy pipeline extraction)
  labelUploaded?: boolean;
  labelOcrStatus?: "SUCCESS" | "PARTIAL" | "FAILED" | "success" | "partial" | "failed" | "pending" | "PENDING";
  labelOcrFailureReason?: string | null;
  labelTermsFromDb?: string[]; // DB-stored terms
  labelOcrCheckedAt?: string | null;
  similarImportsCount: number;
  leadsCount: number;
  evidenceLevel: "high" | "medium" | "low";
}

interface ReportV2ProofStripProps {
  report: Report & {
    _proof?: ProofData;
    _recommendedMatches?: any[];
    _candidateMatches?: any[];
    _excludedMatches?: any[];
  };
}

function getEvidenceLevelColor(level: string): string {
  if (level === "high") return "bg-emerald-50 border-emerald-200";
  if (level === "medium") return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function getEvidenceLevelTextColor(level: string): string {
  if (level === "high") return "text-emerald-900";
  if (level === "medium") return "text-amber-900";
  return "text-red-900";
}

function getEvidenceLevelLabel(level: string): string {
  if (level === "high") return "High confidence";
  if (level === "medium") return "Medium confidence";
  return "Low confidence";
}

export default function ReportV2ProofStrip({ report }: ReportV2ProofStripProps) {
  const reportAny = report as any;
  const proof: any = reportAny._proof || reportAny.extras?.proof || {};
  const coverage: any = reportAny._coverage || {};
  const inputStatus: any = proof?.inputStatus || reportAny.inputStatus || reportAny.extras?.inputStatus || reportAny.extras?.proof?.inputStatus || reportAny.data?.inputStatus || {};
  const uploadAudit =
    proof?.uploadAudit ||
    reportAny.pipeline_result?.uploadAudit ||
    reportAny.uploadAudit ||
    reportAny.data?.uploadAudit ||
    {};
  const evidenceSource = coverage?.evidenceSource || "llm_baseline";
  const confidenceTier: "low" | "medium" | "high" = reportAny.confidence || "low";
  
  // Get trade data audit fields from DB (fallback to computed)
  const externalTradeDataAttempted = reportAny.external_trade_data_attempted ?? false;
  const externalTradeDataResultCount = reportAny.external_trade_data_result_count ?? null;
  const usedExternalTradeData = reportAny.used_external_trade_data ?? false;
  const dbReason: string | undefined = reportAny.external_trade_data_reason || undefined;
  
  const getTradeStatusAndReason = (
    attempted: boolean,
    resultCount: number | null,
    used: boolean,
    reasonCode: string | undefined,
    source: string,
    confidence: "low" | "medium" | "high",
    similarRecordsCount: number
  ): { status: string; reason: string } => {
    // Handle "attempted but no results" case
    if (attempted && resultCount === 0) {
      return {
        status: "Attempted external trade data",
        reason: "No matching shipments found"
      };
    }
    
    // Handle "used" case
    if (used && resultCount && resultCount > 0) {
      return {
        status: "Used external trade data",
        reason: "Checked recent shipments"
      };
    }
    
    // Handle "skipped" cases - map reason code to user-facing text
    if (!attempted) {
      let reason = "Skipped by policy"; // Default
      
      if (reasonCode === "SKIP_INTERNAL_CONFIDENT") {
        reason = "Enough internal evidence";
      } else if (reasonCode === "SKIP_BENCHMARKS") {
        reason = "Using category benchmarks";
      } else if (reasonCode === "SKIP_NO_MATCH") {
        reason = "No reliable trade match";
      } else if (source === "internal_records" && (confidence === "medium" || confidence === "high")) {
        reason = "Enough internal evidence";
      } else if (source === "category_benchmarks") {
        reason = "Using category benchmarks";
      } else if (source === "llm_baseline" || similarRecordsCount === 0) {
        reason = "No reliable trade match";
      }
      
      return {
        status: "Skipped external trade data",
        reason
      };
    }
    
    // Fallback
    return {
      status: "Skipped external trade data",
      reason: "Skipped by policy"
    };
  };
  
  // Fallback if proof object not available - compute from report data
  const hsCode = proof?.hsCode || reportAny.baseline?.riskFlags?.tariff?.hsCodeRange?.[0] || null;
  const hsConfidence = safePercent(proof?.hsConfidence ?? 65);

  const normalizedLabelOcrStatus = () => {
    const raw = proof?.labelOcrStatus || inputStatus?.labelOcrStatus;
    if (!raw || typeof raw !== "string") return undefined;
    const upper = raw.toUpperCase();
    if (["SUCCESS", "PARTIAL", "FAILED", "PENDING"].includes(upper)) return upper as "SUCCESS" | "PARTIAL" | "FAILED" | "PENDING";
    return undefined;
  };

  const derivedLabelUploaded = () => {
    if (proof?.labelUploaded === true || proof?.labelUploaded === false) return proof.labelUploaded;
    if (inputStatus?.labelPhotoUploaded === true) return true;
    if (inputStatus?.labelPhotoUploaded === false) return false;
    if (uploadAudit?.labelImage || reportAny.hasLabelImage) return true;
    if (reportAny.data?.label_image_url) return true;
    return undefined;
  };
  
  // Label audit fields - pipeline_result is source of truth, treat undefined as unknown (not false)
  const labelUploaded = derivedLabelUploaded(); // undefined, true, or false
  const labelOcrStatus = normalizedLabelOcrStatus();
  const labelOcrFailureReason = proof?.labelOcrFailureReason || inputStatus?.labelOcrFailureReason || null;
  const labelTermsFromDb = proof?.labelTermsFromDb || inputStatus?.labelTerms || [];
  const labelTermsFallback = proof?.labelTerms || inputStatus?.labelDraft?.terms || [];
  const labelTerms = labelTermsFromDb.length > 0 ? labelTermsFromDb : labelTermsFallback;
  
  const similarImportsCount = proof?.similarImportsCount ?? 0;
  const leadsCount = proof?.leadsCount ?? 0;
  const evidenceLevel = proof?.evidenceLevel || reportAny.evidenceLevel || "low";
  const similarRecordsCount = coverage?.similarRecordsCount ?? 0;
  
  // Compute label display text and CTA based on upload status and OCR result
  // Critical: undefined !== false. Only false means "not uploaded".
  const getLabelDisplayText = (): { text: string; showCta: boolean; ctaText: string } => {
    // Case 1: Explicitly not uploaded
    if (labelUploaded === false) {
      return { text: "No label uploaded", showCta: false, ctaText: "" };
    }
    
    // Case 2: Explicitly uploaded (true)
    if (labelUploaded === true) {
      // Handle OCR status
      if (labelOcrStatus === "FAILED") {
        const reason = labelOcrFailureReason 
          ? labelOcrFailureReason.toLowerCase().replace(/_/g, " ")
          : "unreadable";
        return { 
          text: `Label uploaded but ${reason}`, 
          showCta: false, 
          ctaText: "" 
        };
      }
      
      if (labelOcrStatus === "PARTIAL") {
        if (labelTerms.length === 0) {
          return { 
            text: "Label uploaded, few terms found", 
            showCta: false, 
            ctaText: "" 
          };
        }
        const termsText = labelTerms.slice(0, 3).join(", ");
        return { 
          text: `${termsText} (partial)`, 
          showCta: false, 
          ctaText: "" 
        };
      }
      
      if (labelOcrStatus === "SUCCESS") {
        if (labelTerms.length === 0) {
          return { text: "Label uploaded, OCR completed", showCta: false, ctaText: "" };
        }
        if (labelTerms.length <= 3) {
          return { text: labelTerms.join(", "), showCta: false, ctaText: "" };
        }
        const firstThree = labelTerms.slice(0, 3).join(", ");
        const remaining = labelTerms.length - 3;
        return { text: `${firstThree} +${remaining}`, showCta: false, ctaText: "" };
      }
      
      // No status yet
      return { text: "Label uploaded, OCR pending", showCta: false, ctaText: "" };
    }
    
    // Case 3: Unknown status (undefined) - pipeline_result missing
    // Don't claim it wasn't uploaded, show status unavailable
    return { text: "Label status unavailable", showCta: false, ctaText: "" };
  };
  
  const { status: tradeStatus, reason: tradeReason } = getTradeStatusAndReason(
    externalTradeDataAttempted,
    externalTradeDataResultCount,
    usedExternalTradeData,
    dbReason,
    evidenceSource,
    confidenceTier,
    similarRecordsCount
  );
  
  return (
    <div className={`rounded-lg border-2 p-4 mb-6 ${getEvidenceLevelColor(evidenceLevel)}`}>
      {/* Status line */}
      <div className={`text-sm font-semibold ${getEvidenceLevelTextColor(evidenceLevel)} mb-1`}>
        {getEvidenceLevelLabel(evidenceLevel)} • {tradeStatus}
      </div>
      <div className="text-xs text-slate-700 mb-3">{tradeReason}</div>
      
      {/* Chips grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* HS estimate chip */}
        <div className="bg-white rounded px-3 py-2 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">HS estimate</div>
          <div className="text-sm font-medium text-slate-900">
            {hsCode ? `${hsCode}` : "—"}
          </div>
          {hsCode && (
            <div className="text-xs text-slate-500 mt-0.5">
              {hsConfidence}% confident
            </div>
          )}
        </div>
        
        {/* Label signals chip */}
        <div className="bg-white rounded px-3 py-2 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Label signals</div>
          <div className="text-sm font-medium text-slate-900">
            {(() => {
              const { text, showCta, ctaText } = getLabelDisplayText();
              return (
                <>
                  <div>{text}</div>
                  {showCta && ctaText && (
                    <div className="text-xs text-blue-600 mt-1 font-normal">{ctaText}</div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        
        {/* Similar imports chip */}
        <div className="bg-white rounded px-3 py-2 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Similar imports</div>
          <div className="text-sm font-medium text-slate-900">
            {similarImportsCount !== null && similarImportsCount !== undefined ? `${similarImportsCount}` : "—"}
          </div>
        </div>
        
        {/* Leads to contact chip */}
        <div className="bg-white rounded px-3 py-2 border border-slate-200">
          <div className="text-xs text-slate-600 mb-1">Leads to contact</div>
          <div className="text-sm font-medium text-slate-900">
            {leadsCount > 0 ? `${leadsCount}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
