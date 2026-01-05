"use client";

import { useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Report } from "@/lib/report/types";
import { useAuth } from "@/lib/hooks/useAuth";

interface NextStepsCardProps {
  report: Report;
  supplierMatches?: any[];
  decisionSupport?: any;
}

export default function NextStepsCard({ report, supplierMatches = [], decisionSupport }: NextStepsCardProps) {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  const items = [
    "At least 3 viable factory quotes",
    "MOQ and lead time confirmed",
    "HS and duty confirmation",
    "Label and origin risk check",
    "Execution-ready plan to your destination country port",
    "Track updates in Orders",
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="text-[16px] font-semibold text-slate-900">Included in verification</h3>
      </div>

      <div className="px-6 py-5">
        <ul className="space-y-2 mb-5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14px] text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={isAuthLoading || isVerificationLoading}
          onClick={async () => {
            setIsVerificationLoading(true);
            try {
              const payload = { reportId: report.id };
              const response = await fetch("/api/orders/from-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (response.status === 401) {
                const returnUrl = `/reports/${report.id}/v2`;
                const encodedReturn = encodeURIComponent(returnUrl);
                router.push(`/signin?next=${encodedReturn}`);
                return;
              }

              const data = await response.json();
              if (!response.ok || !data.orderId) {
                console.error("Request verification failed", data);
                alert(data?.error ? `Request verification failed: ${data.error}` : "Request verification failed");
                return;
              }

              router.push(`/app/orders/${data.orderId}`);
            } finally {
              setIsVerificationLoading(false);
            }
          }}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 text-[14px] font-medium text-white bg-slate-900 rounded-full hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isVerificationLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Users className="w-4 h-4" />
          )}
          {isVerificationLoading ? "Starting..." : "Start verification"}
        </button>
      </div>
    </div>
  );
}
