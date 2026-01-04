"use client";

import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { useState } from "react";

interface LabelDraftCardProps {
  report: Report;
  onConfirm: () => void;
}

export default function LabelDraftCard({ report, onConfirm }: LabelDraftCardProps) {
  const reportAny = report as any;
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || reportAny.extras?.inputStatus || reportAny.extras?.proof?.inputStatus || {};
  
  const labelDraft = inputStatus.labelDraft;
  const extractionSource = inputStatus.labelExtractionSource;
  const extractionStatus = inputStatus.labelExtractionStatus;
  const labelOcrStatus = inputStatus.labelOcrStatus;
  
  // Don't show if no label uploaded or no draft available
  if (!inputStatus.labelPhotoUploaded || !labelDraft) {
    return null;
  }
  
  // Only show if Vision extraction succeeded (not OCR)
  if (extractionSource !== "VISION") {
    return null;
  }
  
  const isDraft = extractionStatus === "DRAFT";
  const isConfirmed = extractionStatus === "CONFIRMED";
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-emerald-600 bg-emerald-50";
    if (confidence >= 0.5) return "text-amber-600 bg-amber-50";
    return "text-slate-500 bg-slate-50";
  };
  
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.5) return "Medium";
    return "Low";
  };
  
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Label Extracted (Draft)</h3>
          </div>
          <p className="text-sm text-slate-600">
            Traditional OCR failed, but we extracted these fields using Vision AI. Please verify the 3 critical fields to complete compliance check.
          </p>
        </div>
        {isDraft && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Needs Confirmation
          </span>
        )}
        {isConfirmed && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        )}
      </div>
      
      {/* Critical Fields (need confirmation) */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Critical Fields (Required for Compliance)</h4>
        <div className="space-y-3">
          {labelDraft.country_of_origin && (
            <LabelField
              label="Country of Origin"
              value={labelDraft.country_of_origin.value}
              confidence={labelDraft.country_of_origin.confidence}
              evidence={labelDraft.country_of_origin.evidence}
            />
          )}
          {labelDraft.allergens_list && (
            <LabelField
              label="Allergens"
              value={labelDraft.allergens_list.value ? (labelDraft.allergens_list.value as string[]).join(", ") : "None declared"}
              confidence={labelDraft.allergens_list.confidence}
              evidence={labelDraft.allergens_list.evidence}
            />
          )}
          {labelDraft.net_weight_value && labelDraft.net_weight_unit && (
            <LabelField
              label="Net Weight"
              value={`${labelDraft.net_weight_value.value || "?"} ${labelDraft.net_weight_unit.value || ""}`}
              confidence={Math.min(labelDraft.net_weight_value.confidence, labelDraft.net_weight_unit.confidence)}
              evidence={labelDraft.net_weight_value.evidence}
            />
          )}
        </div>
      </div>
      
      {/* Optional Fields (informational) */}
      {(labelDraft.brand_name || labelDraft.product_name || labelDraft.ingredients_summary) && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Additional Information (Optional)</h4>
          <div className="space-y-2">
            {labelDraft.brand_name && labelDraft.brand_name.value && (
              <div className="text-sm">
                <span className="text-slate-500">Brand:</span>{" "}
                <span className="text-slate-700">{labelDraft.brand_name.value}</span>
              </div>
            )}
            {labelDraft.product_name && labelDraft.product_name.value && (
              <div className="text-sm">
                <span className="text-slate-500">Product Name:</span>{" "}
                <span className="text-slate-700">{labelDraft.product_name.value}</span>
              </div>
            )}
            {labelDraft.ingredients_summary && labelDraft.ingredients_summary.value && (
              <div className="text-sm">
                <span className="text-slate-500">Ingredients (summary):</span>{" "}
                <span className="text-slate-700">{labelDraft.ingredients_summary.value}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Confirm Button */}
      {isDraft && (
        <button
          onClick={onConfirm}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Confirm 3 Critical Fields →
        </button>
      )}
      
      {isConfirmed && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>Critical fields confirmed. Compliance remains draft (not verified).</span>
        </div>
      )}
    </div>
  );
}

function LabelField({ label, value, confidence, evidence }: { label: string; value: string | null; confidence: number; evidence: string }) {
  const [showEvidence, setShowEvidence] = useState(false);
  
  const confidenceColor = confidence >= 0.8 ? "text-emerald-600 bg-emerald-50" : confidence >= 0.5 ? "text-amber-600 bg-amber-50" : "text-slate-500 bg-slate-50";
  const confidenceLabel = confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low";
  
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceColor}`}>
            {confidenceLabel}
          </span>
        </div>
        <p className="text-sm text-slate-900">{value || "Not detected"}</p>
        {evidence && evidence !== "Not visible" && (
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-xs text-slate-500 hover:text-slate-700 mt-1 flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            {showEvidence ? "Hide" : "Show"} evidence
          </button>
        )}
        {showEvidence && (
          <p className="text-xs text-slate-500 mt-1 italic">"{evidence}"</p>
        )}
      </div>
      <div className="text-right">
        <span className="text-xs text-slate-400">{Math.round(confidence * 100)}%</span>
      </div>
    </div>
  );
}
