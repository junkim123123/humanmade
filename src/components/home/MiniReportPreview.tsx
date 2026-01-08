"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export type MiniReportPreviewMode = "empty" | "sample" | "hover" | "loading" | "data";

interface MiniReportPreviewProps {
  mode?: MiniReportPreviewMode;
  compact?: boolean;
  variant?: "default" | "hero";
  onStartVerification?: () => void;
  data?: {
    productName?: string;
    category?: string;
    thumbnailUrl?: string;
    landedCost?: {
      typical: number;
      min: number;
      max: number;
    };
    fobCost?: {
      typical: number;
      min: number;
      max: number;
    };
    costStack?: {
      fob: number;
      freight: number;
      duty: number;
      fees: number;
    };
  };
}

const MOCK_DATA = {
  productName: "Plastic Storage Container",
  category: "Storage & Organization",
  thumbnailUrl: null,
  landedCost: { typical: 2.44, min: 2.22, max: 2.66 },
  fobCost: { typical: 0.8, min: 0.75, max: 0.85 },
  costStack: { fob: 0.75, freight: 1.2, duty: 0.19, fees: 0.08 },
};

export function MiniReportPreview({
  mode = "sample",
  compact = false,
  variant = "default",
  onStartVerification = () => {},
  data,
}: MiniReportPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "cost" | "suppliers">("summary");

  const displayData = data || MOCK_DATA;
  const isHero = variant === "hero";
  const showHoverOverlay = !isHero && (mode === "hover" || (mode === "sample" && isHovered));
  const isLoading = mode === "loading";

  useEffect(() => {
    if (compact || variant === "hero") setActiveTab("summary");
  }, [compact, variant]);

  const formatCurrency = (value: number) => {
    // Remove trailing .00 for cleaner display in demos
    return `$${parseFloat(value.toFixed(2))}`;
  };

  const costStackValues = displayData.costStack || MOCK_DATA.costStack;
  const costStackTotal = useMemo(() => {
    return costStackValues.fob + costStackValues.freight + costStackValues.duty + costStackValues.fees;
  }, [costStackValues]);

  const pct = useMemo(() => {
    if (costStackTotal <= 0) return { fob: 0, freight: 0, duty: 0, fees: 0 };
    return {
      fob: (costStackValues.fob / costStackTotal) * 100,
      freight: (costStackValues.freight / costStackTotal) * 100,
      duty: (costStackValues.duty / costStackTotal) * 100,
      fees: (costStackValues.fees / costStackTotal) * 100,
    };
  }, [costStackValues, costStackTotal]);

  const cardHeight = variant === "hero" 
    ? "h-[300px]" 
    : compact 
      ? "h-[320px] md:h-[340px]" 
      : "h-[380px] md:h-[360px]";
  const maxWidth = compact || variant === "hero" ? "max-w-[560px]" : "max-w-[420px]";
  const padding = variant === "hero" ? "p-3" : compact ? "p-3" : "p-3.5";

  return (
    <div
      onMouseEnter={!isHero ? () => setIsHovered(true) : undefined}
      onMouseLeave={!isHero ? () => setIsHovered(false) : undefined}
      className={`w-full ${maxWidth}`}
    >
      <Card
        className={`relative w-full ${cardHeight} ${
          isHero 
            ? "border-0 shadow-none bg-transparent rounded-none p-0" 
            : `${padding} bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow`
        }`}
      >
        {showHoverOverlay && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 rounded-xl">
            <p className="text-white text-center text-sm mb-4">Upload a photo to generate this</p>
            <Button asChild size="lg" className="bg-electric-blue-600 hover:bg-electric-blue-700 text-white">
              <Link href="/analyze">Start analysis</Link>
            </Button>
          </div>
        )}

        <div className="h-full flex flex-col min-h-0">
          <div className="mb-3">
            {isLoading ? (
              <div className="h-9 w-40 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-slate-600">Mini report preview</div>
                  <Badge variant="outline" className="h-5 px-2 text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                    Preview
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-slate-50 text-slate-600 border-slate-200">
                    Baseline range, not a final quote
                  </Badge>
                  <Badge variant="outline" className="h-4 px-1.5 text-[9px] bg-slate-50 text-slate-600 border-slate-200">
                    Verified quotes in about 1 week
                  </Badge>
                </div>

                {!compact && !isHero && (
                  <p className="text-[10px] text-slate-500 mt-2">
                    See what you receive before you verify.
                  </p>
                )}
              </>
            )}
          </div>

          {!isLoading && !compact && variant !== "hero" && (
            <div className="flex gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "summary" ? "bg-electric-blue-100 text-electric-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab("cost")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "cost" ? "bg-electric-blue-100 text-electric-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Cost stack
              </button>
              <button
                onClick={() => setActiveTab("suppliers")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === "suppliers" ? "bg-electric-blue-100 text-electric-blue-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Suppliers
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="h-full bg-slate-50 rounded-lg animate-pulse" />
            ) : (
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] text-slate-600 mb-0.5">Landed cost typical</div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {formatCurrency(displayData.landedCost?.typical || 0)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-600 mb-0.5">
                      Factory price typical <span className="text-[10px] text-slate-400">(FOB)</span>
                    </div>
                    <div className="text-2xl font-semibold text-slate-900">
                      {formatCurrency(displayData.fobCost?.typical || 0)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <div className="text-[10px] font-semibold text-slate-700 mb-1">Recommendation</div>
                    <p className="text-[10px] text-slate-600">
                      Verify if you plan to reorder or buy more than one case.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                    <div className="text-[10px] font-semibold text-slate-700 mb-1.5">Key facts</div>
                    <div className="mb-1.5 pb-1.5 border-b border-slate-200">
                      <p className="text-[10px] text-slate-700 leading-tight">Use the baseline to decide. Verify when ready to buy.</p>
                    </div>
                    <ul className="space-y-0.5 text-[10px] text-slate-600">
                      <li>• Deposit $49 per product, credited on order</li>
                      <li>• Up to 3 supplier quotes</li>
                      <li>• MOQ and lead time confirmed</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isLoading && !compact && !isHero && (
            <div className="mt-3">
              <Button
                className="h-10 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg"
                onClick={onStartVerification}
              >
                Secure Verified Quotes
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
