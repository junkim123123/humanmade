"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/report/types";
import { ChevronLeft } from "lucide-react";
import { VerificationConfirmModal } from "@/components/verification/VerificationConfirmModal";
import { getSupplierMatches } from "@/lib/report/normalizeReport";

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
    label += " — upgrade to verified plan";
  } else if (verifiedSignalsCount === 0) {
    label += " — verify to unlock";
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
      <div ref={headerRef} className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: Back link */}
          <div className="py-3">
            <Link
              href="/app/reports"
              className="inline-flex items-center gap-1 text-[14px] text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Reports
            </Link>
          </div>

          {/* Row 2: Product Info */}
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {report.productName}
              </h1>
              {/* V2 Badge - visible marker to confirm correct renderer (dev only) */}
              {process.env.NODE_ENV !== "production" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  Report V2
                  {report.schemaVersion && (
                    <span className="ml-1 text-blue-600">v{report.schemaVersion}</span>
                  )}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${evidenceBadge.color}`}>
                {evidenceBadge.label}
              </span>
              <span className="text-[13px] text-slate-500">
                Draft buy plan — we&apos;ll lock numbers after verification.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="sticky bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <button
                onClick={handleRequestVerification}
                disabled={isRequesting}
                className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 shrink-0 w-full sm:w-auto"
              >
                {isRequesting ? "Starting..." : "Optimize Sourcing & Unlock Network"}
              </button>
              <div className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/60 max-w-2xl">
                <p className="text-[12px] font-semibold text-blue-900 mb-1">
                  💡 High-Impact Optimization
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Leverage NexSupply's internal network data to find factories with 15-20% higher margins than public data matches.
                </p>
              </div>
            </div>
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
