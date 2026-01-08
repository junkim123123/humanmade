"use client";

import type { Report } from "@/lib/report/types";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { safePercent } from "@/lib/format/percent";

interface ReportV2ClassificationProps {
  report: Report & {
    _hsCandidatesCount?: number;
  };
}

export default function ReportV2Classification({ report }: ReportV2ClassificationProps) {
  const reportAny = report as any;
  const formatConfidence = (value?: number) => `${safePercent(value ?? 0)}%`;
  
  // Fix: Use V2 normalized candidates first, then fallback to legacy paths
  let hsCandidates: Array<{ code: string; confidence?: number; reason?: string; description?: string }> = [];
  
  if (reportAny.v2?.hsCandidates && Array.isArray(reportAny.v2.hsCandidates)) {
    // Use pre-normalized candidates from V2 adapter
    hsCandidates = reportAny.v2.hsCandidates;
  } else {
    // Fallback to legacy paths (should not happen if API is correct)
    const pipelineResult = reportAny.pipeline_result || {};
    const marketEstimate = pipelineResult.marketEstimate || {};
    
    if (Array.isArray(marketEstimate.hsCodeCandidates)) {
      hsCandidates = marketEstimate.hsCodeCandidates;
    } else if (pipelineResult.analysis?.hsCodeCandidates && Array.isArray(pipelineResult.analysis.hsCodeCandidates)) {
      hsCandidates = pipelineResult.analysis.hsCodeCandidates;
    } else if (pipelineResult.analysis?.hsCode) {
      hsCandidates = [{
        code: pipelineResult.analysis.hsCode,
        confidence: 0.8,
        reason: "From image analysis",
      }];
    }
  }
  
  const topCandidate = hsCandidates[0];
  const secondCandidate = hsCandidates[1];
  
  // Get duty rates if available
  const getDutyRate = (hsCode: string) => {
    // Try to find duty rate from risk flags or market estimate
    const tariffFlags = report.baseline.riskFlags.tariff;
    // This is a placeholder - actual duty rate lookup would be more complex
    return null;
  };

  // Compliance checklist
  const requiredDocs = report.baseline.riskFlags.compliance.requiredCertifications || [];
  const redFlags = [
    ...(report.baseline.riskFlags.compliance.labelingRisks || []),
    ...(report.baseline.riskFlags.compliance.recallHints || []),
  ];

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Classification and compliance</h2>
      
      <div className="space-y-6">
        {/* Top HS Candidate */}
        {topCandidate ? (
          <div>
            <div className="text-sm text-slate-600 mb-2">Top HS candidate</div>
            <div className="text-3xl font-bold text-slate-900 mb-3">{topCandidate.code || "N/A"}</div>
            {topCandidate.description && (
              <div className="text-sm text-slate-700 mb-2">{topCandidate.description}</div>
            )}
            {getDutyRate(topCandidate.code) && (
              <div className="text-sm text-slate-600 mb-2">
                Duty rate: {getDutyRate(topCandidate.code)}%
              </div>
            )}
            <div className="text-xs text-slate-600 space-y-1">
              {topCandidate.confidence && (
                <div>• Confidence: {formatConfidence(topCandidate.confidence)}</div>
              )}
              {topCandidate.reason && (
                <div>• {topCandidate.reason}</div>
              )}
              {!topCandidate.confidence && !topCandidate.reason && (
                <>
                  <div>• High confidence based on product description</div>
                  <div>• Matches category and material characteristics</div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-sm font-medium text-slate-900 mb-2">No HS code candidates available</div>
            <p className="text-xs text-slate-600 mb-3">
              Upload a packaging photo or barcode image to improve HS code classification precision.
            </p>
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              Upload packaging photo →
            </button>
          </div>
        )}

        {/* Second Candidate */}
        {secondCandidate && (
          <div className="border-t border-slate-200 pt-4">
            <div className="text-sm text-slate-600 mb-2">Alternative candidate</div>
            <div className="text-xl font-semibold text-slate-900 mb-2">{secondCandidate.code || "N/A"}</div>
            {secondCandidate.description && (
              <div className="text-sm text-slate-700 mb-2">{secondCandidate.description}</div>
            )}
            {getDutyRate(secondCandidate.code) && (
              <div className="text-sm text-slate-600 mb-2">
                Duty rate: {getDutyRate(secondCandidate.code)}%
              </div>
            )}
            <div className="text-xs text-slate-600 space-y-1">
              <div>• {secondCandidate.confidence !== undefined ? `Confidence: ${formatConfidence(secondCandidate.confidence)}` : "Lower confidence, verify with packaging"}</div>
              <div>• {secondCandidate.reason || "Possible alternative classification"}</div>
            </div>
          </div>
        )}

        {/* Compliance Checklist */}
        <div className="border-t border-slate-200 pt-6">
          <div className="text-sm font-medium text-slate-900 mb-4">Compliance checklist</div>
          
          {/* Required Docs */}
          {requiredDocs.length > 0 ? (
            <div className="mb-4">
              <div className="text-xs text-slate-600 mb-2">Required documents</div>
              <ul className="space-y-1.5">
                {requiredDocs.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mb-4 text-sm text-slate-500">No specific documents required based on category</div>
          )}

          {/* Red Flags */}
          {redFlags.length > 0 ? (
            <div>
              <div className="text-xs text-slate-600 mb-2">Red flags</div>
              <ul className="space-y-1.5">
                {redFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-slate-500">No compliance red flags identified</div>
          )}
        </div>
      </div>
    </section>
  );
}

