"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import type { DecisionSupport } from "@/lib/server/decision-support-builder";
import { ConfidencePill, EvidenceTooltip } from "@/components/ui/draft-primitives";
import { safePercent } from "@/lib/format/percent";

interface HsDutyCardProps {
  decisionSupport?: DecisionSupport;
  hsCandidates?: Array<{
    code: string;
    confidence: number;
    rationale: string;
    evidenceSnippet?: string | null;
    status?: string;
  }>;
}

export default function HsDutyCard({ decisionSupport, hsCandidates }: HsDutyCardProps) {
  // Use hsCandidates if decisionSupport is not available
  if (!decisionSupport && hsCandidates && hsCandidates.length > 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[16px] font-semibold text-slate-900">Estimate</h3>
            <span className="text-[12px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 italic">Initial Intelligence Draft</span>
          </div>
          <p className="text-[13px] text-slate-500">Draft range (duty, freight, unit landed cost). Confirmed during verification.</p>
        </div>
        
        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-[12px] text-slate-500 font-medium mb-3">HS Code Candidates</p>
            <div className="space-y-2">
              {hsCandidates.map((candidate, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono font-semibold text-slate-900">
                        {candidate.code}
                      </p>
                      <span className="text-[11px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium italic">
                        Initial Intelligence Draft
                      </span>
                      {candidate.confidence >= 0.92 && (
                        <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-semibold">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-500">{candidate.rationale}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <ConfidencePill confidence={candidate.confidence} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-amber-700 mt-3">Confidence is low; confirm with customs before finalizing.</p>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-[12px] text-slate-500">
            Start verification to confirm HS classification, origin, and duty rate.
          </p>
        </div>
      </div>
    );
  }
  
  if (!decisionSupport) {
    return null;
  }
  
  const { hs, dutyRate } = decisionSupport;

  const toRatio = (value?: number) => safePercent(value) / 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[16px] font-semibold text-slate-900">Estimate</h3>
          {hs.status === "DRAFT" && (
            <span className="text-[12px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 italic">Initial Intelligence Draft</span>
          )}
        </div>
        <p className="text-[13px] text-slate-500">Draft range (duty, freight, unit landed cost). Confirmed during verification.</p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {hs.hybridPaths && hs.hybridPaths.length >= 2 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-[13px] font-semibold text-amber-800 mb-3">Hybrid classification</p>
            <div className="space-y-3">
              {hs.hybridPaths.map((path, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-mono text-[14px] font-semibold text-slate-900">{path.code}</p>
                    <p className="text-[13px] text-slate-600">{path.label}</p>
                    <p className="text-[12px] text-slate-500 mt-1">{path.when}</p>
                  </div>
                  {path.confidence !== undefined && (
                    <ConfidencePill confidence={path.confidence / 100} />
                  )}
                </div>
              ))}
            </div>
            {hs.decisionRule && (
              <p className="text-[12px] text-slate-600 mt-3">{hs.decisionRule}</p>
            )}
          </div>
        )}

        {/* HS Candidates */}
        <div>
          <p className="text-[12px] text-slate-500 font-medium mb-3">HS Code Candidates</p>
          <div className="space-y-2">
            {hs.candidates.slice(0, 3).map((candidate, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-semibold text-slate-900">
                      {candidate.code}
                    </p>
                    {candidate.source === "FALLBACK" && (
                      <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                        Fallback
                      </span>
                    )}
                    {toRatio(candidate.confidence) >= 0.92 && (
                      <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-semibold">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500">{candidate.rationale}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <EvidenceTooltip evidenceSnippet={candidate.evidenceSnippet}>
                    <ConfidencePill confidence={toRatio(candidate.confidence)} />
                  </EvidenceTooltip>
                </div>
              </div>
            ))}
          </div>
          {hs.candidates[0]?.confidence !== undefined && toRatio(hs.candidates[0].confidence) < 0.6 && (
            <p className="text-[12px] text-amber-700 mt-3">Confidence is low; confirm with customs before finalizing.</p>
          )}
        </div>

        {/* Duty Rate Range */}
        <div className="pt-5 border-t border-slate-100">
          <p className="text-[12px] text-slate-500 font-medium mb-3">Duty estimate range</p>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[20px] font-bold text-slate-900">
                {dutyRate.rateMin}%
              </span>
              <span className="text-slate-400">–</span>
              <span className="text-[20px] font-bold text-slate-900">
                {dutyRate.rateMax}%
              </span>
            </div>
            <p className="text-[12px] text-slate-500">{dutyRate.rationale}</p>
            {/* Wide range rationale */}
            {(dutyRate.rateMax - dutyRate.rateMin > 5) && (
              <p className="text-[12px] text-amber-700 mt-2">Origin not confirmed so tariff band is wide.</p>
            )}
            {/* Tighten tip */}
            {(dutyRate.rateMax - dutyRate.rateMin > 5 || decisionSupport.dutyRate.status !== 'CONFIRMED') && (
              <p className="text-[12px] text-blue-700 mt-1">Upload label photo to confirm origin and ingredients.</p>
            )}
          </div>
        </div>

        {/* Category Info */}
        {hs.customsCategoryText && (
          <div className="pt-5 border-t border-slate-100">
            <p className="text-[12px] text-slate-500 font-medium mb-2">Customs Category</p>
            <p className="text-[14px] text-slate-700">{hs.customsCategoryText}</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
        <p className="text-[12px] text-slate-500">
          Start verification to confirm HS classification, origin, and duty rate.
        </p>
      </div>
    </div>
  );
}
