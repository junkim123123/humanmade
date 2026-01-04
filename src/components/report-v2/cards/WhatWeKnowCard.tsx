"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import type { Report } from "@/lib/report/types";
import { computeInputStatus, isComplianceCheckComplete } from "@/lib/report/truth";

interface WhatWeKnowCardProps {
  report: Report;
}

export default function WhatWeKnowCard({ report }: WhatWeKnowCardProps) {
  const bullets: string[] = [];
  const inputStatus = computeInputStatus(report);
  const reportAny = report as any;
  
  // Check if compliance is confirmed (never complete, only draft)
  const complianceStatus = reportAny._draft?.complianceStatus || "Incomplete";

  // Only add positive signals
  if (report.evidenceLevel === "verified_quote") {
    bullets.push("Verified quote from supplier on file");
  } else if (report.evidenceLevel === "exact_import") {
    bullets.push("Exact import match found in recent shipments");
  } else if (report.evidenceLevel === "similar_import") {
    bullets.push("Similar products imported from this category");
  }

  // Only claim weight is confirmed if unitWeight state is "confirmed"
  if (inputStatus.unitWeight.state === "confirmed") {
    bullets.push("Unit weight confirmed from label");
  }

  // Show draft compliance status (never "complete")
  const labelOcrStatus = (reportAny._proof?.inputStatus?.labelOcrStatus || reportAny.inputStatus?.labelOcrStatus || reportAny.extras?.inputStatus?.labelOcrStatus || reportAny.extras?.proof?.inputStatus?.labelOcrStatus);
  if (complianceStatus === "Incomplete") {
    bullets.push("Draft compliance snapshot (auto-inferred, not verified)");
  } else {
    bullets.push("Compliance preliminary (needs verification)");
  }

  const bullets_trimmed = bullets.slice(0, 3);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="font-semibold text-slate-900 mb-4">What we know well</h3>
      
      <ul className="space-y-3">
        {bullets_trimmed.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-700">{bullet}</span>
          </li>
        ))}
      </ul>

      {bullets_trimmed.length === 0 && (
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-slate-500">Upload more details to unlock confidence signals</span>
        </div>
      )}
    </div>
  );
}
