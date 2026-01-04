// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import type { Report } from "@/lib/report/types";
import ReportV2HeaderWithTabs from "@/components/report-v2/ReportV2HeaderWithTabs";
import OverviewModern from "@/components/report-v2/OverviewModern";

export interface ReportV2PageProps {
  reportId?: string;
  report?: Report & {
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
  initialReport?: Report;
}

export default function ReportV2Page({ reportId, report, initialReport }: ReportV2PageProps) {
  const resolvedReport = useMemo(() => initialReport ?? report, [initialReport, report]);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Debug: Log report data on mount
  if (typeof window !== 'undefined') {
    console.log('[ReportV2Page] Report data received:', {
      reportId,
      hasReport: !!resolvedReport,
      reportId: resolvedReport?.id,
      hasSupplierMatches: !!(resolvedReport as any)?._supplierMatches,
      supplierMatchesCount: Array.isArray((resolvedReport as any)?._supplierMatches) 
        ? (resolvedReport as any)._supplierMatches.length 
        : 0,
      reportKeys: resolvedReport ? Object.keys(resolvedReport).filter(k => 
        k.includes('supplier') || k.includes('factory') || k.includes('match')
      ) : [],
    });
  }

  if (!resolvedReport) {
    console.error('[ReportV2Page] No report provided');
    return null;
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{ ["--report-header-h" as any]: `${headerHeight}px` }}
    >
      <ReportV2HeaderWithTabs
        report={resolvedReport}
        sections={[]}
        onHeightChange={setHeaderHeight}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OverviewModern report={resolvedReport} />
      </div>
    </div>
  );
}
