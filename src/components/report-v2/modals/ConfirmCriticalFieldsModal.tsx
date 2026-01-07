"use client";

import { useState } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import type { Report } from "@/lib/report/types";

interface ConfirmCriticalFieldsModalProps {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_ALLERGENS = [
  "Milk", "Eggs", "Fish", "Shellfish", "Tree nuts", "Peanuts", "Wheat", "Soybeans"
];

export default function ConfirmCriticalFieldsModal({ report, onClose, onSuccess }: ConfirmCriticalFieldsModalProps) {
  const reportAny = report as any;
  const criticalConfirm = reportAny.criticalConfirm || report.criticalConfirm;
  const labelDraft = reportAny.inputStatus?.labelDraft || reportAny.labelDraft;
  
  // Initialize with existing confirmed values or draft values
  const [formData, setFormData] = useState({
    originCountry: criticalConfirm?.originCountry?.value || labelDraft?.country_of_origin?.value || "",
    netWeight: criticalConfirm?.netWeight?.value || 
      (labelDraft?.net_weight_value?.value && labelDraft?.net_weight_unit?.value 
        ? `${labelDraft.net_weight_value.value} ${labelDraft.net_weight_unit.value}` 
        : ""),
    allergens: criticalConfirm?.allergens?.value || 
      (labelDraft?.allergens_list?.value ? (labelDraft.allergens_list.value as string[]).join(", ") : ""),
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reports/${report.id}/confirm-critical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originCountry: formData.originCountry.trim() || null,
          netWeight: formData.netWeight.trim() || null,
          allergens: formData.allergens.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to confirm fields");
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
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Confirm Critical Fields</h2>
            <p className="text-sm text-slate-600 mt-1">
              Verifying helps but compliance stays draft until NexSupply verifies
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
          {/* Trust Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">Why these 3 fields?</p>
              <p className="text-sm text-blue-700">
                Country of origin, net weight, and allergens are critical for FDA compliance, customs clearance, and safety regulations. 
                Our AI extracted draft values; your verification is optional and compliance remains draft.
              </p>
            </div>
          </div>
          
          {/* Field 1: Country of Origin */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Country of Origin *
              {labelDraft?.country_of_origin && (
                <span className="ml-2 text-xs text-slate-500">
                  Draft confidence: {Math.round((labelDraft.country_of_origin.confidence || 0) * 100)}%
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.originCountry}
              onChange={(e) => setFormData({ ...formData, originCountry: e.target.value })}
              placeholder="e.g., China, USA, Vietnam, Mexico"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {labelDraft?.country_of_origin?.evidence && labelDraft.country_of_origin.evidence !== "Not visible" && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Draft evidence: "{labelDraft.country_of_origin.evidence}"
              </p>
            )}
          </div>
          
          {/* Field 2: Net Weight */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Net Weight *
              {labelDraft?.net_weight_value && (
                <span className="ml-2 text-xs text-slate-500">
                  Draft confidence: {Math.round((labelDraft.net_weight_value.confidence || 0) * 100)}%
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.netWeight}
              onChange={(e) => setFormData({ ...formData, netWeight: e.target.value })}
              placeholder="e.g., 500 g, 12 oz, 1.5 kg"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {labelDraft?.net_weight_value?.evidence && labelDraft.net_weight_value.evidence !== "Not visible" && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Draft evidence: "{labelDraft.net_weight_value.evidence}"
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Include unit (g, kg, oz, lb, ml, l)
            </p>
          </div>
          
          {/* Field 3: Allergens */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allergens *
              {labelDraft?.allergens_list && (
                <span className="ml-2 text-xs text-slate-500">
                  Draft confidence: {Math.round((labelDraft.allergens_list.confidence || 0) * 100)}%
                </span>
              )}
            </label>
            
            {/* Common allergens as chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_ALLERGENS.map((allergen) => {
                const isSelected = formData.allergens.toLowerCase().includes(allergen.toLowerCase());
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        // Remove allergen
                        const allergensArray = formData.allergens.split(",").map((a: string) => a.trim()).filter(Boolean);
                        const filtered = allergensArray.filter((a: string) => a.toLowerCase() !== allergen.toLowerCase());
                        setFormData({ ...formData, allergens: filtered.join(", ") });
                      } else {
                        // Add allergen
                        const current = formData.allergens.trim();
                        setFormData({ 
                          ...formData, 
                          allergens: current ? `${current}, ${allergen}` : allergen 
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? "bg-red-100 text-red-800 border-2 border-red-400"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {allergen}
                  </button>
                );
              })}
            </div>
            
            <input
              type="text"
              value={formData.allergens}
              onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
              placeholder='Type "None" if no allergens declared, or enter custom allergens'
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {labelDraft?.allergens_list?.evidence && labelDraft.allergens_list.evidence !== "Not visible" && (
              <p className="text-xs text-slate-500 mt-1 italic">
                Draft evidence: "{labelDraft.allergens_list.evidence}"
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Comma-separated or type "None"
            </p>
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
                  Confirm & Mark Complete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
