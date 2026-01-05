"use client";

import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { useState } from "react";

export type ProofStatus = "verified" | "assumption" | "needs-proof";

interface ProofStatusBadgeProps {
  status: ProofStatus;
  tooltip?: string;
  className?: string;
}

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    label: "Network Optimized",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    iconColor: "text-emerald-600",
    tooltip: "Optimized via proprietary intelligence network. Higher margin potential than public data.",
  },
  assumption: {
    icon: AlertCircle,
    label: "Assumption based",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    iconColor: "text-amber-600",
    tooltip: "Category average applied. Editable",
  },
  "needs-proof": {
    icon: HelpCircle,
    label: "Needs more proof",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    iconColor: "text-red-600",
    tooltip: "Upload barcode/label to increase accuracy",
  },
};

export function ProofStatusBadge({ 
  status, 
  tooltip, 
  className = "" 
}: ProofStatusBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayTooltip = tooltip || config.tooltip;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${config.bgColor} ${config.borderColor} ${config.textColor} cursor-help transition-all hover:shadow-sm`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Icon className={`w-3 h-3 ${config.iconColor}`} />
        <span className="text-xs font-semibold">{config.label}</span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap pointer-events-none">
          {displayTooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
}

