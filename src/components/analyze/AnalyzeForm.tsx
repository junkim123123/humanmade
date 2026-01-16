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
  shippingMode: "sea",
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
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Upload product photo",
      prompt: "Show us the product you want analyzed.",
    },
    {
      id: 2,
      title: "Marketplace context",
      prompt: "Where will you sell this product?",
    },
    {
      id: 3,
      title: "Target selling price",
      prompt: "What price are you aiming for?",
    },
  ];

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

  const progressPercent = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  const handleNextFromUpload = () => {
    setSubmitted(true);
    if (!files.product) {
      setValidationErrors({ product: "Product photo is required." });
      toast.error("Please provide a product photo.");
      return;
    }
    setValidationErrors({});
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(steps.length, prev + 1));
  };

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

    // Start a fake progress interval to provide immediate feedback
    // Increase initial progress faster to prevent user bounce
    const startTime = Date.now();
    const fakeProgressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev === undefined) return 0;
        const elapsed = Date.now() - startTime;
        // Rapidly increase to 25% in the first 3 seconds (to avoid perception of lag)
        if (elapsed < 3000) {
          // 25% in 3 seconds = approx 8.3% per second
          const target = Math.min(25, (elapsed / 3000) * 25);
          return Math.max(prev, target);
        }
        // Slow down to 30% after 3 seconds
        if (prev < 30 && elapsed < 5000) {
          return prev + 0.5;
        }
        return prev;
      });
    }, 100); // Faster updates (100ms)

    const cleanup = (clearProgress = true) => {
      clearInterval(fakeProgressInterval);
      if (clearProgress) {
        setLoading(false);
      }
    };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (mode === "public" && !user) {
      try {
        const draft = { ...form };
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        toast.info("Please sign in to continue.");
        router.push("/login?redirect=/app/analyze");
      } catch (e) {
        console.error("Failed to save draft", e);
        toast.error("Could not save your draft. Please try again.");
        cleanup();
      }
      return;
    }

    if (mode === "app" && !user) {
      toast.error("Authentication required. Please sign in.");
      router.push("/login?redirect=/app/analyze");
      cleanup();
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
    
    if (form.shelfPrice) formData.append("shelfPrice", form.shelfPrice);
    if (marketplace) formData.append("marketplace", marketplace);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      // Stop the fake progress once we have a response
      cleanup(false);

      const isSuccessful = data?.ok || data?.savedReport || data?.reportId || data?.raw || data?.success;

      if (!response.ok || !isSuccessful) {
        const errorMessage = data?.error || data?.message || data?.details || `Analysis failed (${response.status})`;
        console.error("[AnalyzeForm] API error:", data);
        
        let displayMessage = errorMessage;
        if (data?.error === "UPLOAD_FAILED" || data?.error === "STORAGE_FORBIDDEN") {
          displayMessage = "Image upload failed. Please try again or contact support.";
        } else if (data?.error === "REPORT_INIT_FAILED") {
          displayMessage = "Failed to initialize report. Please try again.";
        }
        
        setApiError(displayMessage);
        toast.error(displayMessage);
        setLoading(false);
        return;
      }

      if (data?.reportId || data?.raw || data?.savedReport || data?.success) {
        
        const rawReportId = data.raw || data.trimmed || data.reportId;
        const reportIdStr = String(rawReportId).trim();
        
        console.log("[AnalyzeForm] Processing reportId for redirect:", {
          raw: rawReportId,
          finalId: reportIdStr,
          savedReport: data?.savedReport,
          success: data?.success
        });
        
        if (!reportIdStr || reportIdStr === 'null' || reportIdStr === 'undefined' || reportIdStr === '') {
          console.error("[AnalyzeForm] Invalid reportId received:", data);
          toast.error("Invalid report ID. Please try again.");
          setLoading(false);
          return;
        }
        
        setLoadingStep("Initializing analysis...");
        // Set to 30% immediately after API response (to avoid perception of lag)
        setLoadingProgress(30);
        
        // Record polling start time (to compensate for server time drift)
        const pollingStartTime = Date.now();
        let lastProgressUpdate = 30;

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
                
                // Check if report is completed (multiple status formats supported)
                // Also treat undefined/null status as completed if report exists with data
                // (pipeline must complete before report data is saved)
                const hasReportData = report.productName || report.baseline || report.id;
                const isCompleted = status === "completed" || 
                                  status === "COMPLETED" || 
                                  report.status === "completed" ||
                                  report.status === "COMPLETED" ||
                                  (report.data && report.data.status === "completed") ||
                                  (status === undefined && hasReportData);
                
                if (isCompleted) {
                  clearInterval(pollInterval);
                  
                  console.log("[AnalyzeForm] Report completed, redirecting...", {
                    reportId: reportIdStr,
                    status: status,
                    reportStatus: report.status,
                    dataStatus: report.data?.status
                  });
                  
                  // Smoothly animate progress to 100% on completion
                  setLoadingStep("Finalizing report...");
                  
                  // Gradually increase from current progress to 100% (over approx 1.5 seconds)
                  const startProgress = Math.max(85, Math.min(99, loadingProgress || 85));
                  let smoothProgress = startProgress;
                  
                  const smoothInterval = setInterval(() => {
                    smoothProgress = Math.min(100, smoothProgress + 1.2); // 1.2% increments
                    setLoadingProgress(smoothProgress);
                    
                    if (smoothProgress >= 100) {
                      clearInterval(smoothInterval);
                      setLoadingStep("Analysis complete!");
                      
                      // Brief delay before redirecting
                      setTimeout(async () => {
                        try {
                          const { data: { user: currentUser } } = await supabase.auth.getUser();
                          if (report.user_id && currentUser && report.user_id !== currentUser.id) {
                             toast.error("This report belongs to another account.");
                             setLoading(false);
                             return;
                          }
                          
                          toast.success("Analysis completed");
                          console.log("[AnalyzeForm] Redirecting to:", `/reports/${reportIdStr}/v2`);
                          router.push(`/reports/${reportIdStr}/v2`);
                        } catch (redirectError) {
                          console.error("[AnalyzeForm] Redirect error:", redirectError);
                          toast.error("Failed to redirect. Please navigate manually.");
                          setLoading(false);
                        }
                      }, 500);
                    }
                  }, 60); // 1.2% every 60ms (reaches 100% in approx 1.5s)
                  
                  return;
                } else if (status === "processing" || status === "queued" || status === "PROCESSING" || status === "QUEUED") {
                  // Calculate elapsed time based on client time (compensating for server time drift)
                  const clientElapsed = Date.now() - pollingStartTime;
                  const estimatedTotal = 120000; // 2 minutes = 120 seconds = 120,000ms
                  
                  // Calculate progress from 30% to 85% over 2 minutes
                  // 30% + (elapsed / 120,000) * 55 = 30% to 85%
                  const calculatedProgress = Math.min(85, 30 + (clientElapsed / estimatedTotal) * 55);
                  
                  // Ensure minimum progress: guarantee a small increase over time
                  // At least 0.2% increase per polling (to avoid perception of lag)
                  const minProgress = lastProgressUpdate + 0.2;
                  const progress = Math.max(calculatedProgress, minProgress);
                  
                  setLoadingProgress(progress);
                  lastProgressUpdate = progress;
                  
                  // Update step based on elapsed time with more granular messages
                  if (clientElapsed < 10000) setLoadingStep("Analyzing product images...");
                  else if (clientElapsed < 20000) setLoadingStep("Extracting product details...");
                  else if (clientElapsed < 30000) setLoadingStep("Identifying category and materials...");
                  else if (clientElapsed < 40000) setLoadingStep("Scanning trade data...");
                  else if (clientElapsed < 50000) setLoadingStep("Matching suppliers...");
                  else if (clientElapsed < 60000) setLoadingStep("Analyzing HS codes...");
                  else if (clientElapsed < 70000) setLoadingStep("Calculating duty rates...");
                  else if (clientElapsed < 80000) setLoadingStep("Estimating shipping costs...");
                  else if (clientElapsed < 100000) setLoadingStep("Computing landed costs...");
                  else if (clientElapsed < 110000) setLoadingStep("Generating market insights...");
                  else setLoadingStep("Finalizing report...");
                } else if (status === "failed" || status === "FAILED" || status === "error" || status === "ERROR") {
                  // Report failed - stop polling and show error
                  clearInterval(pollInterval);
                  console.error("[AnalyzeForm] Report failed:", { status, reportId: reportIdStr });
                  toast.error("Analysis failed. Please try again.");
                  setLoading(false);
                  return;
                } else if (status === undefined || status === null) {
                  // Status undefined but report exists - might still be initializing
                  // Continue polling but log for debugging
                  console.log("[AnalyzeForm] Report status undefined, continuing to poll:", {
                    reportId: reportIdStr,
                    hasProductName: !!report.productName,
                    hasBaseline: !!report.baseline
                  });
                } else {
                  // Unknown status - log for debugging
                  console.warn("[AnalyzeForm] Unknown report status:", {
                    status,
                    reportStatus: report.status,
                    dataStatus: report.data?.status,
                    reportId: reportIdStr
                  });
                }
              }
            }
          } catch (pollError) {
            console.warn("[AnalyzeForm] Polling error:", pollError);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(pollInterval);
          if (loading) {
            toast.success("Redirecting to report...");
            router.push(`/reports/${reportIdStr}/v2`);
          }
        }, 300000);
        
        (window as any).__analyzePollInterval = pollInterval;
      } else {
        console.error("[AnalyzeForm] No reportId found in successful response:", data);
        toast.error("Analysis completed but report ID is missing.");
        setLoading(false);
      }
    } catch (err) {
      cleanup();
      const errorMessage = err instanceof Error ? err.message : "Failed to process analysis";
      console.error("[AnalyzeForm] Unexpected error:", err);
      setApiError(errorMessage);
      toast.error(errorMessage);
      if ((window as any).__analyzePollInterval) {
        clearInterval((window as any).__analyzePollInterval);
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
      {apiError && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl border border-red-200/60 bg-red-50/80 backdrop-blur-sm text-xs sm:text-sm text-red-700">
          {apiError}
        </div>
      )}
      {restoredDraft && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl border border-amber-200/60 bg-amber-50/80 backdrop-blur-sm text-xs sm:text-sm text-amber-700">
          Draft restored. Re-attach your photos and submit.
        </div>
      )}

      <div className="rounded-2xl p-[1px] bg-gradient-to-br from-slate-200 via-blue-200 to-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
        <div className="relative rounded-2xl bg-white/95 px-5 py-6 sm:px-8 sm:py-10">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60" />

          <div className="relative space-y-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Sourcing Engineering Workflow
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Guided Supply Chain Analysis
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Follow the steps below and we will build a professional, data-backed sourcing report.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Step {currentStep} of {steps.length}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-center font-semibold",
                      currentStep >= step.id
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    Step {step.id}
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-8 sm:px-8">
                <div className="mb-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Deep Analysis
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">Running multi-stage verification</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Matching factory data, HS codes, and logistics benchmarks.
                  </p>
                </div>
                <LoadingState progress={loadingProgress} currentStep={loadingStep} />
              </div>
            ) : (
              <>
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
                      <h3 className="text-lg font-semibold text-slate-900">{steps[0].title}</h3>
                      <p className="text-sm text-slate-600">{steps[0].prompt}</p>
                    </div>
                    <ThreeImageUpload
                      ref={uploadRef}
                      onFilesChange={(selected) => setFiles(selected)}
                      disabled={loading}
                      validationErrors={submitted ? validationErrors : {}}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleNextFromUpload}
                        className={cn(
                          "inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold transition-all",
                          files.product
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        )}
                        disabled={!files.product}
                      >
                        Continue to context
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
                      <h3 className="text-lg font-semibold text-slate-900">{steps[1].title}</h3>
                      <p className="text-sm text-slate-600">{steps[1].prompt}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Marketplace Context</h4>
                      <div className="flex flex-wrap gap-2">
                        {["Amazon FBA", "Shopify", "eBay", "Other"].map((channel) => (
                          <button
                            key={channel}
                            type="button"
                            onClick={() => setMarketplace(channel)}
                            className={cn(
                              "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors",
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
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Continue to price
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 3</p>
                      <h3 className="text-lg font-semibold text-slate-900">{steps[2].title}</h3>
                      <p className="text-sm text-slate-600">{steps[2].prompt}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                      <label className="text-sm font-semibold text-slate-900 mb-2 block">Target Sell Price</label>
                      <div className="relative">
                        <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold text-slate-700">$</span>
                        <input
                          type="text"
                          placeholder="9.99"
                          value={form.shelfPrice}
                          onChange={(e) => setForm((prev) => ({ ...prev, shelfPrice: e.target.value }))}
                          className="w-full h-12 sm:h-14 rounded-xl border-2 border-slate-200 bg-white pl-7 sm:pl-8 pr-4 text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Optional but recommended for margin accuracy.</p>
                    </div>

                    <details className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                      <summary className="flex items-center justify-between text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-900 transition-colors select-none">
                        <span className="flex items-center gap-2">
                          <span className="text-slate-400 group-open:rotate-90 transition-transform text-xs">▶</span>
                          <span>Advanced assumptions</span>
                        </span>
                        <span className="text-xs text-slate-400">Optional</span>
                      </summary>
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-slate-200">
                        <p className="text-xs text-slate-500">Defaults used if not specified.</p>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Shipping mode</label>
                          <select
                            value={form.shippingMode}
                            onChange={(e) => setForm((prev) => ({ ...prev, shippingMode: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                          >
                            <option value="air">Air</option>
                            <option value="sea">Sea</option>
                          </select>
                        </div>
                        <div className="text-xs text-slate-500 py-2">
                          <strong>Note:</strong> our ai will infer all product data (weight, dimensions, price, etc.) from the uploaded photo. No manual entry required.
                        </div>
                      </div>
                    </details>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Back
                      </button>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading || !hasValidInput}
                          className={cn(
                            "inline-flex h-12 items-center justify-center rounded-xl px-8 text-base font-semibold transition-all shadow-lg",
                            !hasValidInput
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                          )}
                        >
                          {loading ? "Analyzing..." : "Run Deep Analysis"}
                        </button>
                        {mode === "public" && (
                          <p className="text-xs text-slate-500">Save results requires sign in</p>
                        )}
                        {mode === "app" && (
                          <p className="text-xs text-slate-500">Signed in saves your report to Reports.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
