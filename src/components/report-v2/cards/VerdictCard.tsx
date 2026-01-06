"use client";

import { CheckCircle2, AlertCircle, XCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface VerdictCardProps {
  verdict: {
    decision: "GO" | "HOLD" | "NO";
    reasons: string[];
    confidence: number;
  };
  verdictText?: string; // Optional pre-written verdict text from template
  nudge?: {
    actionKey: string;
    actionText: string;
    tipText: string;
    severity: "high" | "medium" | "low";
    target: string;
  };
}

export default function VerdictCard({ verdict, verdictText, nudge }: VerdictCardProps) {
  const { decision, reasons, confidence } = verdict;
  
  // Use template text if available, otherwise use reasons
  const displayText = verdictText || reasons.join(" ");
  
  const decisionConfig = {
    GO: {
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      bgColor: "bg-emerald-50",
      label: "Go",
    },
    HOLD: {
      icon: AlertCircle,
      color: "bg-amber-100 text-amber-700 border-amber-200",
      bgColor: "bg-amber-50",
      label: "Hold",
    },
    NO: {
      icon: XCircle,
      color: "bg-red-100 text-red-700 border-red-200",
      bgColor: "bg-red-50",
      label: "No Go",
    },
    VOLUME_SENSITIVE: {
      icon: AlertCircle,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      bgColor: "bg-yellow-50",
      label: "Volume Sensitive",
    },
    REQUIRES_VERIFICATION: {
      icon: AlertCircle,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      bgColor: "bg-blue-50",
      label: "Requires Verification",
    },
  };
  
  const config = decisionConfig[decision];
  const Icon = config.icon;
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[16px] font-semibold text-slate-900">Verdict</h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}>
            <Icon className="w-4 h-4" />
            <span className="text-[13px] font-medium">{config.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                decision === "GO"
                  ? "bg-emerald-500"
                  : confidence >= 70
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="text-[12px] text-slate-600 font-medium">{confidence * 100}% confidence</span>
        </div>
      </div>
      
      <div className={`px-6 py-4 ${config.bgColor}`}>
        {verdictText ? (
          // Render template text as a single paragraph
          <p className="text-[13px] text-slate-700 leading-relaxed mb-3">{verdictText}</p>
        ) : (
          // Fallback to reasons list
          <>
            <p className="text-[13px] font-medium text-slate-900 mb-2">Key reasons:</p>
            <ul className="space-y-1.5 mb-3">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[13px] text-slate-700">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        
        {/* Next best action and tip */}
        {nudge && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                const uploadsSection = document.getElementById("uploadsSection");
                if (uploadsSection) {
                  uploadsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="text-left w-full"
            >
              <p className="text-[13px] font-medium text-slate-900 mb-1.5 hover:text-slate-700 transition-colors">
                {nudge.actionText}
              </p>
              <p className="text-[12px] text-slate-600 italic">
                {nudge.tipText}
              </p>
            </button>
          </div>
        )}

        {/* CTA buttons for NO GO verdict */}
        {decision === "NO" && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Another Product
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Browse High-Margin Categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

