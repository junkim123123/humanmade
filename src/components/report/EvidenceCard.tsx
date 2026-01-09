// @ts-nocheck
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface EvidenceCardProps {
  report: Report;
}

export function EvidenceCard({ report }: EvidenceCardProps) {
  const reportAny = report as any;
  const similarCount = reportAny._similarRecordsCount || 0;
  const hsCandidatesCount = reportAny._hsCandidatesCount || 0;
  const similarRecordsSample = reportAny._similarRecordsSample || [];
  const marketEstimate = reportAny._marketEstimate;
  
  const evidenceTypes = report.baseline.evidence.types;
  const lastUpdated = report.baseline.evidence.lastSuccessAt || report.updatedAt;
  const priceUnit = reportAny._priceUnit || "per unit";

  // Determine evidence source label
  const sourceLabel = evidenceTypes.includes("similar_records")
    ? "internal records"
    : evidenceTypes.includes("category_based")
    ? "category_based"
    : "regulation_check";

  return (
    <Card className="p-5 bg-white border border-slate-200 rounded-xl">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Evidence</h3>

      <div className="space-y-4">
        {/* Similar records count */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Evidence Basis</div>
          <div className="text-sm font-medium text-slate-900">
            {similarCount > 0 
              ? `${similarCount} internal records`
              : "category_based"}
          </div>
        </div>

        {/* HS candidates count */}
        <div>
          <div className="text-xs text-slate-500 mb-1">HS Candidates</div>
          <div className="text-sm font-medium text-slate-900">
            {hsCandidatesCount}
          </div>
        </div>

        {/* Price unit */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Unit</div>
          <div className="text-sm font-medium text-slate-900">
            {priceUnit}
          </div>
        </div>

        {/* Evidence source */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Evidence source</div>
          <div className="text-sm font-medium text-slate-900">
            {sourceLabel}
          </div>
        </div>

        {/* Last updated */}
        <div>
          <div className="text-xs text-slate-500 mb-1">Last updated</div>
          <div className="text-sm font-medium text-slate-900">
            {new Date(lastUpdated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Sample records (collapsible) */}
        {similarRecordsSample.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="samples" className="border-none">
              <AccordionTrigger className="text-xs text-slate-500 hover:no-underline py-2">
                View {similarRecordsSample.length} sample records
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {similarRecordsSample.map((sample: any, index: number) => (
                    <div key={index} className="text-xs text-slate-600 border-l-2 border-slate-200 pl-2">
                      <div className="font-medium">{sample.exporterName || sample.supplier_name}</div>
                      {sample.unit_price && (
                        <div>${sample.unit_price} / MOQ: {sample.moq || "N/A"}</div>
                      )}
                      {sample.lead_time && <div>Lead time: {sample.lead_time} days</div>}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </Card>
  );
}

