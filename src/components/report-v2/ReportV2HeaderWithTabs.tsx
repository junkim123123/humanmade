"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/report/types";
import { ChevronLeft } from "lucide-react";
import { VerificationConfirmModal } from "@/components/verification/VerificationConfirmModal";
import { getSupplierMatches } from "@/lib/report/normalizeReport";
import { extractProductName } from "@/lib/report/extractProductName";

interface ReportV2HeaderWithTabsProps {
  report: Report & {
    _priceUnit?: string;
    _similarRecordsCount?: number;
    _hsCandidatesCount?: number;
    _hasLandedCosts?: boolean;
  };
  sections: Array<{ id: string; label: string }>;
  onHeightChange?: (height: number) => void;
}

function getEvidenceBadge(report: Report & { _similarRecordsCount?: number }) {
  const inferred = ((report as any).baseline?.evidence?.inferredInputs || {}) as Record<string, any>;
  const verifiedSignalsCount = Object.values(inferred).filter((value: any) => {
    const prov = value?.provenance;
    return prov && prov !== "category_default";
  }).length;

  const plural = verifiedSignalsCount === 1 ? "signal" : "signals";
  let label = verifiedSignalsCount === 0 ? "Proof pending" : `Proof found ${verifiedSignalsCount} ${plural}`;
  // Add action text for non-high evidence levels
  if (verifiedSignalsCount < 3 && verifiedSignalsCount > 0) {
    label += " — upgrade";
  } else if (verifiedSignalsCount === 0) {
    label += " — verify";
  }
  if (verifiedSignalsCount >= 3) return { label, color: "bg-emerald-100 text-emerald-800", count: verifiedSignalsCount };
  if (verifiedSignalsCount >= 1) return { label, color: "bg-blue-100 text-blue-800", count: verifiedSignalsCount };
  return { label, color: "bg-slate-100 text-slate-800", count: 0 };
}

export default function ReportV2HeaderWithTabs({ report, sections, onHeightChange }: ReportV2HeaderWithTabsProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const reportAny = report as any;
  const evidenceBadge = getEvidenceBadge(report as any);
  
  // Get supplier matches count for CTA text
  const supplierMatches = getSupplierMatches(reportAny);
  const factoryCount = supplierMatches.length > 0 ? supplierMatches.length : 3; // Default to 3 if no matches

  const verificationStatus = reportAny.signals?.verificationStatus || reportAny.baseline?.signals?.verificationStatus || "none";
  const isVerified = verificationStatus !== "none";

  // Track header height
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current && onHeightChange) {
        onHeightChange(headerRef.current.offsetHeight);
      }
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
      updateHeight();
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [onHeightChange]);

  const handleRequestVerification = () => {
    if (isVerified) {
      router.push(`/app/orders/${reportAny.signals?.verificationOrderId}`);
      return;
    }
    setShowConfirmModal(true);
  };

  const executeVerification = async () => {
    try {
      setIsRequesting(true);
      const response = await fetch("/api/orders/from-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: (report as any).id }),
      });

      const text = await response.text();
      let payload: any;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_err) {
        payload = { rawText: text };
      }

      if (response.status === 401) {
        const next = encodeURIComponent(`/reports/${(report as any).id}/v2`);
        router.push(`/signin?next=${next}`);
        return;
      }

      if (!response.ok || !payload?.orderId) {
        console.error("Request verification failed", {
          status: response.status,
          statusText: response.statusText,
          payload,
        });
        // You might want to show a toast error here
        setShowConfirmModal(false);
        return;
      }

      router.push(`/app/orders/${payload.orderId}`);
    } finally {
      setIsRequesting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <div ref={headerRef} className="bg-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: Back link */}
          <div className="pt-6 pb-4">
            <Link
              href="/app/reports"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Reports
            </Link>
          </div>

          {/* Row 2: Product Info - Clean and Spacious */}
          <div className="pb-8">
            <div className="flex flex-col gap-2 mb-3">
              {(report as any).isSample && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100 w-fit uppercase tracking-tight">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Example Analysis Basis: {extractProductName(report.productName || (report as any).product_name)}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                {extractProductName(report.productName || (report as any).product_name)}
              </h1>
            </div>
            <p className="text-base text-slate-600 max-w-2xl">
              Supply Chain Intelligence Report
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA - Simplified and Cleaner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 mb-1">
                {isVerified ? "Verification in progress" : "Ready to optimize your sourcing?"}
              </p>
              <p className="text-sm text-slate-600">
                {isVerified ? "We're currently contacting direct factories." : "Access verified factories with 15-20% better margins"}
              </p>
            </div>
            <button
              onClick={handleRequestVerification}
              disabled={isRequesting}
              className={`inline-flex items-center justify-center h-12 px-8 text-base font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${
                isVerified 
                  ? "bg-slate-100 text-slate-900 hover:bg-slate-200" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRequesting ? "Starting..." : isVerified ? "View Order" : "Lock in This Margin"}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Confirm Modal */}
      <VerificationConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeVerification}
        isLoading={isRequesting}
      />
    </>
  );
}
