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
  const [form, setForm] = useState({
    ...defaultValues,
    shelfPrice: ""
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
  const [marketplace, setMarketplace] = useState<string>("Amazon FBA");

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

  const handleSubmit = async () => {
    setSubmitted(true);
    setApiError(null);

    // Basic client-side validation
    const newErrors: typeof validationErrors = {};
    if (!files.product) {
      newErrors.product = "Product photo is required.";
    }
    setValidationErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please provide a product photo.");
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLoadingStep("Preparing analysis...");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (mode === "public" && !user) {
      // Save to localStorage and redirect to login
      try {
        const draft = { ...form };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        toast.info("Please sign in to continue.");
        router.push("/login?redirect=/app/analyze");
      } catch (e) {
        console.error("Failed to save draft", e);
        toast.error("Could not save your draft. Please try again.");
        setLoading(false);
      }
      return;
    }

    if (mode === "app" && !user) {
      toast.error("Authentication required. Please sign in.");
      router.push("/login?redirect=/app/analyze");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    if (files.product) formData.append("image", files.product);
    if (files.barcode) formData.append("barcode", files.barcode);
    if (files.label) formData.append("label", files.label);
    if (files.extra1) formData.append("extra1", files.extra1);
    if (files.extra2) formData.append("extra2", files.extra2);
    
    // Append shelfPrice to formData
    if (form.shelfPrice) {
      formData.append("shelfPrice", form.shelfPrice);
    }

    // Append marketplace to formData
    if (marketplace) {
      formData.append("marketplace", marketplace);
    }



    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data?.existingReportId) {
        const existingReportId = String(data.existingReportId).trim();
        
        // Verify existing report exists and user owns it before redirecting
        try {
          console.log("[AnalyzeForm] Verifying existing report ownership before redirect...");
          
          // Get current user id
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
                  // Do not continue further after error
                  // Instead of return, use else to prevent further execution
                } else {
                  console.log("[AnalyzeForm] Existing report verified and ownership confirmed, redirecting...");
                  if (data.status === "processing" || data.status === "queued") {
                    toast.info(data.message || "Analysis already in progress. Redirecting...");
                  } else if (data.status === "completed") {
                    toast.info("Analysis already completed. Redirecting to existing report.");
                  }
                  router.push(`/reports/${existingReportId}/v2`);
                }
                }
              } else {
                // If verification failed, the report might not exist - start new analysis
                console.error("[AnalyzeForm] Existing report verification failed, starting new analysis:", { reportId: existingReportId, status: verifyRes.status });
                toast.error("Existing report not found. Please try again.");
                setLoading(false);
              }
            }
        } catch (verifyError) {
          console.error("[AnalyzeForm] Error verifying existing report:", verifyError);
          toast.error("Error verifying report. Please try again.");
          setLoading(false);
          // Do not continue further after error
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
            toast.error("Analysis is taking longer than expected. Redirecting to your reports page.");
            setLoading(false);
            router.push("/app/reports");
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
      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-[65fr_35fr]">
        {/* Left: Main Workflow Area (65%) */}
        <div className="space-y-6">
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
          
          {/* Smart Input Group - Marketplace Context */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Marketplace Context</h3>
              <div className="flex flex-wrap gap-2">
                {["Amazon FBA", "Shopify", "eBay", "Other"].map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => setMarketplace(channel)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                      marketplace === channel
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Target Price - Emphasized */}
            <div>
              <label className="text-sm font-semibold text-slate-900 mb-2 block">Target Sell Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-700">$</span>
                <input
                  type="text"
                  placeholder="9.99"
                  value={form.shelfPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, shelfPrice: e.target.value }))}
                  className="w-full h-14 rounded-xl border-2 border-slate-200 bg-white pl-8 pr-4 text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Required to calculate your profit margin</p>
            </div>
          </div>
        </div>

        {/* Right: Live Margin Calculator Sidebar (35%) - Sticky */}
        <div className="lg:sticky lg:top-6 lg:self-start mt-8 lg:mt-0">
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

          <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            {/* Live Calculator Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Live Margin Calculator</h3>
              <p className="text-xs text-slate-500">Updates as you fill in details</p>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Destination - Compact */}
              <div className="pb-4 border-b border-slate-100">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Destination</div>
                <div className="text-sm font-semibold text-slate-900">United States</div>
              </div>
              
              {/* Live Preview Placeholder */}
              <div className="py-4 space-y-3 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Estimated Cost</span>
                  <span className="text-sm font-semibold text-slate-900">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Profit Margin</span>
                  <span className="text-sm font-semibold text-slate-900">--</span>
                </div>
              </div>

              {/* Edit Assumptions - Accordion */}
              <details className="group">
                <summary className="flex items-center justify-between text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors select-none py-2">
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400 group-open:rotate-90 transition-transform text-xs">▶</span>
                    <span>Edit Assumptions</span>
                  </span>
                  <span className="text-xs text-slate-400">Optional</span>
                </summary>
                <div className="mt-4 space-y-4 pl-4 border-l-2 border-slate-200">
                  <p className="text-xs text-slate-500">Defaults used if not specified</p>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Shipping mode</label>
                    <select
                      value={form.shippingMode}
                      onChange={(e) => setForm((prev) => ({ ...prev, shippingMode: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                    >
                      <option value="air">Air</option>
                      <option value="ocean">Ocean</option>
                    </select>
                  </div>

                  {/* Weight and Dimensions fields removed. Gemini will infer all data from the product photo. */}
                  <div className="text-xs text-slate-500 py-2">
                    <strong>Note:</strong> Gemini will infer all product data (weight, dimensions, price, etc.) from the uploaded photo. No manual entry required.
                  </div>
                </div>
              </details>

              {/* Submit - Full Width CTA */}
              <div className="pt-4 border-t border-slate-200 -mx-5 -mb-5 px-5 pb-5 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !hasValidInput}
                  className={cn(
                    "w-full h-14 rounded-xl text-base font-semibold transition-all shadow-lg touch-manipulation",
                    !hasValidInput
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.98]"
                  )}
                >
                  {loading ? "Calculating..." : "Calculate Landed Cost"}
                </button>
                {mode === "public" && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Save results requires sign in
                  </p>
                )}
                {mode === "app" && (
                  <p className="mt-2 text-center text-xs text-slate-500">
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
