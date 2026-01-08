// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import type { Report } from "@/lib/report/types";
import ReportV2HeaderWithTabs from "@/components/report-v2/ReportV2HeaderWithTabs";
import OverviewModern from "@/components/report-v2/OverviewModern";
import { Lock } from "lucide-react";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { extractProductName } from "@/lib/report/extractProductName";

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
  const [showVerificationModal, setShowVerificationModal] = useState(false);

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
    // Explicit error box instead of skeleton or null
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Report prop missing in ReportV2Page</h2>
          <p className="text-red-700 text-sm mb-4">
            The report data was not provided to the component. This is a temporary debug message.
          </p>
          <div className="text-xs text-red-600 font-mono bg-red-100 p-3 rounded">
            <div>reportId: {reportId || "undefined"}</div>
            <div>report: {report ? "present" : "missing"}</div>
            <div>initialReport: {initialReport ? "present" : "missing"}</div>
          </div>
        </div>
      </div>
    );
  }

  const displayProductName = extractProductName(resolvedReport.productName || (resolvedReport as any).product_name);

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ ["--report-header-h" as any]: `${headerHeight}px` }}
    >
      <ReportV2HeaderWithTabs
        report={resolvedReport}
        sections={[]}
        onHeightChange={setHeaderHeight}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <OverviewModern report={resolvedReport} />
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-4 py-4 z-50 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <p className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Unlock 15-20% Extra Margin Potential
          </p>
          <button
            onClick={() => setShowVerificationModal(true)}
            className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Start Verification
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          reportId={resolvedReport.id}
          productName={displayProductName}
        />
      )}
    </div>
  );
}
