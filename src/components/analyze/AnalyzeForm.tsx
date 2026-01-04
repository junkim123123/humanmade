"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
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
  const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);
  const [loadingStep, setLoadingStep] = useState<string | undefined>(undefined);
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
    
    // Check authentication for public mode - redirect to login if not authenticated
    if (mode === "public") {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.info("Please sign in to run analysis");
        router.push(`/signin?next=${encodeURIComponent("/analyze")}`);
        return;
      }
    }
    
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

    // Public mode: authentication is already checked above, continue to API call

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
      if (response.ok && data?.ok && data?.reused) {
        const existingReportId = String(data.reportId || '').trim();
        console.log(`[AnalyzeForm] Server returned existing report: ${existingReportId}, status: ${data.status}`);
        
        if (!existingReportId || existingReportId === 'null' || existingReportId === 'undefined') {
          console.error("[AnalyzeForm] Invalid existing reportId:", data.reportId);
          toast.error("Existing report ID is invalid. Starting new analysis...");
          setLoading(false);
          return;
        }
        
        // Verify existing report exists and user owns it before redirecting
        try {
          console.log("[AnalyzeForm] Verifying existing report ownership before redirect...");
          
          // Get current user id
          const supabase = createClient();
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          // Verify report exists and check ownership
          const verifyRes = await fetch(`/api/reports/${existingReportId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            // Use ok field, not success
            if (verifyData?.ok && verifyData?.report) {
              // Check ownership if report has a user_id
              if (verifyData.report.user_id && currentUser) {
                if (verifyData.report.user_id !== currentUser.id) {
                  console.error("[AnalyzeForm] Ownership mismatch:", {
                    reportUserId: verifyData.report.user_id,
                    currentUserId: currentUser.id,
                  });
                  toast.error("This report belongs to another account. Starting fresh analysis...");
                  setLoading(false);
                  return;
                }
              }
              
              console.log("[AnalyzeForm] Existing report verified and ownership confirmed, redirecting...");
              if (data.status === "processing" || data.status === "queued") {
                toast.info(data.message || "Analysis already in progress. Redirecting...");
              } else if (data.status === "completed") {
                toast.info("Analysis already completed. Redirecting to existing report.");
              }
              router.push(`/reports/${existingReportId}/v2`);
              return;
            } else if (verifyData?.ok === false) {
              // Explicit error from API
              if (verifyData.errorCode === "FORBIDDEN" || verifyData.errorCode === "AUTH_REQUIRED") {
                console.error("[AnalyzeForm] Access forbidden to existing report:", verifyData.errorCode);
                toast.error("Cannot access this report. Starting fresh analysis...");
                setLoading(false);
                return;
              }
            }
          }
          
          // If verification failed, the report might not exist - start new analysis
          console.error("[AnalyzeForm] Existing report verification failed, starting new analysis:", {
            reportId: existingReportId,
            status: verifyRes.status,
          });
          toast.error("Existing report not found. Please try again.");
          setLoading(false);
          return;
        } catch (verifyError) {
          console.error("[AnalyzeForm] Error verifying existing report:", verifyError);
          toast.error("Error verifying report. Please try again.");
          setLoading(false);
          return;
        }
      }

      if (!response.ok || !data?.ok) {
        const errorMessage = data?.error || data?.message || data?.details || `Analysis failed (${response.status})`;
        const fullError = {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
          message: data?.message,
          details: data?.details,
          fullData: data,
        };
        console.error("[AnalyzeForm] API error:", fullError);
        
        // Show more detailed error message
        let displayMessage = errorMessage;
        if (data?.error === "UPLOAD_FAILED" || data?.error === "STORAGE_FORBIDDEN") {
          displayMessage = "Image upload failed. Please try again or contact support.";
        } else if (data?.error === "REPORT_INIT_FAILED") {
          displayMessage = "Failed to initialize report. Please try again.";
        } else if (data?.error === "REPORT_SAVE_FAILED") {
          displayMessage = "Failed to save report. Please try again.";
        }
        
        setApiError(displayMessage);
        toast.error(displayMessage);
        setLoading(false);
        return;
      }

      // All users are authenticated at this point (checked above)
      // No need for guest user handling

      // For authenticated users or if reportId exists
      if (data?.reportId) {
        const rawReportId = data.reportId;
        const reportIdStr = String(rawReportId).trim();
        
        console.log("[AnalyzeForm] Processing reportId for redirect:", {
          raw: rawReportId,
          trimmed: reportIdStr,
          type: typeof rawReportId,
          savedReport: data?.savedReport,
          success: data?.success,
          timestamp: new Date().toISOString(),
        });
        
        // Validate reportId
        if (!reportIdStr || reportIdStr === 'null' || reportIdStr === 'undefined' || reportIdStr === '') {
          console.error("[AnalyzeForm] Invalid reportId:", {
            raw: rawReportId,
            trimmed: reportIdStr,
            data: data,
          });
          toast.error("Invalid report ID. Please try again.");
          setLoading(false);
          return;
        }
        
        // Validate UUID format (unless it's a special ID like "sample-report")
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (reportIdStr !== "sample-report" && !uuidRegex.test(reportIdStr)) {
          console.error("[AnalyzeForm] Invalid reportId format (not UUID):", reportIdStr);
          toast.error("Invalid report ID format. Please try again.");
          setLoading(false);
          return;
        }
        
        // Start polling for progress
        setLoadingStep("Initializing analysis...");
        setLoadingProgress(5);
        
        // Poll for report status and progress
        const pollInterval = setInterval(async () => {
          try {
            const verifyUrl = `/api/reports/${encodeURIComponent(reportIdStr)}`;
            const verifyRes = await fetch(verifyUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
            });
            
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData?.ok && verifyData?.report) {
                const report = verifyData.report;
                const status = report.status || report.data?.status;
                
                // Update progress based on status
                if (status === "processing" || status === "queued") {
                  // Estimate progress: start at 10%, slowly increase
                  const elapsed = Date.now() - (report.created_at ? new Date(report.created_at).getTime() : Date.now());
                  const estimatedTotal = 180000; // 3 minutes
                  const progress = Math.min(90, 10 + (elapsed / estimatedTotal) * 80);
                  setLoadingProgress(progress);
                  
                  // Update step based on elapsed time
                  if (elapsed < 30000) {
                    setLoadingStep("Analyzing product images...");
                  } else if (elapsed < 90000) {
                    setLoadingStep("Searching supplier database...");
                  } else if (elapsed < 150000) {
                    setLoadingStep("Calculating costs and margins...");
                  } else {
                    setLoadingStep("Finalizing report...");
                  }
                } else if (status === "completed") {
                  // Report is complete
                  clearInterval(pollInterval);
                  setLoadingProgress(100);
                  setLoadingStep("Analysis complete!");
                  
                  // Get current user id for ownership check
                  const supabase = createClient();
                  const { data: { user: currentUser } } = await supabase.auth.getUser();
                  
                  // Check ownership if report has a user_id
                  if (report.user_id && currentUser) {
                    if (report.user_id !== currentUser.id) {
                      console.error("[AnalyzeForm] Ownership mismatch:", {
                        reportUserId: report.user_id,
                        currentUserId: currentUser.id,
                      });
                      toast.error("This report belongs to another account. Please try again.");
                      setLoading(false);
                      return;
                    }
                  }
                  
                  // Small delay to show completion
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  console.log("[AnalyzeForm] ✓ Report completed, redirecting to:", `/reports/${reportIdStr}/v2`);
                  toast.success("Analysis completed");
                  router.push(`/reports/${reportIdStr}/v2`);
                  return;
                }
              }
            }
          } catch (pollError) {
            console.warn("[AnalyzeForm] Polling error:", pollError);
            // Continue polling on error
          }
        }, 2000); // Poll every 2 seconds
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (loading) {
            toast.error("Analysis is taking longer than expected. Please check your reports.");
            setLoading(false);
          }
        }, 300000);
        
        // Store interval for cleanup
        (window as any).__analyzePollInterval = pollInterval;
      } else {
        // Fallback: show results inline or redirect
        console.error("[AnalyzeForm] No reportId in response:", {
          data,
          responseStatus: response.status,
          timestamp: new Date().toISOString(),
        });
        toast.error("Analysis completed but report ID is missing. Please check your reports.");
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process analysis";
      console.error("[AnalyzeForm] Unexpected error:", err);
      setApiError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      // Clean up polling interval if exists
      if ((window as any).__analyzePollInterval) {
        clearInterval((window as any).__analyzePollInterval);
        delete (window as any).__analyzePollInterval;
      }
    }
  };
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if ((window as any).__analyzePollInterval) {
        clearInterval((window as any).__analyzePollInterval);
        delete (window as any).__analyzePollInterval;
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[2fr_1fr] lg:gap-12">
        {/* Left: Photo Upload */}
        <div>
          {loading ? (
            <LoadingState 
              progress={loadingProgress}
              currentStep={loadingStep}
            />
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
        <div className="space-y-4 sm:space-y-6">
          {apiError && (
            <div className="p-4 rounded-xl border border-red-200/60 bg-red-50/80 backdrop-blur-sm text-sm text-red-700">
              {apiError}
            </div>
          )}
          {restoredDraft && (
            <div className="p-4 rounded-xl border border-amber-200/60 bg-amber-50/80 backdrop-blur-sm text-sm text-amber-700">
              Draft restored. Re-attach your photos and submit.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-lg shadow-slate-200/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-transparent">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Assumptions</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  <span>Per-unit estimate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  <span>Missing weight or box size uses category defaults</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  <span>Defaults are labeled and editable</span>
                </li>
              </ul>
            </div>

            {/* Form */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Destination */}
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Destination</div>
                <div className="text-base font-semibold text-slate-900">United States</div>
              </div>

              {/* Target Sell Price */}
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-2 block">Target Sell Price ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-slate-400">$</span>
                  <input
                    type="text"
                    placeholder="9.99"
                    value={form.shelfPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, shelfPrice: e.target.value }))}
                    className="w-full h-11 sm:h-12 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm pl-8 pr-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Required to calculate your profit margin.</p>
              </div>

              {/* Advanced */}
              <details className="group">
                <summary className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors select-none">
                  <span className="text-slate-400 group-open:rotate-90 transition-transform text-xs">▶</span>
                  <span>Edit assumptions</span>
                </summary>
                <div className="mt-4 space-y-5 pl-5 border-l-2 border-slate-200/60">
                  <p className="text-xs text-slate-500">Only if you know the shipping box size and weight.</p>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Shipping mode</label>
                    <select
                      value={form.shippingMode}
                      onChange={(e) => setForm((prev) => ({ ...prev, shippingMode: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
                    >
                      <option value="air">Air</option>
                      <option value="ocean">Ocean</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Weight {unitSystem === "imperial" ? "(lb)" : "(kg)"}
                    </label>
                    <input
                      type="text"
                      placeholder={unitSystem === "imperial" ? "1.2" : "0.5"}
                      value={form.weight}
                      onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Dimensions {unitSystem === "imperial" ? "(in)" : "(cm)"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="L"
                        value={form.length}
                        onChange={(e) => setForm((prev) => ({ ...prev, length: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="W"
                        value={form.width}
                        onChange={(e) => setForm((prev) => ({ ...prev, width: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="H"
                        value={form.height}
                        onChange={(e) => setForm((prev) => ({ ...prev, height: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </details>

              {/* Submit */}
              <div className="pt-4 sm:pt-6 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !hasValidInput}
                  className={cn(
                    "w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg touch-manipulation",
                    !hasValidInput
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl active:scale-[0.98]"
                  )}
                >
                  {loading ? "Calculating..." : "Calculate Landed Cost"}
                </button>
                {mode === "public" && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Save results requires sign in
                  </p>
                )}
                {mode === "app" && (
                  <p className="mt-3 text-center text-xs text-slate-500">
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
