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

    // Start a fake progress interval to provide immediate feedback
    // 더 빠르게 초기 진행률을 올려서 사용자 이탈 방지
    const startTime = Date.now();
    const fakeProgressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev === undefined) return 0;
        const elapsed = Date.now() - startTime;
        // 초기 3초 동안 빠르게 25%까지 올림 (렉으로 오해 방지)
        if (elapsed < 3000) {
          // 3초에 25% = 약 8.3% per second
          const target = Math.min(25, (elapsed / 3000) * 25);
          return Math.max(prev, target);
        }
        // 3초 후에는 천천히 30%까지
        if (prev < 30 && elapsed < 5000) {
          return prev + 0.5;
        }
        return prev;
      });
    }, 100); // 더 빠른 업데이트 (100ms)

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
        // API 응답 후 즉시 30%로 설정 (렉으로 오해 방지)
        setLoadingProgress(30);
        
        // Polling 시작 시간 기록 (서버 시간과의 차이 보정)
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
                
                if (status === "processing" || status === "queued") {
                  // 클라이언트 시간 기준으로 경과 시간 계산 (서버 시간 차이 보정)
                  const clientElapsed = Date.now() - pollingStartTime;
                  const estimatedTotal = 120000; // 2분 = 120초 = 120,000ms
                  
                  // 30%에서 시작해서 2분 동안 85%까지 올라가도록 계산
                  // 30% + (elapsed / 120000) * 55 = 30%에서 85%까지
                  const calculatedProgress = Math.min(85, 30 + (clientElapsed / estimatedTotal) * 55);
                  
                  // 최소 진행률 보장: 시간이 지나면 최소한 조금씩은 올라가도록
                  // 매 polling마다 최소 0.2%씩 증가 보장 (렉으로 오해 방지)
                  const minProgress = lastProgressUpdate + 0.2;
                  const progress = Math.max(calculatedProgress, minProgress);
                  
                  setLoadingProgress(progress);
                  lastProgressUpdate = progress;
                  
                  if (elapsed < 30000) setLoadingStep("Analyzing product images...");
                  else if (elapsed < 60000) setLoadingStep("Searching supplier database...");
                  else if (elapsed < 100000) setLoadingStep("Calculating costs and margins...");
                  else setLoadingStep("Finalizing report...");
                } else if (status === "completed" || data.savedReport) {
                  clearInterval(pollInterval);
                  
                  // 완료 시에도 부드럽게 100%까지 올라가도록 처리
                  setLoadingStep("Finalizing report...");
                  
                  // 현재 진행률에서 100%까지 천천히 올라가도록 (약 2초에 걸쳐)
                  const startProgress = Math.max(85, Math.min(99, loadingProgress || 85));
                  let smoothProgress = startProgress;
                  
                  const smoothInterval = setInterval(() => {
                    smoothProgress = Math.min(100, smoothProgress + 1.2); // 1.2%씩 증가
                    setLoadingProgress(smoothProgress);
                    
                    if (smoothProgress >= 100) {
                      clearInterval(smoothInterval);
                      setLoadingStep("Analysis complete!");
                      
                      // 완료 후 약간의 딜레이를 두고 리다이렉트
                      setTimeout(async () => {
                        const { data: { user: currentUser } } = await supabase.auth.getUser();
                        if (report.user_id && currentUser && report.user_id !== currentUser.id) {
                           toast.error("This report belongs to another account.");
                           setLoading(false);
                           return;
                        }
                        
                        toast.success("Analysis completed");
                        router.push(`/reports/${reportIdStr}/v2`);
                      }, 500);
                    }
                  }, 60); // 60ms마다 1.2%씩 증가 (약 1.5초에 100% 도달)
                  
                  return;
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
      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-[1fr_auto]">
        {/* Main Workflow Area */}
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Marketplace Context</h3>
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
            
            {/* Target Price - Emphasized */}
            <div>
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
              <p className="mt-2 text-xs text-slate-500">Required to calculate your profit margin</p>
            </div>
          </div>
        </div>

        {/* Live Margin Calculator Sidebar */}
        <div className="lg:sticky lg:top-6 lg:self-start mt-4 sm:mt-8 lg:mt-0">
          {apiError && (
            <div className="p-3 sm:p-4 rounded-xl border border-red-200/60 bg-red-50/80 backdrop-blur-sm text-xs sm:text-sm text-red-700 mb-4">
              {apiError}
            </div>
          )}
          {restoredDraft && (
            <div className="p-3 sm:p-4 rounded-xl border border-amber-200/60 bg-amber-50/80 backdrop-blur-sm text-xs sm:text-sm text-amber-700 mb-4">
              Draft restored. Re-attach your photos and submit.
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            {/* Live Calculator Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Live Margin Calculator</h3>
              <p className="text-xs text-slate-500">Updates as you fill in details</p>
            </div>

            {/* Form */}
            <div className="p-4 sm:p-5 space-y-4">
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
                    <strong>Note:</strong> our ai will infer all product data (weight, dimensions, price, etc.) from the uploaded photo. No manual entry required.
                  </div>
                </div>
              </details>

              {/* Submit - Full Width CTA */}
              <div className="pt-4 border-t border-slate-200 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 pb-4 sm:pb-5 bg-slate-50/50">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !hasValidInput}
                  className={cn(
                    "w-full h-12 sm:h-14 rounded-xl text-base font-semibold transition-all shadow-lg touch-manipulation",
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
