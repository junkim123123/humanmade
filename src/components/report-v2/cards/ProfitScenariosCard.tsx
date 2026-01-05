"use client";

import { TrendingUp } from "lucide-react";
import type { DecisionSupport } from "@/lib/server/decision-support-builder";

interface ProfitScenariosCardProps {
  decisionSupport: DecisionSupport;
}

export default function ProfitScenariosCard({
  decisionSupport,
}: ProfitScenariosCardProps) {
  const { profit, cost } = decisionSupport;
  const currency = cost.currency || "USD";

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const formatPercent = (percent: number): string => {
    return `${percent.toFixed(1)}%`;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-900">Profit Scenarios</h3>
      </div>

      <div className="space-y-4">
        {/* Break-Even Price */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
          <p className="text-xs text-slate-500 font-medium mb-2">Break-Even Price</p>
          <div className="flex items-baseline gap-2 text-lg font-semibold text-slate-900">
            <span>{formatPrice(profit.breakEvenPrice.min)}</span>
            <span className="text-slate-400 text-sm">→</span>
            <span>{formatPrice(profit.breakEvenPrice.mid)}</span>
            <span className="text-slate-400 text-sm">→</span>
            <span>{formatPrice(profit.breakEvenPrice.max)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Minimum retail price to break even on landed cost.
          </p>
        </div>

        {/* Target Margin Prices */}
        <div>
          <p className="text-xs text-slate-500 font-medium mb-3">Target Margin Prices</p>
          <div className="space-y-2">
            {profit.targetMarginPrices.map((margin, idx) => (
              <div
                key={idx}
                className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-slate-900">
                    {margin.marginPercent}% Margin
                  </p>
                  <span className="text-xs font-semibold text-emerald-600">
                    {formatPrice(margin.requiredShelfPrice.mid)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-xs text-slate-500">
                  <span>{formatPrice(margin.requiredShelfPrice.min)}</span>
                  <span>→</span>
                  <span>{formatPrice(margin.requiredShelfPrice.max)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Retail Price & Realized Margin (if provided) */}
        {profit.shelfPrice && profit.shelfPrice > 0 ? (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium mb-3">Your Retail Price: {formatPrice(profit.shelfPrice)}</p>
            {profit.profitPerUnit && profit.marginPercent && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Profit Per Unit</p>
                  <div className="flex items-baseline gap-2 text-sm font-semibold">
                    <span className="text-slate-900">
                      {formatPrice(profit.profitPerUnit.min)}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className={profit.profitPerUnit.mid >= 0 ? "text-emerald-600" : "text-red-600"}>
                      {formatPrice(profit.profitPerUnit.mid)}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-900">
                      {formatPrice(profit.profitPerUnit.max)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Margin %</p>
                  <div className="flex items-baseline gap-2 text-sm font-semibold">
                    <span className="text-slate-900">
                      {formatPercent(profit.marginPercent.min)}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className={profit.marginPercent.mid >= 30 ? "text-emerald-600" : profit.marginPercent.mid >= 20 ? "text-yellow-600" : "text-red-600"}>
                      {formatPercent(profit.marginPercent.mid)}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-900">
                      {formatPercent(profit.marginPercent.max)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-100 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Add your target retail price to see realized profit and margin %.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
