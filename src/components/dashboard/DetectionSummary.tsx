// @ts-nocheck
"use client";

import { useState } from "react";
import { Edit2, Check, X, Hash, Tag } from "lucide-react";
import { SlideCard } from "@/components/ui/slide-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DetectionSummaryProps {
  productName?: string;
  category?: string;
  hsCodeCandidates?: string[];
  confidence?: "high" | "medium" | "low";
  confidenceReason?: string;
  onProductNameChange?: (name: string) => void;
}

export function DetectionSummary({
  productName = "Product name",
  category,
  hsCodeCandidates = [],
  confidence = "medium",
  confidenceReason,
  onProductNameChange,
}: DetectionSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(productName);

  const handleSave = () => {
    if (onProductNameChange) {
      onProductNameChange(editedName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(productName);
    setIsEditing(false);
  };

  const confidenceConfig = {
    high: {
      color: "bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-300/60 shadow-sm shadow-green-100",
      label: "High confidence",
    },
    medium: {
      color: "bg-gradient-to-br from-yellow-50 to-amber-50 text-yellow-700 border-yellow-300/60 shadow-sm shadow-yellow-100",
      label: "Medium confidence",
    },
    low: {
      color: "bg-gradient-to-br from-orange-50 to-red-50 text-orange-700 border-orange-300/60 shadow-sm shadow-orange-100",
      label: "Low confidence",
    },
  };

  const conf = confidenceConfig[confidence];

  return (
    <SlideCard>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Detection summary</h3>
          <Badge
            variant="outline"
            className={cn("h-5 px-2 text-xs border", conf.color)}
          >
            {conf.label}
          </Badge>
        </div>

        {/* Product Name with inline edit */}
        <div>
          <div className="text-xs font-medium text-slate-500 mb-1.5">Product name</div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-blue-300/80 bg-white/90 backdrop-blur rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
              />
              <button
                onClick={handleSave}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 text-slate-400 hover:bg-slate-50 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <p className="text-sm font-semibold text-slate-900 flex-1">{productName}</p>
              {onProductNameChange && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category */}
        {category && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <div className="text-xs font-medium text-slate-500">Category</div>
            </div>
            <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700 max-w-[180px] truncate" title={category}>
              {category}
            </span>
          </div>
        )}

        {/* HS Code Candidates */}
        {hsCodeCandidates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <div className="text-xs font-medium text-slate-500">HS code candidates</div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[48px] overflow-hidden">
              {hsCodeCandidates.slice(0, 3).map((code, index) => (
                <code
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono border border-blue-200 max-w-[90px] truncate"
                  title={code}
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Reason */}
        {confidenceReason && (
          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-600">{confidenceReason}</p>
          </div>
        )}
      </div>
    </SlideCard>
  );
}











