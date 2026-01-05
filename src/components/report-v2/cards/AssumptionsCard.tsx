"use client";

import type { Report } from "@/lib/report/types";
import { Info } from "lucide-react";

interface AssumptionsCardProps {
  report: Report;
}

type SourceBadge = "user" | "label_verified" | "vision_inferred" | "category_default";
const sourceMeta: Record<SourceBadge, { text: string; color: string }> = {
  user: { text: "Verified", color: "bg-blue-100 text-blue-700" },
  label_verified: { text: "Verified", color: "bg-emerald-100 text-emerald-700" },
  vision_inferred: { text: "Inferred", color: "bg-purple-100 text-purple-700" },
  category_default: { text: "Default", color: "bg-amber-100 text-amber-700" },
};

function EvidenceLabel({ source }: { source: SourceBadge }) {
  const meta = sourceMeta[source];
  if (!meta) {
    // Fallback for unknown source types
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
        Unknown
      </span>
    );
  }
  const { text, color } = meta;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}

const formatRange = (range?: { p10?: number; p50?: number; p90?: number }, formatter?: (n: number) => string) => {
  if (!range) return null;
  const fmt = formatter ?? ((n: number) => n.toString());
  return `${fmt(range.p10 ?? range.p50 ?? 0)} – ${fmt(range.p90 ?? range.p50 ?? 0)}`;
};

const formatNumber = (value: number | null | undefined, unit = "") => {
  if (value === null || value === undefined || Number.isNaN(value) || Number(value) === 0) return "Not available";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}`;
};

export default function AssumptionsCard({ report }: AssumptionsCardProps) {
  const inferred = (report as any).baseline?.evidence?.inferredInputs || {};
  const costRanges = (report as any).baseline?.costRange?.range || {};
  const reportAny = report as any;
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || reportAny.extras?.inputStatus || reportAny.extras?.proof?.inputStatus || {};
  const labelUnreadable = Boolean(inputStatus?.labelPhotoUploaded && inputStatus?.labelOcrStatus === "failed");

  const adjustSource = (source?: SourceBadge | string): SourceBadge => {
    if (!source) return "category_default";
    
    // If it's already a valid SourceBadge, check label readability first
    if (source === "label_verified" && labelUnreadable) return "category_default";
    if (source === "user" || source === "label_verified" || source === "vision_inferred" || source === "category_default") {
      return source as SourceBadge;
    }
    
    // Map provenance values to SourceBadge
    if (source === "label_ocr" || source === "label_verified") return labelUnreadable ? "category_default" : "label_verified";
    if (source === "vision_inferred" || source === "similar_records" || source === "hs_code_analysis") return "vision_inferred";
    if (source === "user" || source === "user_confirmed") return "user";
    
    return "category_default";
  };

  const volumeRangeText = () => {
    const range = inferred.unitVolumeM3?.range;
    const isPositive = (n?: number | null) => typeof n === "number" && n > 0;
    if (!range) return null;
    const low = isPositive(range.p10) ? range.p10 : isPositive(range.p50) ? range.p50 : undefined;
    const high = isPositive(range.p90) ? range.p90 : isPositive(range.p50) ? range.p50 : undefined;
    if (low && high) return `${Number(low).toFixed(4)} m³ – ${Number(high).toFixed(4)} m³`;
    if (high) return `${Number(high).toFixed(4)} m³`;
    return null;
  };

  const volumeDisplay = (value: number | null | undefined) => {
    const rangeText = volumeRangeText();
    if (value && value > 0) return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })} m³`;
    if (rangeText) return rangeText;
    return "Auto from category template";
  };

  // Calculate pilot batch: 500 units or $1,000 total value (whichever is more realistic)
  const unitPrice = (report as any).baseline?.costRange?.standard?.unitPrice || 0;
  const pilotBatchUnits = unitPrice > 0 && unitPrice < 2 ? 500 : 500; // Default to 500 units for pilot batch
  const pilotBatchValue = pilotBatchUnits * unitPrice;
  const displayPilotBatch = pilotBatchValue >= 1000 
    ? `${pilotBatchUnits} units (~$${Math.round(pilotBatchValue)})`
    : `${pilotBatchUnits} units`;

  const rows = [
    {
      label: "Units per shipment",
      value: displayPilotBatch,
      rangeText: "Pilot Batch (LCL/Air min)",
      source: adjustSource(inferred.cartonPack?.provenance as SourceBadge),
      rationale: "B2B imports require bulk shipping. Assumes pilot batch for realistic margin calculation.",
    },
    {
      label: "Unit weight",
      value: formatNumber(
        reportAny._inputs?.unitWeight?.grams || reportAny._resolvedWeight || inferred.unitWeightG?.value, 
        " g"
      ),
      rangeText: (() => {
        const weight = reportAny._inputs?.unitWeight;
        if (weight?.rangeGrams) {
          return `${weight.rangeGrams.min} g – ${weight.rangeGrams.max} g`;
        }
        if (reportAny._resolvedWeightRange) {
          return `${reportAny._resolvedWeightRange.min} g – ${reportAny._resolvedWeightRange.max} g`;
        }
        return formatRange(inferred.unitWeightG?.range, (n) => `${Number(n).toFixed(0)} g`);
      })(),
      source: (() => {
        const weight = reportAny._inputs?.unitWeight;
        if (weight?.source === "user" || weight?.source === "label") {
          return "user"; // Show as "Verified"
        }
        if (weight?.source === "gemini_photo") {
          return "vision_inferred"; // Show as "Inferred"
        }
        if (weight?.source === "category_default") {
          return "category_default"; // Show as "Default"
        }
        return reportAny._resolvedWeightSource 
          ? adjustSource(reportAny._resolvedWeightSource as SourceBadge)
          : adjustSource(inferred.unitWeightG?.provenance as SourceBadge);
      })(),
      rationale: reportAny._inputs?.unitWeight?.rationale || 
        inferred.unitWeightG?.explanation || 
        (reportAny._resolvedWeightSource === "category_default" ? "Estimated from category with deterministic variation" : null),
      // Add confidence display for gemini_photo
      confidence: reportAny._inputs?.unitWeight?.source === "gemini_photo" 
        ? reportAny._inputs.unitWeight.confidence 
        : undefined,
    },
    {
      label: "Box volume",
      value: volumeDisplay(inferred.unitVolumeM3?.value),
      rangeText: null,
      source: adjustSource(inferred.unitVolumeM3?.provenance as SourceBadge),
      rationale: inferred.unitVolumeM3?.explanation,
    },
    {
      label: "Billable weight",
      value: formatNumber(inferred.billableWeightKg?.value, " kg"),
      rangeText: formatRange(inferred.billableWeightKg?.range, (n) => `${Number(n).toFixed(2)} kg`),
      source: adjustSource((inferred.billableWeightKg?.provenance as SourceBadge) || (inferred.unitWeightG?.provenance as SourceBadge)),
      rationale: inferred.billableWeightKg?.explanation,
    },
    {
      label: "Shipping per unit",
      value:
        inferred.shippingPerUnit?.value !== undefined && inferred.shippingPerUnit?.value !== null
          ? `$${Number(inferred.shippingPerUnit.value).toFixed(2)}`
          : "Not available",
      rangeText: formatRange(costRanges.shippingPerUnit || inferred.shippingPerUnit?.range, (n) => `$${Number(n).toFixed(2)}`),
      source: adjustSource(inferred.shippingPerUnit?.provenance as SourceBadge),
      rationale: inferred.shippingPerUnit?.explanation,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-[16px] font-semibold text-slate-900 mb-1">Assumptions and defaults</h3>
        <ul className="mb-2 space-y-1.5 text-[13px] text-slate-600">
          {inputStatus.weightDefaultUsed && <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">•</span>Weight default used</li>}
          {inputStatus.boxSizeDefaultUsed && <li className="flex items-start gap-2"><span className="text-slate-400 mt-0.5">•</span>Box volume default used</li>}
          {!inputStatus.originConfirmed && (
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-amber-700 font-medium">Origin missing</span>
            </li>
          )}
        </ul>
        <p className="text-[13px] text-slate-500">This estimate assumes a pilot batch for realistic B2B import scenarios. Shipping uses category defaults when missing.</p>
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[13px] font-medium text-slate-700">{row.label}</p>
                {row.rationale && (
                  <span title={row.rationale}>
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-[16px] font-semibold text-slate-900">{row.value}</p>
              {row.rangeText && <p className="text-[12px] text-slate-500 mt-0.5">{row.rangeText}</p>}
            </div>
            <EvidenceLabel source={row.source} />
          </div>
        ))}
      </div>
    </div>
  );
}
