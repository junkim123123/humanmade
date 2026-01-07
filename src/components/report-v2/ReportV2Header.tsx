"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Report } from "@/lib/report/types";
import { ChevronLeft } from "lucide-react";
import { extractProductName } from "@/lib/report/extractProductName";

interface ReportV2HeaderProps {
  report: Report & {
    _priceUnit?: string;
    _similarRecordsCount?: number;
    _hsCandidatesCount?: number;
    _hasLandedCosts?: boolean;
  };
}

function getConfidenceBadge(confidence: string, similarRecordsCount?: number) {
  if (similarRecordsCount && similarRecordsCount >= 20) return { label: "Strong", color: "bg-green-100 text-green-800" };
  if (similarRecordsCount && similarRecordsCount >= 5) return { label: "Some", color: "bg-yellow-100 text-yellow-800" };
  if (confidence === "high") return { label: "Some", color: "bg-yellow-100 text-yellow-800" };
  return { label: "Low", color: "bg-slate-100 text-slate-800" };
}

export default function ReportV2Header({ report }: ReportV2HeaderProps) {
  const [imageError, setImageError] = useState(false);
  const reportAny = report as any;
  const similarRecordsCount = reportAny._similarRecordsCount || 0;
  const confidenceBadge = getConfidenceBadge(report.confidence, similarRecordsCount);
  
  const imageUrl = reportAny.imageUrl || reportAny.image_url || null;
  const lastUpdated = new Date(report.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back navigation */}
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
          Reports
        </Link>

        {/* Product Info */}
        <div className="flex items-start gap-4">
          {imageUrl && !imageError && (
            <div className="relative w-20 h-20 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
              <Image
                src={imageUrl}
                alt={report.productName}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 truncate">
              {extractProductName(report.productName || report.product_name)}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${confidenceBadge.color}`}>
                {confidenceBadge.label} evidence
              </span>
              <span className="text-sm text-slate-500">
                Updated {lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

