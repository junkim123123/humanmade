"use client";

import { useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface LabelConfirmationModalProps {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LabelConfirmationModal({ report, onClose, onSuccess }: LabelConfirmationModalProps) {
  const reportAny = report as any;
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || reportAny.extras?.inputStatus || reportAny.extras?.proof?.inputStatus || {};
  const labelDraft = inputStatus.labelDraft || {};
  
  // Initialize form with draft values
  const [formData, setFormData] = useState({
    country_of_origin: labelDraft.country_of_origin?.value || "",
    allergens_list: labelDraft.allergens_list?.value ? (labelDraft.allergens_list.value as string[]).join(", ") : "",
    net_weight_value: labelDraft.net_weight_value?.value || "",
    net_weight_unit: labelDraft.net_weight_unit?.value || "g",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Call API to confirm label fields
      const response = await fetch(`/api/reports/${report.id}/confirm-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_of_origin: formData.country_of_origin.trim() || null,
          allergens_list: formData.allergens_list.trim() 
            ? formData.allergens_list.split(",").map(a => a.trim()).filter(Boolean)
            : [],
          net_weight_value: parseFloat(formData.net_weight_value) || null,
          net_weight_unit: formData.net_weight_unit || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to confirm label");
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Confirm Label Fields</h2>
            <p className="text-sm text-slate-600 mt-1">
              Review and confirm the 3 critical fields extracted from the label
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">Why confirm these fields?</p>
              <p className="text-sm text-blue-700">
                These 3 fields are critical for FDA compliance, customs clearance, and safety regulations. Vision AI has extracted them, but your verification keeps compliance in draft (not verified).
              </p>
            </div>
          </div>
          
          {/* Field 1: Country of Origin */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Country of Origin *
              {labelDraft.country_of_origin && (
                <span className="ml-2 text-xs text-slate-500">
                  Confidence: {Math.round((labelDraft.country_of_origin.confidence || 0) * 100)}%
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.country_of_origin}
              onChange={(e) => setFormData({ ...formData, country_of_origin: e.target.value })}
              placeholder="e.g., China, USA, Vietnam"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {labelDraft.country_of_origin?.evidence && labelDraft.country_of_origin.evidence !== "Not visible" && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Extracted: "{labelDraft.country_of_origin.evidence}"
              </p>
            )}
          </div>
          
          {/* Field 2: Allergens */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allergens *
              {labelDraft.allergens_list && (
                <span className="ml-2 text-xs text-slate-500">
                  Confidence: {Math.round((labelDraft.allergens_list.confidence || 0) * 100)}%
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.allergens_list}
              onChange={(e) => setFormData({ ...formData, allergens_list: e.target.value })}
              placeholder="e.g., milk, soy, nuts (comma-separated) or leave blank if none"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {labelDraft.allergens_list?.evidence && labelDraft.allergens_list.evidence !== "Not visible" && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Extracted: "{labelDraft.allergens_list.evidence}"
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              If no allergens declared on label, leave this blank
            </p>
          </div>
          
          {/* Field 3: Net Weight */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Net Weight *
              {labelDraft.net_weight_value && (
                <span className="ml-2 text-xs text-slate-500">
                  Confidence: {Math.round((labelDraft.net_weight_value.confidence || 0) * 100)}%
                </span>
              )}
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.01"
                value={formData.net_weight_value}
                onChange={(e) => setFormData({ ...formData, net_weight_value: e.target.value })}
                placeholder="e.g., 500"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <select
                value={formData.net_weight_unit}
                onChange={(e) => setFormData({ ...formData, net_weight_unit: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="oz">oz</option>
                <option value="lb">lb</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
              </select>
            </div>
            {labelDraft.net_weight_value?.evidence && labelDraft.net_weight_value.evidence !== "Not visible" && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Extracted: "{labelDraft.net_weight_value.evidence}"
              </p>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm (compliance stays draft)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
