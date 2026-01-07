"use client";

import { Info } from "lucide-react";
import { useState } from "react";

/**
 * DraftChip - Shows "Draft" badge for inferred values
 */
export function DraftChip({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ${className}`}>
      Initial Intelligence Draft
    </span>
  );
}

/**
 * ConfidencePill - Shows confidence score as percentage
 */
export function ConfidencePill({ 
  confidence, 
  className = "" 
}: { 
  confidence: number; 
  className?: string;
}) {
  const percent = Math.round(confidence * 100);
  
  // Color based on confidence
  let colorClass = "bg-slate-100 text-slate-700";
  if (confidence >= 0.8) {
    colorClass = "bg-emerald-100 text-emerald-700";
  } else if (confidence >= 0.5) {
    colorClass = "bg-amber-100 text-amber-700";
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {percent}%
    </span>
  );
}

/**
 * EvidenceTooltip - Shows evidence snippet on hover
 */
export function EvidenceTooltip({ 
  evidenceSnippet, 
  children,
  className = ""
}: { 
  evidenceSnippet: string | null; 
  children?: React.ReactNode;
  className?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!evidenceSnippet || evidenceSnippet === "Not found" || evidenceSnippet === "Not visible") {
    return <>{children}</>;
  }
  
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        type="button"
      >
        {children || <Info className="w-4 h-4" />}
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50 w-48">
          <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg">
            <p className="font-medium mb-1">Evidence:</p>
            <p className="italic">"{evidenceSnippet}"</p>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-slate-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DraftFieldRow - Complete row for a draft field with all badges
 */
export function DraftFieldRow({
  label,
  value,
  confidence,
  evidenceSnippet,
  showDraft = true,
  className = "",
}: {
  label: string;
  value: string | null;
  confidence: number;
  evidenceSnippet: string | null;
  showDraft?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between py-2 border-b border-slate-100 last:border-0 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {showDraft && <DraftChip />}
          <ConfidencePill confidence={confidence} />
          <EvidenceTooltip evidenceSnippet={evidenceSnippet} />
        </div>
        <p className="text-sm text-slate-900">{value || "Not detected"}</p>
      </div>
    </div>
  );
}

/**
 * DraftSection - Container for grouped draft fields
 */
export function DraftSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          {title}
          <DraftChip />
        </h3>
        {description && (
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
