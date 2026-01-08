"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye } from "lucide-react";
import { VerificationConfirmModal } from "@/components/verification/VerificationConfirmModal";

interface ReportListCTAProps {
  reportId: string;
  status: "draft" | "processing" | "completed" | "failed";
}

export function ReportListCTA({ reportId, status }: ReportListCTAProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const goToReport = () => router.push(`/reports/${reportId}/v2`);

  const executeVerification = async () => {
    try {
      setLoading(true);
      console.log("Requesting verification", { reportId });
      const response = await fetch("/api/orders/from-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (response.status === 401) {
        const next = encodeURIComponent(`/reports/${reportId}/v2`);
        router.push(`/signin?next=${next}`);
        return;
      }

      const text = await response.text();
      console.log("/api/orders/from-report raw response", { status: response.status, text });

      let payload: any = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { raw: text };
      }

      const orderId = payload.orderId ?? payload.order_id ?? payload.id;

      if (!response.ok || !orderId) {
        console.error(
          "Request verification failed",
          JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            payload,
          }, null, 2)
        );
        setShowConfirmModal(false);
        return;
      }

      router.push(`/app/orders/${orderId}`);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleAction = async () => {
    if (status === "processing") return goToReport();
    if (status === "failed") {
      router.push("/app/analyze");
      return;
    }
    if (status === "draft") {
      goToReport();
      return;
    }

    // completed -> show confirmation modal
    setShowConfirmModal(true);
  };

  const label = (() => {
    if (status === "completed") return loading ? "Starting..." : "Start verification";
    if (status === "processing") return "View status";
    if (status === "failed") return "Retry analysis";
    return "View report";
  })();

  const style = status === "completed"
    ? "bg-slate-900 text-white hover:bg-slate-800"
    : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300";

  // For completed status, show both View Report and Request Verification buttons
  if (status === "completed") {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToReport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
          >
            <Eye className="w-4 h-4" />
            View report
          </button>
          <button
            type="button"
            onClick={handleAction}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Starting..." : "Start verification"}
          </button>
        </div>
        <VerificationConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={executeVerification}
          isLoading={loading}
        />
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${style} disabled:opacity-60`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}
