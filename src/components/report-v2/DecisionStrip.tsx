"use client";

import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface DecisionStripProps {
  report: Report;
}

export default function DecisionStrip({ report }: DecisionStripProps) {
  const reportAny = report as any;
  const evidenceLevel = report.evidenceLevel || "category_prior";

  const getConclusionText = () => {
    if (evidenceLevel === "verified_quote") {
      return "Verified supplier quote on file. Ready to execute.";
    } else if (evidenceLevel === "exact_import") {
      return "Exact import match found; estimate backed by recent shipments.";
    } else if (evidenceLevel === "similar_import") {
      return "Similar imports found; estimate uses category benchmarks.";
    } else {
      return "Estimate uses category benchmarks. Request verification to start supplier outreach.";
    }
  };

  const getIconAndColor = () => {
    if (evidenceLevel === "verified_quote" || evidenceLevel === "exact_import") {
      return { icon: CheckCircle2, bgColor: "bg-emerald-50", borderColor: "border-emerald-200", iconColor: "text-emerald-600", textColor: "text-emerald-900" };
    } else if (evidenceLevel === "similar_import") {
      return { icon: TrendingUp, bgColor: "bg-blue-50", borderColor: "border-blue-200", iconColor: "text-blue-600", textColor: "text-blue-900" };
    } else {
      return { icon: AlertCircle, bgColor: "bg-emerald-50/30", borderColor: "border-emerald-100", iconColor: "text-emerald-600", textColor: "text-emerald-900" };
    }
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = getIconAndColor();

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 mb-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor}`}>
              {getConclusionText()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
