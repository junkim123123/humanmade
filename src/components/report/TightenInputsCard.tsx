// @ts-nocheck
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/lib/report/types";

interface TightenInputsCardProps {
  report: Report;
}

/**
 * Tighten inputs card with preview effects
 * Shows what each input would improve
 */
export function TightenInputsCard({ report }: TightenInputsCardProps) {
  const reportAny = report as any;
  const hsCandidatesCount = reportAny._hsCandidatesCount || 0;
  const similarCount = reportAny._similarRecordsCount || 0;
  const hasLandedCosts = reportAny._hasLandedCosts || false;
  const priceUnit = reportAny._priceUnit || "per unit";
  
  const [upc, setUpc] = useState(report.upc || "");
  const [hasLabelPhoto, setHasLabelPhoto] = useState(report.hasBackLabelPhoto || false);
  const [materials, setMaterials] = useState(report.materialsAndDimensions || "");

  // Preview effects based on inputs
  const previewEffects = [];
  
  if (hasLabelPhoto && hsCandidatesCount > 1) {
    previewEffects.push({
      label: "With label photo",
      effect: `Likely to reduce HS candidates from ${hsCandidatesCount} to 1`,
    });
  }
  
  if (upc && similarCount === 0) {
    previewEffects.push({
      label: "With barcode",
      effect: "May increase similar record matching",
    });
  }
  
  if (materials && !hasLandedCosts) {
    previewEffects.push({
      label: "With material & size",
      effect: "Reduces freight estimation error",
    });
  }

  // Calculate preview changes
  const previewHsCount = hasLabelPhoto && hsCandidatesCount > 1 ? 1 : hsCandidatesCount;
  const previewSimilarCount = upc && similarCount === 0 ? "Potential increase" : similarCount;

  return (
    <div className="space-y-6">
      {/* Preview effects */}
      {previewEffects.length > 0 && (
        <Card className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Predicted Impact</h3>
          <div className="space-y-2">
            {previewEffects.map((effect, index) => (
              <div key={index} className="text-sm text-slate-700">
                <span className="font-medium">{effect.label}:</span> {effect.effect}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Input form */}
      <Card className="p-5 bg-white border border-slate-200 rounded-xl max-w-2xl">
        <div className="space-y-4">
          <div>
            <Label htmlFor="upc" className="text-sm font-semibold text-slate-900">
              UPC or barcode
            </Label>
            <Input
              id="upc"
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              className="h-10 mt-2"
              placeholder="Enter UPC or barcode"
            />
            <p className="text-xs text-slate-500 mt-1">Helps classification</p>
          </div>
          
          <div>
            <Label htmlFor="back-label" className="text-sm font-semibold text-slate-900">
              Packaging photo
            </Label>
            <div 
              className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mt-2 cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => setHasLabelPhoto(!hasLabelPhoto)}
            >
              <span className="text-sm text-slate-500">
                {hasLabelPhoto ? "Photo uploaded" : "Upload photo"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Warnings, materials, certifications</p>
          </div>
          
          <div>
            <Label htmlFor="materials" className="text-sm font-semibold text-slate-900">
              Materials and size
            </Label>
            <Input
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="h-10 mt-2"
              placeholder="e.g., Polyester, 8x6x4 inches"
            />
            <p className="text-xs text-slate-500 mt-1">Most impactful for duty and shipping</p>
          </div>
        </div>
      </Card>

      {/* Preview changes */}
      {(upc || hasLabelPhoto || materials) && (
        <Card className="p-5 bg-slate-50 border border-slate-200 rounded-xl max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Preview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 mb-1">HS Candidates</div>
              <div className="font-medium text-slate-900">
                {previewHsCount} {previewHsCount < hsCandidatesCount && <Badge variant="outline" className="ml-2 h-4 px-1.5 text-xs bg-green-50 text-green-700">Improve</Badge>}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Similar Records</div>
              <div className="font-medium text-slate-900">
                {typeof previewSimilarCount === "string" ? previewSimilarCount : `${previewSimilarCount} records`}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

