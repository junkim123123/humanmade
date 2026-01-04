"use client";

import { Shield } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { normalizeEvidence } from "@/lib/report/evidence";

interface ConfirmedFactsPanelProps {
  report: Report;
}

export default function ConfirmedFactsPanel({ report }: ConfirmedFactsPanelProps) {
  const evidence = normalizeEvidence(report as any);

  const rows = [
    {
      id: "barcode",
      title: "Barcode",
      state: (() => {
        if (!evidence.barcode.uploaded) return "Not provided";
        if (evidence.barcode.detected) return "Captured";
        return "Unreadable";
      })(),
      detail: (() => {
        if (evidence.barcode.detected) return evidence.barcode.value ? `UPC ${evidence.barcode.value}` : "UPC detected";
        if (evidence.barcode.uploaded && !evidence.barcode.detected) {
          return "Barcode photo received but unreadable";
        }
        return "No barcode photo";
      })(),
    },
    {
      id: "label",
      title: "Label",
      state: (() => {
        if (!evidence.label.uploaded) return "Not provided";
        if (!evidence.label.extracted) return "Unreadable";
        return "Captured";
      })(),
      detail: (() => {
        if (!evidence.label.uploaded) return "No label photo";
        if (!evidence.label.extracted) return "Label photo received but unreadable";
        if (evidence.label.terms.length > 0) return evidence.label.terms.slice(0, 3).join(", ");
        return evidence.label.rawText ? "Label text captured" : "Label text captured";
      })(),
    },
    {
      id: "weight",
      title: "Weight",
      state: (() => {
        if (evidence.weight.grams && evidence.weight.source && ["USER_INPUT", "OCR", "LABEL_TEXT"].includes(evidence.weight.source)) {
          return "Captured";
        }
        if (evidence.weight.grams) return "Inferred";
        return evidence.label.uploaded ? "Unreadable" : "Not provided";
      })(),
      detail: (() => {
        if (evidence.weight.grams) {
          const sourceLabel = (() => {
            if (evidence.weight.source === "USER_INPUT") return "User input";
            if (evidence.weight.source === "OCR" || evidence.weight.source === "LABEL_TEXT") return "From label text";
            if (evidence.weight.source === "VISION_INFERENCE") return "Vision estimate";
            if (evidence.weight.source === "DEFAULT") return "Category default";
            return "";
          })();
          return sourceLabel ? `${evidence.weight.grams} g • ${sourceLabel}` : `${evidence.weight.grams} g`;
        }
        return evidence.label.uploaded ? "Weight not readable" : "Not provided";
      })(),
    },
    {
      id: "origin",
      title: "Origin",
      state: (() => {
        if (evidence.origin.countryCode) return "Captured";
        return evidence.label.uploaded ? "Unreadable" : "Not provided";
      })(),
      detail: evidence.origin.countryCode || (evidence.label.uploaded ? "Origin not readable" : "Not provided"),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-slate-600" />
        </div>
        <h3 className="text-[16px] font-semibold text-slate-900">Facts</h3>
      </div>

      <div className="px-6 py-5 space-y-3">
        {rows.map((row) => {
          const tone = row.state === "Captured"
            ? "border-emerald-200 bg-emerald-50"
            : row.state === "Unreadable"
              ? "border-amber-200 bg-amber-50"
              : row.state === "Inferred"
                ? "border-blue-200 bg-blue-50"
                : "border-slate-100 bg-white";

          const stateBadge = row.state === "Captured"
            ? "text-emerald-700 bg-emerald-100"
            : row.state === "Unreadable"
              ? "text-amber-700 bg-amber-100"
              : row.state === "Inferred"
                ? "text-blue-700 bg-blue-100"
                : "text-slate-600 bg-slate-100";

          return (
            <div key={row.id} className={`flex items-start justify-between gap-3 border rounded-xl px-4 py-3 ${tone}`}>
              <div className="flex-1">
                <div className="text-[14px] font-medium text-slate-900">{row.title}</div>
                <div className="text-[13px] text-slate-600">{row.detail}</div>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${stateBadge}`}>{row.state}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
