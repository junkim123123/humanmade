"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeImageUpload, ThreeImageUploadHandle } from "@/components/analyze/ThreeImageUpload";
import { LoadingState } from "@/components/dashboard/LoadingState";
import { analyzeSchema } from "@/lib/analyze/schema";
import type { AnalyzeInput } from "@/lib/analyze/schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "analyzeDraft";

const defaultValues = {
  destination: "US",
  shippingMode: "air",
  linkUrl: "",
};

export type AnalyzeFormMode = "public" | "app";

interface AnalyzeFormProps {
  mode: AnalyzeFormMode;
}

export function AnalyzeForm({ mode }: AnalyzeFormProps) {
  const router = useRouter();
  const uploadRef = useRef<ThreeImageUploadHandle>(null);
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [form, setForm] = useState({
    ...defaultValues,
    shelfPrice: "",
    weight: "", // in lb (imperial) or kg (metric)
    length: "", // in in (imperial) or cm (metric)
    width: "",  // in in (imperial) or cm (metric)
    height: "", // in in (imperial) or cm (metric)
  });
  const [files, setFiles] = useState<{ 
    product: File | null; 
    barcode: File | null; 
    label: File | null;
    extra1: File | null;
    extra2: File | null;
  }>({
    product: null, 
    barcode: null, 
    label: null,
    extra1: null,
    extra2: null,
  });
  const [loading, setLoading] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    product?: string;
    barcode?: string;
    label?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Hydrate from localStorage draft (used when public -> login -> app)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<AnalyzeInput>;
      setForm((prev) => ({
        ...prev,
        destination: parsed.destination || prev.destination,
        shippingMode: parsed.shippingMode || prev.shippingMode,
        linkUrl: parsed.linkUrl || prev.linkUrl,
      }));
      setRestoredDraft(true);
      window.localStorage.removeItem(DRAFT_KEY);
      if (mode === "app") {
        toast.info("Draft restored. Re-attach your product photo to run analysis.");
      }
    } catch (parseError) {
      console.warn("[AnalyzeForm] Failed to parse draft", parseError);
    }
  }, [mode]);

  const hasValidInput = useMemo(() => {
    return !!files.product; // Only product photo is required
  }, [files.product]);

  // Unit conversion utilities
  const convertToSI = (value: string, type: "weight" | "length") => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    if (unitSystem === "imperial") {
      // lb to kg or in to cm
      return type === "weight" ? (num * 0.453592).toFixed(3) : (num * 2.54).toFixed(2);
    }
    return num.toFixed(type === "weight" ? 3 : 2);
  };

  const handleUnitToggle = (newUnit: "imperial" | "metric") => {
    setUnitSystem(newUnit);
    // Convert existing values
    setForm((prev) => {
      const conversionFactor = newUnit === "imperial" ? 1 / 0.453592 : 0.453592;
      const lengthFactor = newUnit === "imperial" ? 1 / 2.54 : 2.54;
      
      return {
        ...prev,
        weight: prev.weight 
          ? (parseFloat(prev.weight) * conversionFactor).toFixed(2)
          : "",
        length: prev.length 
          ? (parseFloat(prev.length) * lengthFactor).toFixed(2)
          : "",
        width: prev.width 
          ? (parseFloat(prev.width) * lengthFactor).toFixed(2)
          : "",
        height: prev.height 
          ? (parseFloat(prev.height) * lengthFactor).toFixed(2)
          : "",
      };
    });
  };

  const handleSubmit = async () => {
    if (loading) return; // Already submitting, ignore duplicate clicks
    setSubmitted(true);
    setValidationErrors({});
    setApiError(null);

    // Validate only product photo is required
    const errors: { product?: string; barcode?: string; label?: string } = {};
    if (!files.product) errors.product = "Product photo is required";
    // barcode and label are optional

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      uploadRef.current?.scrollToFirstMissing();
      return;
    }

    const parsed = analyzeSchema.safeParse({
      destination: form.destination || "US",
      shippingMode: form.shippingMode || "air",
      linkUrl: form.linkUrl.trim() || undefined,
      front: files.product,
      barcode: files.barcode || undefined,
      label: files.label || undefined,
    });

    if (!parsed.success) {
      return;
    }

    // Public mode: allow guest users to run analysis
    // We'll show sign up modal after results are generated
    if (mode === "public") {
      // Continue to API call - guest users can run analysis
    }

    // App mode: run analysis via API
    setLoading(true);
    try {
      const payloadForm = { ...form };
      // Autofill advanced shipping defaults when missing
      if (!payloadForm.weight) payloadForm.weight = unitSystem === "imperial" ? "1.1" : "0.5";
      if (!payloadForm.length) payloadForm.length = unitSystem === "imperial" ? "10" : "25";
      if (!payloadForm.width) payloadForm.width = unitSystem === "imperial" ? "6" : "15";
      if (!payloadForm.height) payloadForm.height = unitSystem === "imperial" ? "4" : "10";

      const formData = new FormData();
      formData.append("image", parsed.data.front as File);
      if (parsed.data.barcode) formData.append("barcode", parsed.data.barcode as File);
      if (parsed.data.label) formData.append("label", parsed.data.label as File);
      if (files.extra1) formData.append("extra1", files.extra1);
      if (files.extra2) formData.append("extra2", files.extra2);
      if (parsed.data.destination) formData.append("destination", parsed.data.destination);
      if (parsed.data.shippingMode) formData.append("shippingMode", parsed.data.shippingMode);
      if (parsed.data.linkUrl) formData.append("linkUrl", parsed.data.linkUrl);
      if (form.shelfPrice) formData.append("shelfPrice", form.shelfPrice);
      if (payloadForm.weight) formData.append("weight", convertToSI(payloadForm.weight, "weight"));
      if (payloadForm.length) formData.append("length", convertToSI(payloadForm.length, "length"));
      if (payloadForm.width) formData.append("width", convertToSI(payloadForm.width, "length"));
      if (payloadForm.height) formData.append("height", convertToSI(payloadForm.height, "length"));

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      // Handle reused report (idempotency)
      if (response.ok && data?.success && data?.reused) {
        console.log(`[AnalyzeForm] Server returned existing report: ${data.reportId}, status: ${data.status}`);
        if (data.status === "processing" || data.status === "queued") {
          toast.info(data.message || "Analysis already in progress. Redirecting...");
        } else if (data.status === "completed") {
          toast.info("Analysis already completed. Redirecting to existing report.");
        }
        router.push(`/reports/${data.reportId}/v2`);
        return;
      }

      if (!response.ok || !data?.success) {
        const errorMessage = data?.error || data?.message || `Analysis failed (${response.status})`;
        console.error("[AnalyzeForm] API error:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        setApiError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      // For guest users, show sign up modal after results
      if (mode === "public" && data?.isGuest) {
        // Guest user - results returned without DB save
        // Store results in sessionStorage and show sign up modal
        try {
          window.sessionStorage.setItem("guestAnalysisResult", JSON.stringify(data));
          toast.success("Analysis completed! Sign up to save your results.");
          // Redirect to signup with a flag to show the results after signup
          router.push("/signup?next=/analyze&guest=true");
          return;
        } catch (storageError) {
          console.warn("[AnalyzeForm] Failed to save guest results", storageError);
          // Fallback: still show success message
          toast.success("Analysis completed! Please sign up to save your results.");
          setLoading(false);
        }
        return;
      }

      // For authenticated users or if reportId exists
      if (data?.reportId) {
        toast.success("Analysis completed");
        router.push(`/reports/${data.reportId}/v2`);
      } else {
        // Fallback: show results inline or redirect
        toast.success("Analysis completed");
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process analysis";
      console.error("[AnalyzeForm] Unexpected error:", err);
      setApiError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Photo Upload */}
        <div className="lg:col-span-2">
          {loading ? (
            <LoadingState />
          ) : (
            <ThreeImageUpload 
              ref={uploadRef}
              onFilesChange={(selected) => setFiles(selected)} 
              disabled={loading}
              validationErrors={submitted ? validationErrors : {}}
            />
          )}
        </div>

        {/* Right: Settings */}
        <div className="lg:col-span-1 space-y-4">
          {apiError && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-[14px] text-red-700">
              {apiError}
            </div>
          )}
          {restoredDraft && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-[14px] text-amber-700">
              Draft restored. Re-attach your 3 photos and submit.
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white">
            {/* Header */}
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-[16px] font-semibold text-slate-900">Assumptions</h3>
              <ul className="mt-3 space-y-1.5 text-[13px] text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  Per-unit estimate
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  Missing weight or box size uses category defaults
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  Defaults are labeled and editable
                </li>
              </ul>
            </div>

            {/* Form */}
            <div className="p-5 space-y-5">
              {/* Destination */}
              <div>
                <div className="text-[13px] font-medium text-slate-500">Destination</div>
                <div className="mt-1 text-[14px] font-medium text-slate-900">United States</div>
              </div>

              {/* Target Sell Price */}
              <div>
                <label className="text-[14px] font-medium text-slate-900">Target Sell Price ($)</label>
                <div className="mt-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">$</span>
                  <input
                    type="text"
                    placeholder="9.99"
                    value={form.shelfPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, shelfPrice: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-7 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors"
                  />
                </div>
                <p className="mt-1.5 text-[13px] text-slate-500">Required to calculate your profit margin.</p>
              </div>

              {/* Advanced */}
              <details className="group">
                <summary className="flex items-center gap-1 text-[14px] font-medium text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
                  <span className="text-slate-400 group-open:rotate-90 transition-transform">▶</span>
                  Edit assumptions
                </summary>
                <div className="mt-4 space-y-4 pl-4 border-l border-slate-200">
                  <p className="text-[13px] text-slate-500">Only if you know the shipping box size and weight.</p>
                  
                  <div>
                    <label className="text-[14px] font-medium text-slate-700">Shipping mode</label>
                    <select
                      value={form.shippingMode}
                      onChange={(e) => setForm((prev) => ({ ...prev, shippingMode: e.target.value }))}
                      className="mt-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 focus:border-slate-400 focus:outline-none transition-colors"
                    >
                      <option value="air">Air</option>
                      <option value="ocean">Ocean</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[14px] font-medium text-slate-700">
                      Weight {unitSystem === "imperial" ? "(lb)" : "(kg)"}
                    </label>
                    <input
                      type="text"
                      placeholder={unitSystem === "imperial" ? "1.2" : "0.5"}
                      value={form.weight}
                      onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                      className="mt-2 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[14px] font-medium text-slate-700">
                      Dimensions {unitSystem === "imperial" ? "(in)" : "(cm)"}
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="L"
                        value={form.length}
                        onChange={(e) => setForm((prev) => ({ ...prev, length: e.target.value }))}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="W"
                        value={form.width}
                        onChange={(e) => setForm((prev) => ({ ...prev, width: e.target.value }))}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors"
                      />
                      <input
                        type="text"
                        placeholder="H"
                        value={form.height}
                        onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </details>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !hasValidInput}
                  className={cn(
                    "w-full h-12 rounded-full text-[15px] font-medium transition-colors",
                    !hasValidInput
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  {loading ? "Calculating..." : "Calculate Landed Cost"}
                </button>
                {mode === "public" && (
                  <p className="mt-3 text-center text-[13px] text-slate-500">
                    Save results requires sign in
                  </p>
                )}
                {mode === "app" && (
                  <p className="mt-3 text-center text-[13px] text-slate-500">
                    Signed in saves your report to Reports.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
