"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { ThreeImageUpload, ThreeImageUploadHandle } from "@/components/analyze/ThreeImageUpload";
import { ReportGenerationProgress } from "@/components/analyze/ReportGenerationProgress";
import { analyzeSchema } from "@/lib/analyze/schema";
import type { AnalyzeInput } from "@/lib/analyze/schema";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload, Camera } from "lucide-react";

const DRAFT_KEY = "analyzeDraft";

const defaultValues = {
  destination: "US",
  shippingMode: "air",
  linkUrl: "",
};

export type AnalyzeFormMode = "public" | "app";

interface AnalyzeFormSwellProps {
  mode: AnalyzeFormMode;
}

// Swell-style Upload Card Component
interface UploadCardProps {
  title: string;
  requiredLabel?: string;
  optionalLabel?: string;
  description: string;
  helper?: string;
  file: File | null;
  preview: string | null;
  error?: string;
  onFileSelect: (file: File | null) => void;
  onFileRemove: () => void;
  disabled?: boolean;
  slotType: "product" | "barcode" | "label";
}

function UploadCard({
  title,
  requiredLabel,
  optionalLabel,
  description,
  helper,
  file,
  preview,
  error,
  onFileSelect,
  onFileRemove,
  disabled = false,
  slotType,
}: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-2xl border border-slate-200",
        "bg-slate-50/80 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]",
        "transition-all hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]",
        error && "border-red-300 bg-red-50/50"
      )}
    >
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
          {requiredLabel && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
              {requiredLabel}
            </span>
          )}
          {optionalLabel && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
              {optionalLabel}
            </span>
          )}
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed">{description}</p>
        {helper && <p className="mt-2 text-[11px] text-slate-500">{helper}</p>}
        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
      </div>

      <div
        className={cn(
          "relative flex flex-1 flex-col items-center justify-center gap-3",
          "rounded-xl border border-dashed border-slate-300 bg-white/80 py-5",
          preview && "border-slate-400"
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={title}
              className="max-h-32 max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={onFileRemove}
              disabled={disabled}
              className="text-[12px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-slate-100 p-3 text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>

            <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleGalleryClick}
                disabled={disabled}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4 inline mr-1" />
                Choose photos
              </button>
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={disabled}
                className="flex-1 rounded-lg bg-slate-900 px-3 py-2.5 text-[13px] font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 inline mr-1" />
                Take photo
              </button>
            </div>

            <p className="text-[12px] text-slate-500">Or drop, paste files here</p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={slotType === "product"}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function AnalyzeFormSwell({ mode }: AnalyzeFormSwellProps) {
  const router = useRouter();
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [form, setForm] = useState({
    ...defaultValues,
    shelfPrice: "",
    linkUrl: "",
    weight: "",
    length: "",
    width: "",
    height: "",
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
  const [previews, setPreviews] = useState<{
    product: string | null;
    barcode: string | null;
    label: string | null;
  }>({
    product: null,
    barcode: null,
    label: null,
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    product?: string;
    barcode?: string;
    label?: string;
  }>({});

  // Generate preview URLs
  useEffect(() => {
    const newPreviews = { ...previews };
    if (files.product) {
      newPreviews.product = URL.createObjectURL(files.product);
    } else {
      newPreviews.product = null;
    }
    if (files.barcode) {
      newPreviews.barcode = URL.createObjectURL(files.barcode);
    } else {
      newPreviews.barcode = null;
    }
    if (files.label) {
      newPreviews.label = URL.createObjectURL(files.label);
    } else {
      newPreviews.label = null;
    }
    setPreviews(newPreviews);

    return () => {
      Object.values(newPreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files.product, files.barcode, files.label]);

  const handleFileChange = (
    slotType: "product" | "barcode" | "label",
    file: File | null
  ) => {
    setFiles((prev) => ({ ...prev, [slotType]: file }));
    if (validationErrors[slotType]) {
      setValidationErrors((prev) => ({ ...prev, [slotType]: undefined }));
    }
  };

  const handleFileRemove = (slotType: "product" | "barcode" | "label") => {
    setFiles((prev) => ({ ...prev, [slotType]: null }));
    setPreviews((prev) => ({ ...prev, [slotType]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication for public mode
    if (mode === "public") {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.info("Please sign in to run analysis");
        router.push(`/signin?next=${encodeURIComponent("/analyze")}`);
        return;
      }
    }

    // Validation
    if (!files.product) {
      setValidationErrors({ product: "Product photo is required" });
      toast.error("Please upload a product photo");
      return;
    }

    setLoading(true);
    setValidationErrors({});

    try {
      const parsed = analyzeSchema.safeParse({
        destination: form.destination || "US",
        shippingMode: form.shippingMode || "air",
        linkUrl: form.linkUrl.trim() || undefined,
        front: files.product,
        barcode: files.barcode || undefined,
        label: files.label || undefined,
      });

      if (!parsed.success) {
        toast.error("Invalid form data");
        setLoading(false);
        return;
      }

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

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      // Handle reused report
      if (response.ok && data?.ok && data?.reused) {
        const existingReportId = String(data.reportId || '').trim();
        if (existingReportId && existingReportId !== 'null' && existingReportId !== 'undefined') {
          toast.info("Analysis already in progress. Redirecting...");
          router.push(`/reports/${existingReportId}/v2`);
          return;
        }
      }

      if (!response.ok || !data?.ok) {
        const errorMessage = data?.error || data?.message || "Analysis failed";
        toast.error(errorMessage);
        setLoading(false);
        return;
      }

      if (data?.reportId) {
        const reportIdStr = String(data.reportId).trim();
        // Start polling for completion
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await fetch(`/api/reports/${reportIdStr}`);
            const pollData = await pollResponse.json();
            
            if (pollData?.ok && pollData?.report?.status === "completed") {
              clearInterval(pollInterval);
              toast.success("Analysis completed");
              router.push(`/reports/${reportIdStr}/v2`);
            }
          } catch (pollError) {
            // Continue polling
          }
        }, 2000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (loading) {
            toast.error("Analysis is taking longer than expected. Please check your reports.");
            setLoading(false);
          }
        }, 300000);
      } else {
        toast.error("No report ID returned");
        setLoading(false);
      }
    } catch (error) {
      console.error("[AnalyzeFormSwell] Submit error:", error);
      toast.error("Failed to submit analysis");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ReportGenerationProgress
        currentStep={4}
        totalSteps={4}
        progress={100}
        title="Generating insights"
        description="Preparing your comprehensive sourcing report"
        tip="We start outreach within 12 hours and share verified quotes in about a week."
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50/90 to-slate-100/80 py-10 lg:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <header className="mb-6">
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-slate-900">
            Product photos
          </h1>
          <p className="mt-1 text-[14px] text-slate-600 max-w-xl">
            Upload a product photo to start. Barcode and label photos are optional but recommended for accuracy. 3 minutes. Assumptions are always labeled.
          </p>
        </header>

        {/* 3D Board */}
        <section
          className="
            rounded-3xl border border-slate-200/80 bg-white/95
            shadow-[0_22px_60px_rgba(15,23,42,0.15)]
            backdrop-blur-sm
            px-4 py-5 sm:p-6 lg:p-7
          "
        >
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] items-start">
              {/* Left: upload cards */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Product photo */}
                  <UploadCard
                    title="Product photo"
                    requiredLabel="Required"
                    description="Clear front photo of the product or package. Make the name readable."
                    file={files.product}
                    preview={previews.product}
                    error={validationErrors.product}
                    onFileSelect={(file) => handleFileChange("product", file)}
                    onFileRemove={() => handleFileRemove("product")}
                    slotType="product"
                  />

                  {/* Barcode photo */}
                  <UploadCard
                    title="Barcode photo"
                    optionalLabel="Optional"
                    description="UPC or EAN close-up. Avoid glare. Fill the frame."
                    helper="Barcode/Label highly recommended for accuracy, but not required."
                    file={files.barcode}
                    preview={previews.barcode}
                    error={validationErrors.barcode}
                    onFileSelect={(file) => handleFileChange("barcode", file)}
                    onFileRemove={() => handleFileRemove("barcode")}
                    slotType="barcode"
                  />

                  {/* Label photo */}
                  <UploadCard
                    title="Label photo"
                    optionalLabel="Optional"
                    description="Back label with net weight, materials, warnings, and origin if shown."
                    helper="Barcode/Label highly recommended for accuracy, but not required."
                    file={files.label}
                    preview={previews.label}
                    error={validationErrors.label}
                    onFileSelect={(file) => handleFileChange("label", file)}
                    onFileRemove={() => handleFileRemove("label")}
                    slotType="label"
                  />
                </div>

                {/* Extra photos */}
                <button
                  type="button"
                  className="
                    inline-flex items-center gap-2 rounded-full border border-slate-200
                    bg-slate-50/80 px-3 py-1.5 text-[13px] font-medium text-slate-700
                    hover:bg-slate-100 hover:border-slate-300 transition-colors
                  "
                >
                  <span className="text-slate-400">＋</span>
                  Add extra photos (optional)
                </button>
              </div>

              {/* Right: assumptions + CTA */}
              <aside
                className="
                  rounded-2xl border border-slate-200 bg-slate-50/90
                  shadow-[0_16px_40px_rgba(15,23,42,0.12)]
                  p-5 space-y-4
                "
              >
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">
                    Assumptions
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                    <li>Per-unit estimate</li>
                    <li>Missing weight or box size uses category defaults</li>
                    <li>Defaults are labeled and editable</li>
                  </ul>
                </div>

                <div className="h-px bg-slate-200/80" />

                <div className="space-y-3 text-[13px]">
                  <div>
                    <p className="text-slate-500">Destination</p>
                    <p className="mt-0.5 font-medium text-slate-900">
                      United States
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="targetPrice"
                      className="flex items-center justify-between text-slate-700"
                    >
                      <span>Target Sell Price ($)</span>
                    </label>
                    <div
                      className="
                        flex items-center rounded-xl border border-slate-200
                        bg-white px-3 py-2 text-[14px]
                        shadow-[0_8px_20px_rgba(15,23,42,0.06)]
                      "
                    >
                      <span className="mr-1 text-slate-400">$</span>
                      <input
                        id="targetPrice"
                        type="number"
                        value={form.shelfPrice}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, shelfPrice: e.target.value }))
                        }
                        className="
                          w-full bg-transparent outline-none
                          text-slate-900 placeholder:text-slate-400
                        "
                        placeholder="9.99"
                      />
                    </div>
                    <p className="text-[12px] text-slate-500">
                      Required to calculate your profit margin.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="
                      inline-flex items-center gap-1 text-[13px] font-medium
                      text-slate-600 hover:text-slate-900 transition-colors
                    "
                  >
                    ▶ Edit assumptions
                  </button>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    type="submit"
                    disabled={!files.product || loading}
                    className="
                      flex w-full items-center justify-center
                      rounded-full bg-slate-900 px-4 py-2.5
                      text-[14px] font-semibold text-white
                      shadow-[0_18px_40px_rgba(15,23,42,0.4)]
                      hover:bg-slate-800 hover:shadow-[0_22px_55px_rgba(15,23,42,0.5)]
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Calculate Landed Cost
                  </button>
                  <p className="text-center text-[12px] text-slate-500">
                    Save results requires sign in
                  </p>
                </div>
              </aside>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

