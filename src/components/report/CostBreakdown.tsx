// @ts-nocheck
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface CostBreakdownProps {
  report: Report;
}

export function CostBreakdown({ report }: CostBreakdownProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (item: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(item)) {
      newExpanded.delete(item);
    } else {
      newExpanded.add(item);
    }
    setExpandedItems(newExpanded);
  };

  const costItems = [
    {
      id: "factory",
      label: "Factory Price Range",
      conservative: report.baseline.costRange.conservative.unitPrice,
      standard: report.baseline.costRange.standard.unitPrice,
      reason: "Based on similar import records and category-specific market benchmarks",
    },
    {
      id: "shipping",
      label: "Shipping Cost Range",
      conservative: report.baseline.costRange.conservative.shippingPerUnit,
      standard: report.baseline.costRange.standard.shippingPerUnit,
      reason: "Estimated range for Air Express based on product weight and volume",
    },
    {
      id: "duty",
      label: "Duties and Fees Range",
      conservative:
        report.baseline.costRange.conservative.dutyPerUnit +
        report.baseline.costRange.conservative.feePerUnit,
      standard:
        report.baseline.costRange.standard.dutyPerUnit +
        report.baseline.costRange.standard.feePerUnit,
      reason: "Applied estimated duty rates and service fees based on HS code range",
    },
    {
      id: "total",
      label: "Landed Cost per Unit",
      conservative: report.baseline.costRange.conservative.totalLandedCost,
      standard: report.baseline.costRange.standard.totalLandedCost,
      reason: "Total of Factory Price + Shipping + Duties and Fees",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Cost Breakdown</h2>
      <div className="space-y-4">
        {costItems.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          return (
            <div
              key={item.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">{item.label}</h3>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Conservative</div>
                      <div className="text-lg font-bold text-slate-900">
                        ${item.conservative.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Standard</div>
                      <div className="text-base font-semibold text-slate-700">
                        ${item.standard.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="ml-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-600">{item.reason}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

