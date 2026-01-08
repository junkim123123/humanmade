// @ts-nocheck
"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/report/types";

interface TightenRangeProps {
  report: Report;
  onUpdate?: (data: { upc?: string; backLabel?: File; material?: string }) => void;
}

export function TightenRange({ report, onUpdate }: TightenRangeProps) {
  const [upc, setUpc] = useState("");
  const [material, setMaterial] = useState("");
  const [backLabelFile, setBackLabelFile] = useState<File | null>(null);
  const [backLabelPreview, setBackLabelPreview] = useState<string | null>(null);

  const handleBackLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackLabelFile(file);
      const url = URL.createObjectURL(file);
      setBackLabelPreview(url);
    }
  };

  const handleRemoveBackLabel = () => {
    setBackLabelFile(null);
    if (backLabelPreview) {
      URL.revokeObjectURL(backLabelPreview);
      setBackLabelPreview(null);
    }
  };

  const handleSubmit = () => {
    onUpdate?.({ upc, backLabel: backLabelFile || undefined, material });
  };

  const reasons = [
    "HS code has multiple candidate classifications",
    "Insufficient similar import records",
    "Missing product specification details",
  ];

  const neededInfo = [
    "UPC or barcode",
    "Back label photo (with ingredients)",
    "Material and dimensions",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Tighten the Range</h2>

      {/* Why range is wide */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Why the range is wide (Top 3)
        </h3>
        <ul className="space-y-1">
          {reasons.map((reason, i) => (
            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="text-electric-blue-600 font-bold mt-0.5">{i + 1}.</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* What's needed */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Information needed to improve precision (3 items)
        </h3>
        <ul className="space-y-1">
          {neededInfo.map((info, i) => (
            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="text-electric-blue-600 font-bold mt-0.5">{i + 1}.</span>
              {info}
            </li>
          ))}
        </ul>
      </div>

      {/* Input fields */}
      <div className="space-y-4">
        {/* UPC */}
        <div>
          <Label htmlFor="upc">UPC or Barcode</Label>
          <Input
            id="upc"
            type="text"
            placeholder="e.g., 123456789012"
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Back label photo */}
        <div>
          <Label>Back Label Photo</Label>
          {backLabelPreview ? (
            <div className="mt-2 relative">
              <img
                src={backLabelPreview}
                alt="Back label preview"
                className="w-full h-48 object-contain rounded-lg border border-slate-200"
              />
              <button
                onClick={handleRemoveBackLabel}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-slate-50"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          ) : (
            <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-electric-blue-400 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">Click to upload</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackLabelChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Material and dimensions */}
        <div>
          <Label htmlFor="material">Material and Dimensions</Label>
          <Input
            id="material"
            type="text"
            placeholder="e.g., Plastic, 10cm x 5cm x 3cm"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Submit button */}
        {(upc || backLabelFile || material) && (
          <Button
            onClick={handleSubmit}
            className="w-full bg-electric-blue-600 hover:bg-electric-blue-700"
          >
            Update Information
          </Button>
        )}
      </div>
    </div>
  );
}

