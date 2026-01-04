"use client";

import { Upload, CheckCircle, AlertCircle } from "lucide-react";

interface SupplierCandidatesEmptyStateProps {
  reasonCode: "no_signals" | "no_matches" | "pipeline_error" | "rerank_zero_fallback";
  onUploadBarcode?: () => void;
  onUploadLabel?: () => void;
  uploadsOptional?: boolean;
}

export default function SupplierCandidatesEmptyState({
  reasonCode,
  onUploadBarcode,
  onUploadLabel,
  uploadsOptional = false,
}: SupplierCandidatesEmptyStateProps) {
  if (reasonCode === "no_signals") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">Supplier shortlist</h3>
            <p className="text-[12px] text-slate-500">Shortlisted, not verified</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-[14px] text-slate-700 mb-5">
            We could not build enough signals to search suppliers. Add one more proof point (barcode or label) or proceed to verification to let our team source manually.
          </p>

          {uploadsOptional && (
            <div className="space-y-3 mb-5">
              <button
                onClick={onUploadBarcode}
                className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <Upload className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="text-[14px] font-medium text-slate-900">Upload barcode</p>
                  <p className="text-[13px] text-slate-500">Finds exact product matches in trade databases</p>
                </div>
              </button>

              <button
                onClick={onUploadLabel}
                className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <Upload className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <div>
                  <p className="text-[14px] font-medium text-slate-900">Upload label photo</p>
                  <p className="text-[13px] text-slate-500">Extracts brand, weight, origin for category matching</p>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-[12px] text-slate-500">
            You can proceed anyway—verification can start outreach with minimal signals.
          </p>
        </div>
      </div>
    );
  }

  if (reasonCode === "no_matches" || reasonCode === "pipeline_error" || reasonCode === "rerank_zero_fallback") {
    const isError = reasonCode === "pipeline_error";
    const isZeroFallback = reasonCode === "rerank_zero_fallback";
    
    let title = "Candidate factories";
    let description = "No supplier matches found yet. Upload a clear barcode or label to improve matching.";
    
    if (isError) {
      title = "Supplier matching unavailable";
      description = "We encountered a temporary issue finding suppliers. You can still proceed with verification to get quotes.";
    } else if (isZeroFallback) {
      title = "No strong supplier matches";
      description = "While we found some suppliers, none met our confidence thresholds. Verification will help identify better-fit suppliers and get competitive quotes.";
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>
            <p className="text-[12px] text-slate-500">Shortlisted, not verified</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-[14px] text-slate-700 mb-5">{description}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[13px] text-slate-600">
              <span className="font-medium">Next step:</span> Use the "Start verification" button at the top to reach out to suppliers and request quotes.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-[12px] text-slate-500">
            Verification will contact a network of qualified suppliers on your behalf. Outreach starts within 12 hours and quotes typically arrive in about a week.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
