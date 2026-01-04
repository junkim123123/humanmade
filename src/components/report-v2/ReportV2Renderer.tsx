"use client";

import { useMemo, useState } from "react";
import type { Report } from "@/lib/report/types";
import ReportV2HeaderWithTabs from "@/components/report-v2/ReportV2HeaderWithTabs";
import OverviewModern from "@/components/report-v2/OverviewModern";

export interface ReportV2RendererProps {
  report: Report & {
    _priceUnit?: string;
    _similarRecordsCount?: number;
    _hsCandidatesCount?: number;
    _hasLandedCosts?: boolean;
    _supplierMatches?: Array<any>;
    _supplierRecommendedCount?: number;
    _supplierCandidateCount?: number;
    _questionsChecklist?: {
      title: string;
      items: Array<{ q: string; why: string }>;
    };
    _coverage?: {
      similarRecordsCount: number;
      evidenceSource: string;
      leadsCount: number;
      avgPricingCoverage: number;
      hasEnrichment: boolean;
      totalRelatedItems: number;
    };
    supplierEmptyReason?: "no_signals" | "no_matches" | "pipeline_error";
    supplierMatchMode?: "normal" | "fallback";
  };
}

// V2 Renderer Shared Badge component (dev only)
function V2RendererBadge() {
  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-medium shadow-sm">
        <span>V2 Renderer Shared</span>
      </div>
    </div>
  );
}

export default function ReportV2Renderer({ report }: ReportV2RendererProps) {
  const [headerHeight, setHeaderHeight] = useState(0);

  if (!report) {
    console.error('[ReportV2Renderer] No report provided');
    // Explicit error box instead of skeleton or null
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Report prop missing in ReportV2Renderer</h2>
          <p className="text-red-700 text-sm mb-4">
            The report data was not provided to the component. This is a temporary debug message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <V2RendererBadge />
      <div
        className="min-h-screen bg-white"
        style={{ ["--report-header-h" as any]: `${headerHeight}px` }}
      >
        <ReportV2HeaderWithTabs
          report={report}
          sections={[]}
          onHeightChange={setHeaderHeight}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OverviewModern report={report} />
        </div>
      </div>
    </>
  );
}

