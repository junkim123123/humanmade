// @ts-nocheck
import { NextResponse } from "next/server";
import { runIntelligencePipeline } from "@/lib/intelligence-pipeline";
import { buildReportFromPipeline } from "@/lib/report/build-report";
import { hashBuffer, makeInputKey } from "@/lib/report/input-key";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateSupplierEnrichment, upsertSupplierEnrichment } from "@/lib/server/supplier-enrichment";
import { createDefaultDraftInference, mergeDraftInference } from "@/lib/draft-inference-builder";
import crypto from "crypto";
import {
  extractLabelWithVision,
  extractBarcodeWithVision,
  inferUnitWeightFromPhoto,
  inferUnitsPerCaseFromBox,
  inferCustomsAndHS,
  getCategoryDefaults,
} from "@/lib/gemini-helper";
import { createPartialReportAndQueueUpgrade } from "@/lib/analyze-fast-helper";
import { buildSignalsFromUploads } from "@/lib/report/signals";
import { normalizeEvidence } from "@/lib/report/evidence";
import { computeDecisionSummary } from "@/lib/report/decision-summary";
import { resolveUnitWeight } from "@/lib/report/weightResolver";

// Force Node.js runtime to avoid edge runtime issues with admin client and Gemini
export const runtime = "nodejs";
const PIPELINE_VERSION = process.env.PIPELINE_VERSION || "v1";

/**
 * POST /api/analyze
 * 
 * Product image analysis and supply chain intelligence pipeline
 * 
 * Request Body (FormData):
 * - image: File (required)
 * - barcode: File (required)
 * - label: File (required)
 * - extra1: File (optional)
 * - extra2: File (optional)
 * - destination: string (optional, default: \"US\")
 * - shippingMode: string (optional, default: \"air\")
 * - shelfPrice: string (optional)
 * - weight: string (optional, in kg)
 * - length: string (optional, in cm)
 * - width: string (optional, in cm)
 * - height: string (optional, in cm)
 * - linkUrl: string (optional)
 * - rerun: boolean (optional, forces new analysis)
 */
export async function POST(request: Request) {
  let finalReportId: string | null = null;
  let userId: string | null = null;
  const warnings: string[] = [];
  try {
    const formData = await request.formData();

    const imageFile = formData.get("image") as File | null;
    const barcodeFile = formData.get("barcode") as File | null;
    const labelFile = formData.get("label") as File | null;
    const extra1File = formData.get("extra1") as File | null;
    const extra2File = formData.get("extra2") as File | null;
    const rerun = formData.get("rerun")?.toString() === "true";
    
    // Server-side defaults for cost calculations
    const quantity = 100;
    const dutyRate = 0.15;
    const shippingCost = 150;
    const fee = 0;

    // Validate required fields: only product image is mandatory
    if (!imageFile) {
      return NextResponse.json(
        {
          ok: false,
          error: "Product photo is required.",
        },
        { status: 400 }
      );
    }

    // Convert File to data URL for pipeline and generate image hashes
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = imageFile.type || "image/jpeg";
    const imageDataUrl = `data:${mimeType};base64,${base64}`;
    
    // Generate data URLs for barcode and label for Vision extraction (optional)
    let barcodeDataUrl: string | null = null;
    let labelDataUrl: string | null = null;
    let barcodeBuffer: Buffer | null = null;
    let labelBuffer: Buffer | null = null;
    
    if (barcodeFile) {
      barcodeBuffer = Buffer.from(await barcodeFile.arrayBuffer());
      const barcodeBase64 = barcodeBuffer.toString("base64");
      const barcodeMimeType = barcodeFile.type || "image/jpeg";
      barcodeDataUrl = `data:${barcodeMimeType};base64,${barcodeBase64}`;
    }
    
    if (labelFile) {
      labelBuffer = Buffer.from(await labelFile.arrayBuffer());
      const labelBase64 = labelBuffer.toString("base64");
      const labelMimeType = labelFile.type || "image/jpeg";
      labelDataUrl = `data:${labelMimeType};base64,${labelBase64}`;
    }
    
    // Generate data URL for extra1 if present (for case pack inference)
    let extra1DataUrl: string | null = null;
    if (extra1File) {
      const extra1Buffer = Buffer.from(await extra1File.arrayBuffer());
      const extra1Base64 = extra1Buffer.toString("base64");
      const extra1MimeType = extra1File.type || "image/jpeg";
      extra1DataUrl = `data:${extra1MimeType};base64,${extra1Base64}`;
    }
    
    // Generate hashes for images for input key (barcode and label are optional)
    const imageHash = hashBuffer(buffer);
    const barcodeHash = barcodeBuffer ? hashBuffer(barcodeBuffer) : null;
    const labelHash = labelBuffer ? hashBuffer(labelBuffer) : null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create admin client once for use throughout the handler (for both authenticated and guest users)
    const admin = getSupabaseAdmin();

    // Allow guest users to run analysis (we'll show sign up modal after results)
    // For guest users, we'll use a temporary user ID or handle differently
    let guestUserId: string | null = null;
    if (!user) {
      // Generate a temporary guest ID for this session
      // In production, you might want to create an anonymous user or use session storage
      guestUserId = `guest_${crypto.randomUUID()}`;
      console.log("[Analyze API] Guest user detected, using temporary ID:", guestUserId);
    } else {
      userId = user.id;
    }

    // Use server-side defaults (already set above)
    const parsedQuantity = quantity;
    const parsedDutyRate = dutyRate;
    const parsedShippingCost = shippingCost;
    const parsedFee = fee;

    console.log("[Analyze API] Starting pipeline with params:", {
      quantity: parsedQuantity,
      dutyRate: parsedDutyRate,
      shippingCost: parsedShippingCost,
      fee: parsedFee,
      imageSize: imageFile.size,
      barcodeSize: barcodeFile?.size,
      labelSize: labelFile?.size,
      hasExtra1: !!extra1File,
      hasExtra2: !!extra2File,
    });

    // Generate input key for deduplication
    const destination = formData.get("destination")?.toString() ?? null;
    const shippingMode = formData.get("shippingMode")?.toString() ?? null;
    
    // If rerun is requested, append a nonce to make the key unique
    let inputKey: string;
    if (rerun) {
      inputKey = makeInputKey({
        imageHash,
        barcodeHash: barcodeHash || "",
        labelHash: labelHash || "",
        quantity: parsedQuantity,
        dutyRate: parsedDutyRate,
        shippingCost: parsedShippingCost,
        fee: parsedFee,
        destination,
        shippingMode,
        userId: user?.id || guestUserId || "",
        pipelineVersion: PIPELINE_VERSION,
      }) + "_" + crypto.randomUUID();
      console.log(`[Analyze API] Rerun requested, generated unique input_key with nonce`);
    } else {
      inputKey = makeInputKey({
        imageHash,
        barcodeHash: barcodeHash || "",
        labelHash: labelHash || "",
        quantity: parsedQuantity,
        dutyRate: parsedDutyRate,
        shippingCost: parsedShippingCost,
        fee: parsedFee,
        destination,
        shippingMode,
        userId: user?.id || guestUserId || "",
        pipelineVersion: PIPELINE_VERSION,
      });
    }
    
    console.log(`[Analyze API] Generated input_key: ${inputKey.substring(0, 16)}...`);
    
    // Check if a report with this input_key already exists (idempotency)
    // Only check for authenticated users, and only reuse if user owns the report
    if (!rerun && user) {
      const { data: existingReport, error: existingError } = await supabase
        .from("reports")
        .select("id, status, product_name, user_id")
        .eq("input_key", inputKey)
        .eq("user_id", user.id) // Only find reports owned by this user
        .maybeSingle();
      
      if (!existingError && existingReport) {
        // Double-check ownership (defense in depth)
        if (existingReport.user_id !== user.id) {
          console.log(`[Analyze API] Found existing report but user mismatch, creating new report`);
          // Continue to create new report below
        } else {
          const status = existingReport.status as string;
          console.log(`[Analyze API] Found existing report with input_key=${inputKey.substring(0, 16)}..., status=${status}, reportId=${existingReport.id}`);
          
          // If already processing or queued, return the existing report
          if (status === "processing" || status === "queued") {
            console.log(`[Analyze API] Report already ${status}, returning existing reportId without starting new pipeline`);
            return NextResponse.json({
              ok: true,
              reportId: existingReport.id,
              reused: true,
              status,
              message: `Analysis already ${status}. Redirecting to existing report.`,
            });
          }
          
          // If completed, return the existing report (user can use rerun=true to force new analysis)
          if (status === "completed") {
            console.log(`[Analyze API] Report already completed, returning existing reportId (use rerun=true to force new analysis)`);
            return NextResponse.json({
              ok: true,
              reportId: existingReport.id,
              reused: true,
              status,
              message: "Analysis already completed. Redirecting to existing report.",
            });
          }
          
          // If failed, allow reprocessing by continuing (don't return)
          console.log(`[Analyze API] Report previously failed, allowing reprocessing`);
        }
      }
    }
    
    // If user is not logged in, always create a new report (never reuse)
    // Guest users should not be able to run analysis (checked in AnalyzeForm)
    // But if they somehow get here, create report with user_id = null
    if (!user) {
      console.log(`[Analyze API] No user - creating new report with user_id = null`);
    }

    // Upload images to the uploads bucket with user-scoped paths
    // For guest users, use temporary storage or skip storage (return data URLs)
    const uploadImage = async (file: File, prefix: string) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileExt = file.name?.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = file.type || "image/jpeg";
      
      // For guest users, skip upload and use data URL directly (RLS policy prevents upload)
      if (!user) {
        console.log("[Analyze API] Guest user - using data URL instead of storage upload");
        const base64 = buffer.toString("base64");
        return `data:${mimeType};base64,${base64}`;
      }
      
      // Authenticated users: upload to storage
      const userIdForPath = user.id;
      const storagePath = `${userIdForPath}/${prefix}-${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(storagePath, buffer, {
          contentType: mimeType,
        });

      if (uploadError) {
        // If upload fails (e.g., RLS policy issue), fallback to data URL
        const errorMsg = uploadError?.message || String(uploadError);
        const isRLSError = errorMsg?.toLowerCase().includes("row-level security") || 
                          errorMsg?.toLowerCase().includes("permission") ||
                          uploadError?.status === 403;
        
        if (isRLSError) {
          console.warn("[Analyze API] Storage upload failed due to RLS policy, using data URL fallback:", errorMsg);
          const base64 = buffer.toString("base64");
          return `data:${mimeType};base64,${base64}`;
        }
        
        // For other errors, log and throw
        console.error("[Analyze API] Upload failed for authenticated user:", uploadError.message);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(storagePath);
      return publicUrlData?.publicUrl || storagePath;
    };

    let productImageUrl: string;
    let barcodeImageUrl: string | null = null;
    let labelImageUrl: string | null = null;
    let extra1ImageUrl: string | null = null;
    let extra2ImageUrl: string | null = null;

    try {
      console.log("[Analyze API] Starting image uploads...", {
        hasProduct: !!imageFile,
        hasBarcode: !!barcodeFile,
        hasLabel: !!labelFile,
        hasExtra1: !!extra1File,
        hasExtra2: !!extra2File,
        userId: user?.id || "guest",
      });
      
      const uploadPromises = [uploadImage(imageFile, "product")];
      if (barcodeFile) uploadPromises.push(uploadImage(barcodeFile, "barcode"));
      if (labelFile) uploadPromises.push(uploadImage(labelFile, "label"));
      
      const uploadResults = await Promise.all(uploadPromises);
      productImageUrl = uploadResults[0];
      if (barcodeFile) barcodeImageUrl = uploadResults[1] || null;
      if (labelFile) labelImageUrl = uploadResults[barcodeFile ? 2 : 1] || null;

      console.log("[Analyze API] Main images uploaded successfully");

      // Upload optional images if present
      if (extra1File) {
        extra1ImageUrl = await uploadImage(extra1File, "extra1");
      }
      if (extra2File) {
        extra2ImageUrl = await uploadImage(extra2File, "extra2");
      }
      
      console.log("[Analyze API] All images uploaded successfully");
    } catch (uploadError: any) {
      const errorMsg = uploadError?.message || String(uploadError);
      const missingBucket =
        errorMsg?.toLowerCase().includes("bucket") || uploadError?.status === 404;
      const forbidden = uploadError?.status === 403 || errorMsg?.toLowerCase().includes("row-level security") || errorMsg?.toLowerCase().includes("permission");
      const message = missingBucket
        ? "Uploads storage bucket is missing. Create a private bucket named 'uploads' in Supabase Storage and retry."
        : forbidden
          ? "Access to the uploads bucket is blocked. Check Storage RLS policies for authenticated users."
          : errorMsg || "Image upload failed";

      console.error("[Analyze API] Upload failed:", {
        message: errorMsg,
        status: uploadError?.status,
        code: uploadError?.code,
        details: uploadError?.details,
        fullError: uploadError,
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: missingBucket ? "BUCKET_NOT_FOUND" : forbidden ? "STORAGE_FORBIDDEN" : "UPLOAD_FAILED",
          message,
          details: process.env.NODE_ENV === "development" ? errorMsg : undefined,
        },
        { status: missingBucket ? 503 : forbidden ? 403 : 500 }
      );
    }

    const uploadFlags = {
      productPhotoUploaded: true,
      barcodePhotoUploaded: !!barcodeFile,
      labelPhotoUploaded: !!labelFile,
      hasBarcodeImage: !!barcodeFile,
      hasLabelImage: !!labelFile,
    };

    // Create placeholder report row before pipeline runs (for both authenticated and guest users)
    if (user) {
      // Ensure user profile exists before creating report
      // Use admin client to bypass RLS policies
      const { data: existingProfile, error: profileError } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      
      if (!existingProfile && !profileError) {
        // Profile doesn't exist, create it using admin client
        console.log("[Analyze API] Creating missing profile for user:", user.id);
        const { error: createProfileError } = await admin
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email || "",
            role: "user",
          });
        
        if (createProfileError) {
          console.error("[Analyze API] Failed to create profile:", {
            message: createProfileError.message,
            code: createProfileError.code,
            details: createProfileError.details,
            hint: createProfileError.hint,
          });
          return NextResponse.json(
            {
              ok: false,
              error: "PROFILE_CREATION_FAILED",
              message: "Failed to create user profile. Please try again.",
              details: process.env.NODE_ENV === "development" ? createProfileError.message : undefined,
            },
            { status: 500 }
          );
        }
        console.log("[Analyze API] Profile created successfully");
      } else if (profileError) {
        console.error("[Analyze API] Error checking profile:", profileError.message);
        return NextResponse.json(
          {
            ok: false,
            error: "PROFILE_CHECK_FAILED",
            message: "Failed to verify user profile. Please try again.",
            details: process.env.NODE_ENV === "development" ? profileError.message : undefined,
          },
          { status: 500 }
        );
      }
    }
    
    // Create report data (user_id is null for guest users)
    const reportData = {
      user_id: user ? user.id : null,
      input_key: inputKey,
      product_name: "Pending analysis",
      category: "pending",
      confidence: "low",
      status: "processing",
      image_url: productImageUrl, // Main product image for backward compatibility
      signals: {},
      baseline: {},
      data: {
        product_image_url: productImageUrl,
        barcode_image_url: barcodeImageUrl,
        label_image_url: labelImageUrl,
        extra_image_url_1: extra1ImageUrl,
        extra_image_url_2: extra2ImageUrl,
        ...uploadFlags,
        inputStatus: {
          ...uploadFlags,
          unitsPerCase: 1,
        },
      },
      pipeline_result: { 
        queued: true, 
        productImagePath: productImageUrl,
        barcodeImagePath: barcodeImageUrl,
        labelImagePath: labelImageUrl,
        extra1ImagePath: extra1ImageUrl,
        extra2ImagePath: extra2ImageUrl,
        uploadAudit: uploadFlags,
      },
      schema_version: 1,
    };
    
    // Use admin client for both authenticated and guest users to ensure report creation succeeds
    // For authenticated users, try regular client first, then fallback to admin
    // For guest users, use admin client directly
    let upsertedReport: any = null;
    let upsertError: any = null;
    
    if (user) {
      // Try upsert with conflict handling on input_key (authenticated users)
      const { data: upserted, error: upsertErr } = await supabase
        .from("reports")
        .upsert(reportData, {
          onConflict: "input_key",
          ignoreDuplicates: false, // Update the existing row
        })
        .select("id, status")
        .single();
      
      upsertedReport = upserted;
      upsertError = upsertErr;
    }
    
    // If regular client failed or user is guest, use admin client
    if (upsertError || !user) {
      if (upsertError) {
        console.warn("[Analyze API] Regular client failed, trying admin client as fallback");
      } else {
        console.log("[Analyze API] Guest user - creating report with user_id = null using admin client");
      }
      
      try {
        const { data: adminUpserted, error: adminError } = await admin
          .from("reports")
          .upsert(reportData, {
            onConflict: "input_key",
            ignoreDuplicates: false,
          })
          .select("id, status")
          .single();
        
        if (!adminError && adminUpserted) {
          upsertedReport = adminUpserted;
          upsertError = null;
          console.log(`[Analyze API] Admin client succeeded: ${adminUpserted.id}`);
        } else {
          upsertError = adminError;
          console.error("[Analyze API] Admin client also failed:", adminError?.message);
        }
      } catch (adminFallbackError: any) {
        upsertError = adminFallbackError;
        console.error("[Analyze API] Admin fallback also failed:", adminFallbackError);
      }
    }
    
    if (upsertError) {
      // If upsert fails, try to fetch existing report (only for authenticated users)
      if (user) {
        console.error("[Analyze API] Upsert failed, attempting to fetch existing report", {
          error: upsertError.message,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint,
        });
        
        const { data: existingReport, error: fetchError } = await supabase
          .from("reports")
          .select("id, status")
          .eq("input_key", inputKey)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (!fetchError && existingReport) {
          console.log(`[Analyze API] Found existing report after upsert conflict: reportId=${existingReport.id}, status=${existingReport.status}`);
          
          // Check if it's already processing
          if (existingReport.status === "processing" || existingReport.status === "queued") {
            return NextResponse.json({
              ok: true,
              reportId: existingReport.id,
              reused: true,
              status: existingReport.status,
              message: `Analysis already ${existingReport.status}. Redirecting to existing report.`,
            });
          }
          
          // Use the existing report ID
          finalReportId = existingReport.id as string;
          console.log(`[Analyze API] Reusing existing report: ${finalReportId}`);
        } else {
          return NextResponse.json(
            { 
              ok: false, 
              error: "REPORT_INIT_FAILED", 
              message: upsertError.message || "Unable to create report",
              details: process.env.NODE_ENV === "development" ? {
                upsertError: upsertError.message,
                fetchError: fetchError?.message,
              } : undefined,
            },
            { status: 500 }
          );
        }
      } else {
        // For guest users, if report creation fails, return error
        return NextResponse.json(
          { 
            ok: false, 
            error: "REPORT_INIT_FAILED", 
            message: upsertError.message || "Unable to create report",
            details: process.env.NODE_ENV === "development" ? upsertError.message : undefined,
          },
          { status: 500 }
        );
      }
    } else {
      finalReportId = upsertedReport.id as string;
      console.log(`[Analyze API] Created/updated placeholder report: ${finalReportId}, input_key=${inputKey.substring(0, 16)}..., user_id=${user ? user.id : 'null'}`);
    }

    // ============================================================================
    // FAST MODE: Optional 3-second response with background upgrade
    // If ANALYZE_FAST_MODE=true, return partial report with fast facts only
    // Heavy analysis (supplier matching, HS inference) runs in background job
    // Skip for guest users (they get full results immediately)
    // ============================================================================
    if (true && finalReportId && user) {
      try {
        const requestId = crypto.randomUUID();
        console.log(`[Analyze API] FAST_MODE enabled, using 2-phase response (requestId: ${requestId})`);
        
        const fastResult = await createPartialReportAndQueueUpgrade({
          reportId: finalReportId,
          userId: user.id,
          imageDataUrl,
          barcodeDataUrl,
          labelDataUrl,
          requestId,
        });

        console.log(`[Analyze API] Fast mode completed in < 1s, returning partial report`, {
          reportId: finalReportId,
          status: "partial",
          phase: "fast_facts",
        });

        return NextResponse.json({
          ok: true,
          reportId: finalReportId,
          reused: false,
          status: "partial",
          phase: "fast_facts",
          message: "Fast facts extracted. Detailed analysis running in background.",
          facts: fastResult.facts,
          data: {
            productName: fastResult.facts.productName,
            category: fastResult.facts.category,
            barcode: fastResult.facts.barcode,
            netWeight: fastResult.facts.netWeight,
            keywords: fastResult.facts.keywords,
          },
        });
      } catch (fastModeError: any) {
        // If fast mode fails, log but continue with full pipeline
        console.warn(`[Analyze API] Fast mode failed, falling back to full pipeline: ${fastModeError.message}`);
        // Continue to full pipeline below
      }
    }

    // Run intelligence pipeline with request-scoped warnOnce
    let cacheWarningLogged = false;
    const warnOnce = (message: string) => {
      if (!cacheWarningLogged) {
        console.warn(message);
        cacheWarningLogged = true;
      }
    };
    
    // Note: The pipeline expects imageUrl, we pass the data URL
    console.log("[Analyze API] Starting intelligence pipeline...", {
      hasImage: !!imageDataUrl,
      imageSize: imageDataUrl?.length,
      hasBarcode: !!barcodeDataUrl,
      hasLabel: !!labelDataUrl,
      quantity: parsedQuantity,
      dutyRate: parsedDutyRate,
      shippingCost: parsedShippingCost,
      fee: parsedFee,
    });
    
    let result;
    try {
      result = await runIntelligencePipeline({
        imageUrl: imageDataUrl,
        imagePublicUrl: productImageUrl, // Pass product image URL for storage
        quantity: parsedQuantity,
        dutyRate: parsedDutyRate,
        shippingCost: parsedShippingCost,
        fee: parsedFee,
      }, warnOnce);
      console.log("[Analyze API] Pipeline completed successfully");
    } catch (pipelineError: any) {
      console.error("[Analyze API] Pipeline execution error:", {
        message: pipelineError?.message,
        stack: pipelineError?.stack,
        name: pipelineError?.name,
      });
      throw pipelineError; // Re-throw to be caught by outer catch block
    }

    // Build report from pipeline result
    // For guest users, use a temporary reportId
    const tempReportId = finalReportId || `guest_${crypto.randomUUID()}`;
    const report = buildReportFromPipeline({
      reportId: tempReportId,
      inputKey,
      pipeline: result,
    });

    // Compute label audit fields for transparency
    // label_uploaded: true because label is required in validation above
    const labelUploaded = !!labelFile;
    
    // Extract label OCR terms from pipeline result
    const extractedLabelTerms = (() => {
      const analysis = result?.analysis || {};
      const labelData = analysis.labelData || {};
      const ingredients = Array.isArray(labelData.ingredients) ? labelData.ingredients : [];
      const allergens = Array.isArray(labelData.allergens) ? labelData.allergens : [];
      return [...ingredients, ...allergens]
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim());
    })();
    
    // Determine OCR status and failure reason using heuristics
    // TODO: Improve heuristics with actual image analysis (brightness, blur detection, etc.)
    // For now, use simple term count and analysis confidence as proxy
    let labelOcrStatus: "SUCCESS" | "PARTIAL" | "FAILED";
    let labelOcrFailureReason: string | null = null;
    
    if (extractedLabelTerms.length >= 3) {
      labelOcrStatus = "SUCCESS";
    } else if (extractedLabelTerms.length > 0) {
      labelOcrStatus = "PARTIAL";
      labelOcrFailureReason = "LOW_CONTRAST"; // Generic guess for partial extraction
    } else {
      labelOcrStatus = "FAILED";
      // Heuristic guesses for failure reason (improve with actual image analysis)
      // Check if OCR returned any text at all
      const labelData = result?.analysis?.labelData as any;
      const ocrText = labelData?.rawText || labelData?.text || "";
      const hasNonLatinOnly = ocrText.length > 0 && !/[a-zA-Z]/.test(ocrText);
      
      if (hasNonLatinOnly) {
        labelOcrFailureReason = "NON_LATIN"; // Only if text exists without latin letters
      } else {
        // Generic fallbacks for empty OCR
        const analysisConfidence = result?.analysis?.confidence || 0;
        if (analysisConfidence < 0.3) {
          labelOcrFailureReason = "BLURRY";
        } else if (analysisConfidence < 0.5) {
          labelOcrFailureReason = "GLARE";
        } else {
          labelOcrFailureReason = "LOW_CONTRAST"; // Generic fallback
        }
      }
    }
    
    const labelTermsJson = JSON.stringify(extractedLabelTerms);
    const labelOcrCheckedAt = new Date().toISOString();
    
    // Vision Label Extraction Fallback: If OCR failed, try Gemini Vision
    let labelDraft: any = null;
    let labelExtractionSource: "OCR" | "VISION" | "MANUAL" | null = null;
    let labelExtractionStatus: "DRAFT" | "CONFIRMED" | null = null;
    let labelVisionExtractionAttempted = false;
    let labelVisionExtractionAt: string | null = null;

    // Initialize draftInference with category defaults
    const category = result?.analysis?.category || report.category || "product";
    let draftInference = createDefaultDraftInference(category);
    
    if (labelOcrStatus === "FAILED" && labelFile && labelDataUrl) {
      console.log("[Analyze API] OCR failed, attempting Vision label extraction...");
      labelVisionExtractionAttempted = true;
      labelVisionExtractionAt = new Date().toISOString();
      
      try {
        const geminiRequestIdLabel = crypto.randomUUID();
        const visionResult = await extractLabelWithVision(labelDataUrl, geminiRequestIdLabel);
        if (visionResult.success && visionResult.labelDraft) {
          labelDraft = visionResult.labelDraft;
          labelExtractionSource = "VISION";
          labelExtractionStatus = "DRAFT"; // Requires user confirmation
          console.log("[Analyze API] Vision extraction succeeded, draft created");

          draftInference.labelDraft = {
            originCountryDraft: { ...(labelDraft.originCountryDraft || { value: null, confidence: 0, evidenceSnippet: "Not visible" }), source: "VISION" },
            netWeightDraft: { ...(labelDraft.netWeightDraft || { value: null, confidence: 0, evidenceSnippet: "Not visible" }), source: "VISION" },
            allergensDraft: { ...(labelDraft.allergensDraft || { value: null, confidence: 0, evidenceSnippet: "Not visible" }), source: "VISION" },
            brandDraft: { ...(labelDraft.brandDraft || { value: null, confidence: 0, evidenceSnippet: "Not visible" }), source: "VISION" },
            productNameDraft: { ...(labelDraft.productNameDraft || { value: null, confidence: 0, evidenceSnippet: "Not visible" }), source: "VISION" },
          };
        } else {
          console.warn("[Analyze API] Vision extraction failed:", visionResult.error);
        }
      } catch (error: any) {
        console.error("[Analyze API] Vision extraction error:", error.message);
        warnings.push(`Label Vision extraction failed: ${error.message}`);
      }
    } else if (labelOcrStatus === "SUCCESS" || labelOcrStatus === "PARTIAL") {
      // OCR succeeded, mark as confirmed (legacy behavior)
      labelExtractionSource = "OCR";
      labelExtractionStatus = "CONFIRMED";
    }
    
    // Dev-only logging
    if (process.env.NODE_ENV === "development") {
      console.log("[Analyze API] Label audit:", {
        labelUploaded,
        labelOcrStatus,
        labelOcrFailureReason,
        termsCount: extractedLabelTerms.length,
        terms: extractedLabelTerms.slice(0, 3),
        visionAttempted: labelVisionExtractionAttempted,
        visionSuccess: !!labelDraft,
      });
    }

    // Gemini Inference: Extract all draft fields when values missing or low confidence
    const geminiRequestId = crypto.randomUUID(); // Shared request ID for all Gemini calls
    let barcodeDraft: any = null;
    let barcodeExtractionSource: "OCR" | "VISION" | "MANUAL" | "NONE" = "NONE";
    let barcodeExtractionStatus: "CONFIRMED" | "DRAFT" | "FAILED" | "NONE" = "NONE";
    let weightDraft: any = null;
    let casePackDraft: any = null;
    let customsCategoryDraft: any = null;
    let hsCandidatesDraft: any = null;
    
    // Extract barcode if not already from OCR
    const existingBarcode = result?.analysis?.barcode;
    if (!existingBarcode && barcodeDataUrl) {
      console.log("[Analyze API] Barcode not detected by OCR, attempting Vision extraction...");
      try {
        const barcodeResult = await extractBarcodeWithVision(barcodeDataUrl, geminiRequestId);
        if (barcodeResult.success && barcodeResult.barcodeDraft?.value) {
          barcodeDraft = barcodeResult.barcodeDraft;
          barcodeExtractionSource = "VISION";
          barcodeExtractionStatus = "DRAFT";
          console.log("[Analyze API] Barcode Vision extraction succeeded:", barcodeDraft.value);

          draftInference.barcodeDraft = {
            value: barcodeDraft.value,
            confidence: barcodeDraft.confidence ?? 0.6,
            evidenceSnippet: barcodeDraft.evidenceSnippet || "Vision extracted",
            source: "VISION",
          };
        } else {
          barcodeExtractionStatus = "FAILED";
          draftInference.barcodeDraft = {
            value: null,
            confidence: 0,
            evidenceSnippet: "barcode not readable",
            source: "DEFAULT",
          };
        }
      } catch (error: any) {
        console.error("[Analyze API] Barcode Vision extraction error:", error.message);
        warnings.push(`Barcode Vision extraction failed: ${error.message}`);
        barcodeExtractionStatus = "FAILED";
        draftInference.barcodeDraft = {
          value: null,
          confidence: 0,
          evidenceSnippet: "barcode not readable",
          source: "DEFAULT",
        };
      }
    } else if (existingBarcode) {
      // Barcode already extracted by OCR, mark as confirmed
      barcodeExtractionSource = "OCR";
      barcodeExtractionStatus = "CONFIRMED";
    }

    // Sync barcode back into pipeline analysis so downstream signals reflect vision success
    if (barcodeDraft?.value && result?.analysis && !result.analysis.barcode) {
      result.analysis.barcode = barcodeDraft.value;
    }
    
    // Infer weight from photos if not in labelDraft or report
    const existingWeight = result?.analysis?.weight || labelDraft?.net_weight_value?.value;
    if (!existingWeight && imageDataUrl) {
      console.log("[Analyze API] Weight not found, attempting Vision inference...");
      try {
        const weightResult = await inferUnitWeightFromPhoto(imageDataUrl, labelDataUrl || undefined, geminiRequestId);
        if (weightResult.success && weightResult.weightDraft?.value) {
          weightDraft = weightResult.weightDraft;
          console.log("[Analyze API] Weight inference succeeded:", weightDraft.value, weightDraft.unit);

          draftInference.weightDraft = {
            value: weightDraft.value,
            unit: weightDraft.unit || "g",
            confidence: weightDraft.confidence ?? 0.6,
            evidenceSnippet: weightDraft.evidenceSnippet || "Vision estimate",
            source: "VISION",
          };
        } else {
          throw new Error("Weight inference returned no value");
        }
      } catch (error: any) {
        console.error("[Analyze API] Weight inference error:", error.message);
        warnings.push(`Weight inference failed: ${error.message}`);
        
        // Fall back to category defaults (e.g., candy = 25g)
        const categoryLower = result?.analysis?.category?.toLowerCase() || "";
        let defaultWeight = 25;
        let defaultUnit = "g";
        
        if (categoryLower.includes("candy") || categoryLower.includes("chocolate")) {
          defaultWeight = 25;
        } else if (categoryLower.includes("beverage") || categoryLower.includes("drink")) {
          defaultWeight = 250;
          defaultUnit = "ml";
        } else if (categoryLower.includes("snack")) {
          defaultWeight = 30;
        } else if (categoryLower.includes("supplement")) {
          defaultWeight = 5;
        }
        
        weightDraft = {
          value: defaultWeight,
          unit: defaultUnit,
          confidence: 0.25,
          evidenceSnippet: `Default category assumption (${result?.analysis?.category || "unknown"})`
        };
        console.log("[Analyze API] Weight inference failed, using category default:", weightDraft);

        draftInference.weightDraft = {
          value: defaultWeight,
          unit: defaultUnit,
          confidence: weightDraft.confidence,
          evidenceSnippet: weightDraft.evidenceSnippet,
          source: "DEFAULT",
        };
      }
    }

    // Merge late extraction signals (barcode/label/weight) back into pipeline signals
    try {
      const analysisLabel = result?.analysis?.labelData || {};
      const labelTerms = Array.isArray(result?.analysis?.keywords) ? result.analysis.keywords : [];

      const labelNetWeight = typeof analysisLabel.netWeight === "string"
        ? parseFloat(analysisLabel.netWeight)
        : analysisLabel.netWeight;

      const mergedSignals = buildSignalsFromUploads({
        barcodeExtraction: result?.analysis?.barcode
          ? { upc: result.analysis.barcode, rawText: result.analysis.barcode, success: true }
          : undefined,
        barcodeVisionResult: barcodeDraft?.value
          ? { upc: barcodeDraft.value, success: true }
          : undefined,
        labelExtraction: labelExtractionSource === "OCR" && (analysisLabel.brand || analysisLabel.netWeight || analysisLabel.origin)
          ? {
              terms: labelTerms,
              brand: analysisLabel.brand,
              model: analysisLabel.model,
              netWeightG: labelNetWeight,
              origin: analysisLabel.origin,
              warnings: analysisLabel.warnings,
              materials: analysisLabel.materials,
              unitCount: analysisLabel.unitCount,
              success: true,
            }
          : undefined,
        labelVisionResult: labelExtractionSource === "VISION" && labelDraft
          ? {
              terms: labelTerms,
              brand: labelDraft.brandDraft?.value,
              model: labelDraft.productNameDraft?.value,
              netWeightG: labelDraft.netWeightDraft?.value,
              origin: labelDraft.originCountryDraft?.value,
              warnings: labelDraft.allergensDraft?.value,
              materials: undefined,
              unitCount: undefined,
              success: true,
            }
          : undefined,
        visionTags: result?.analysis?.keywords || [],
        weightInferenceG: weightDraft?.value || result?.analysis?.weight || undefined,
        step1Keywords: result?.analysis?.keywords || [],
      });

      result.productSignals = mergedSignals.signals;
      result.productSignalEvidence = mergedSignals.evidence;
      // If signals now exist but pipeline flagged no_signals, downgrade to no_matches for UI clarity
      if (result.supplierEmptyReason === "no_signals" && mergedSignals.signals && Object.keys(mergedSignals.signals).length > 0) {
        result.supplierEmptyReason = "no_matches";
      }
    } catch (signalMergeError: any) {
      console.warn("[Analyze API] Failed to merge product signals:", signalMergeError?.message || signalMergeError);
    }
    
    // Infer case pack from box photo or propose candidates
    // Check if extra1 or extra2 might be a box image (heuristic: look for larger dimensions)
    let boxImageUrl: string | null = null;
    if (extra1File) {
      // Assume extra1 is box for now (could improve with image classification)
      boxImageUrl = extra1DataUrl;
    }
    
    console.log("[Analyze API] Inferring case pack...");
    const productCategory = result?.analysis?.category || "generic";
    
    // Initialize with defaults first to prevent undefined crash
    casePackDraft = {
      candidates: [
        { value: 12, confidence: 0.4, evidenceSnippet: "Common case pack for this category" },
        { value: 24, confidence: 0.3, evidenceSnippet: "Alternative case pack for this category" },
      ],
      chosen: null,
      confirmed: false,
    };
    
    try {
      const casePackResult = await inferUnitsPerCaseFromBox(boxImageUrl, result.productName, productCategory, geminiRequestId);
      if (casePackResult.success && casePackResult.casePackDraft) {
        // Only override if we got valid results
        if (casePackResult.casePackDraft.candidates && Array.isArray(casePackResult.casePackDraft.candidates)) {
          casePackDraft = casePackResult.casePackDraft;
          console.log("[Analyze API] Case pack inference succeeded, candidates:", casePackDraft.candidates?.length);

          draftInference.casePackDraft = {
            candidates: casePackDraft.candidates.map((c: any) => ({
              value: c.value,
              confidence: c.confidence ?? 0.5,
              evidenceSnippet: c.evidenceSnippet || "Vision or heuristic",
              source: c.source || "VISION",
            })),
            selectedValue: casePackDraft.chosen || casePackDraft.selectedValue || null,
            selectedConfidence: casePackDraft.selectedConfidence || null,
          };
        } else {
          console.log("[Analyze API] Case pack inference returned invalid candidates, using defaults");
        }
      } else {
        console.log("[Analyze API] Case pack inference failed, using default candidates");
      }
    } catch (error: any) {
      console.error("[Analyze API] Case pack inference error:", error.message);
      warnings.push(`Case pack inference failed: ${error.message}`);
      // casePackDraft already initialized with defaults above
    }

    // Ensure draftInference mirrors final casePackDraft state
    if (casePackDraft && casePackDraft.candidates) {
      draftInference.casePackDraft = {
        candidates: casePackDraft.candidates.map((c: any) => ({
          value: c.value,
          confidence: c.confidence ?? 0.5,
          evidenceSnippet: c.evidenceSnippet || "Default assumption",
          source: c.source || "DEFAULT",
        })),
        selectedValue: casePackDraft.chosen || casePackDraft.selectedValue || null,
        selectedConfidence: casePackDraft.selectedConfidence || null,
      };
    }
    
    // Infer customs category from product name and category
    console.log("[Analyze API] Inferring customs category and HS codes...");
    try {
      const customsResult = await inferCustomsAndHS(
        result.productName,
        category,
        labelDraft?.country_of_origin?.value || undefined,
        labelDraft?.net_weight_value?.value ? String(labelDraft.net_weight_value.value) : undefined,
        geminiRequestId
      );
      if (customsResult.success && customsResult.customsCategoryDraft) {
        customsCategoryDraft = customsResult.customsCategoryDraft;
        hsCandidatesDraft = customsResult.hsCandidatesDraft;
        console.log("[Analyze API] Customs/HS inference succeeded:", customsCategoryDraft?.value, hsCandidatesDraft?.length);

        draftInference.customsCategoryDraft = {
          value: customsCategoryDraft?.value || null,
          confidence: customsCategoryDraft?.confidence ?? 0.5,
          evidenceSnippet: customsCategoryDraft?.rationale || customsCategoryDraft?.evidenceSnippet || "LLM reasoning",
          source: customsCategoryDraft?.source || "REASONING",
        };
        draftInference.hsCandidatesDraft = {
          candidates: (hsCandidatesDraft || []).map((c: any) => ({
            hsCode: c.hsCode || c.code,
            confidence: c.confidence ?? 0.4,
            rationale: c.rationale || c.reason || c.evidenceSnippet || "Reasoning",
            source: c.source || "REASONING",
          })),
        };
      } else {
        console.log("[Analyze API] Customs/HS inference returned no results");
      }
    } catch (error: any) {
      console.error("[Analyze API] Customs/HS inference error:", error.message);
      warnings.push(`Customs/HS inference failed: ${error.message}`);
      // Leave as null, UI will handle gracefully
    }
    
    const buildDefaultWeightDraft = () => {
      const categoryLower = (result?.analysis?.category || "unknown").toLowerCase();
      if (categoryLower.includes("candy") || categoryLower.includes("chocolate")) {
        return { value: 25, unit: "g", confidence: 0.25, evidenceSnippet: "Category default (candy)", source: "DEFAULT" };
      }
      if (categoryLower.includes("snack")) {
        return { value: 30, unit: "g", confidence: 0.25, evidenceSnippet: "Category default (snack)", source: "DEFAULT" };
      }
      if (categoryLower.includes("beverage") || categoryLower.includes("drink")) {
        return { value: 250, unit: "g", confidence: 0.2, evidenceSnippet: "Assumed 1g/ml beverage", source: "DEFAULT" };
      }
      if (categoryLower.includes("fan") || categoryLower.includes("electronic")) {
        return { value: 400, unit: "g", confidence: 0.2, evidenceSnippet: "Category default (electronics)", source: "DEFAULT" };
      }
      return { value: 50, unit: "g", confidence: 0.2, evidenceSnippet: "Category default", source: "DEFAULT" };
    };

    // Normalize weightDraft: always numeric grams
    (() => {
      const weight = draftInference.weightDraft;
      const fallback = buildDefaultWeightDraft();
      if (!weight || weight.value === null || weight.value === undefined || Number.isNaN(Number(weight.value))) {
        draftInference.weightDraft = fallback;
        return;
      }
      let numeric = Number(weight.value);
      const unit = (weight.unit || "g").toLowerCase();
      if (unit.includes("kg")) {
        numeric = numeric * 1000;
      }
      draftInference.weightDraft = {
        value: numeric,
        unit: "g",
        confidence: weight.confidence ?? 0.5,
        evidenceSnippet: weight.evidenceSnippet || "Vision estimate",
        source: weight.source || "DEFAULT",
      };
    })();

    // Normalize casePackDraft: ensure at least two numeric candidates
    (() => {
      const candidates = draftInference.casePackDraft?.candidates || [];
      const normalized = candidates
        .filter((c: any) => c && c.value !== undefined && c.value !== null)
        .map((c: any) => ({
          value: Number(c.value),
          confidence: c.confidence ?? 0.5,
          evidenceSnippet: c.evidenceSnippet || "Default assumption",
          source: c.source || "DEFAULT",
        }));

      while (normalized.length < 2) {
        const seed = normalized.length === 0 ? 12 : 24;
        normalized.push({ value: seed, confidence: 0.3, evidenceSnippet: "Default candidate", source: "DEFAULT" });
      }

      const selectedValue = draftInference.casePackDraft?.selectedValue ?? draftInference.casePackDraft?.chosen ?? normalized[0]?.value ?? null;
      const selectedConfidence = draftInference.casePackDraft?.selectedConfidence ?? normalized.find((c: any) => c.value === selectedValue)?.confidence ?? null;
      draftInference.casePackDraft = {
        candidates: normalized,
        selectedValue,
        selectedConfidence,
      };
    })();

    if (!draftInference.customsCategoryDraft) {
      draftInference.customsCategoryDraft = {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not inferred",
        source: "DEFAULT",
      };
    }

    if (!draftInference.hsCandidatesDraft) {
      draftInference.hsCandidatesDraft = { candidates: [] };
    }

    // Initialize critical_confirm with draft values from labelDraft if available
    const criticalConfirm: any = {
      originCountry: labelDraft?.country_of_origin ? {
        value: labelDraft.country_of_origin.value,
        confirmed: false,
        source: "VISION" as const,
        confidence: labelDraft.country_of_origin.confidence,
        evidenceSnippet: labelDraft.country_of_origin.evidence,
      } : { value: null, confirmed: false, source: "NONE" as const, confidence: 0, evidenceSnippet: null },
      netWeight: (labelDraft?.net_weight_value?.value && labelDraft?.net_weight_unit?.value) ? {
        value: `${labelDraft.net_weight_value.value} ${labelDraft.net_weight_unit.value}`,
        confirmed: false,
        source: "VISION" as const,
        confidence: Math.min(labelDraft.net_weight_value.confidence, labelDraft.net_weight_unit.confidence),
        evidenceSnippet: labelDraft.net_weight_value.evidence,
      } : { value: null, confirmed: false, source: "NONE" as const, confidence: 0, evidenceSnippet: null },
      allergens: labelDraft?.allergens_list?.value ? {
        value: Array.isArray(labelDraft.allergens_list.value) 
          ? labelDraft.allergens_list.value.join(", ") 
          : labelDraft.allergens_list.value,
        confirmed: false,
        source: "VISION" as const,
        confidence: labelDraft.allergens_list.confidence,
        evidenceSnippet: labelDraft.allergens_list.evidence,
      } : { value: null, confirmed: false, source: "NONE" as const, confidence: 0, evidenceSnippet: null },
    };
    
    // Determine compliance status based on critical fields confirmed
    let complianceStatus: "INCOMPLETE" | "PRELIMINARY" = "INCOMPLETE";
    const complianceNotes: Array<{level: "info" | "warn", text: string}> = [];
    
    const hasAllCriticalDrafts = criticalConfirm.originCountry.value && 
                                  criticalConfirm.netWeight.value && 
                                  criticalConfirm.allergens.value;
    const allConfirmed = criticalConfirm.originCountry.confirmed && 
                         criticalConfirm.netWeight.confirmed && 
                         criticalConfirm.allergens.confirmed;
    
    if (allConfirmed) {
      // All 3 confirmed - still treat as preliminary to avoid claiming completion
      complianceStatus = "PRELIMINARY";
      complianceNotes.push({ level: "info", text: "Critical fields verified by user. Compliance remains in draft until NexSupply verifies." });
    } else if (hasAllCriticalDrafts) {
      complianceStatus = "INCOMPLETE";
      complianceNotes.push({ 
        level: "warn", 
        text: "Critical fields extracted but not confirmed. Verify origin, weight, and allergens to complete compliance check." 
      });
    } else {
      complianceStatus = "INCOMPLETE";
      complianceNotes.push({ 
        level: "warn", 
        text: "Missing critical compliance data. Confirm origin, net weight, and allergens to proceed." 
      });
    }

    // ImportKey gating decision: determine whether to attempt external trade data
    const evidenceSource = result.marketEstimate?.evidenceSource || "llm_baseline";
    const similarCount = result.marketEstimate?.similarRecordsCount || 0;
    const confidenceTier = report.confidence; // low | medium | high

    const shouldSkipExternal = evidenceSource === "internal_records" && (confidenceTier === "medium" || confidenceTier === "high");
    const shouldAttemptExternal = !shouldSkipExternal && (evidenceSource === "llm_baseline" || (similarCount < 5 && confidenceTier === "low"));
    
    // Track attempt and result count from provider
    const externalTradeDataAttempted = shouldAttemptExternal;
    
    // For now: result_count would be set after calling ImportKey/provider
    // This is a placeholder - in practice, you'd call the provider and count results
    const externalTradeDataResultCount = shouldAttemptExternal ? 0 : null; // 0 for now (no provider call implemented)
    
    // Used only if attempted AND we got results to incorporate
    const usedExternalTradeData = externalTradeDataAttempted && externalTradeDataResultCount && externalTradeDataResultCount > 0;
    
    // Determine reason code
    let externalTradeDataReason: string;
    if (shouldSkipExternal) {
      externalTradeDataReason = "SKIP_INTERNAL_CONFIDENT";
    } else if (externalTradeDataAttempted && externalTradeDataResultCount === 0) {
      externalTradeDataReason = "USED_NO_RESULTS";
    } else if (externalTradeDataAttempted && usedExternalTradeData) {
      externalTradeDataReason = "USED_LOW_EVIDENCE";
    } else {
      externalTradeDataReason = "SKIP_NO_MATCH";
    }

    // Prepare pipeline_result for storage (remove imageUrl to prevent data explosion)
    // SAFETY: Ensure draftInference is complete with all required fields
    const completeDraftInference = {
      labelDraft: draftInference?.labelDraft || {
        originCountryDraft: { value: null, confidence: 0, evidenceSnippet: "Not extracted", source: "DEFAULT" },
        netWeightDraft: { value: null, confidence: 0, evidenceSnippet: "Not extracted", source: "DEFAULT" },
        allergensDraft: { value: null, confidence: 0, evidenceSnippet: "Not extracted", source: "DEFAULT" },
        brandDraft: { value: null, confidence: 0, evidenceSnippet: "Not extracted", source: "DEFAULT" },
        productNameDraft: { value: null, confidence: 0, evidenceSnippet: "Not extracted", source: "DEFAULT" },
      },
      barcodeDraft: draftInference?.barcodeDraft || {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not captured",
        source: "DEFAULT",
      },
      weightDraft: draftInference?.weightDraft || {
        value: 50,
        unit: "g",
        confidence: 0,
        evidenceSnippet: "Fallback default weight",
        source: "DEFAULT",
      },
      casePackDraft: draftInference?.casePackDraft || {
        candidates: [
          { value: 12, confidence: 0.3, evidenceSnippet: "Default candidate" },
          { value: 24, confidence: 0.2, evidenceSnippet: "Default candidate" },
        ],
        selectedValue: null,
        selectedConfidence: null,
      },
      customsCategoryDraft: draftInference?.customsCategoryDraft || {
        value: null,
        confidence: 0,
        evidenceSnippet: "Not inferred",
        source: "DEFAULT",
      },
      hsCandidatesDraft: draftInference?.hsCandidatesDraft || {
        candidates: [],
      },
    };

    const sanitizedPipelineResult = {
      ...result,
      draftInference: completeDraftInference,
      // Remove imageUrl (data URL can be huge)
      analysis: result.analysis ? {
        ...result.analysis,
        // Keep only essential fields, remove imageUrl if present
      } : undefined,
      // Store imageHash and all image paths
      imageHash,
      productImagePath: productImageUrl,
      barcodeImagePath: barcodeImageUrl,
      labelImagePath: labelImageUrl,
      extra1ImagePath: extra1ImageUrl,
      extra2ImagePath: extra2ImageUrl,
      // Embed label audit for UI fallback when DB columns missing
      label_audit: {
        labelUploaded,
        labelOcrStatus,
        labelOcrFailureReason,
        labelTerms: extractedLabelTerms,
        labelOcrCheckedAt,
      },
      uploadAudit: uploadFlags,
    };
    // Explicitly remove imageUrl from analysis if it exists
    if (sanitizedPipelineResult.analysis && 'imageUrl' in sanitizedPipelineResult.analysis) {
      delete (sanitizedPipelineResult.analysis as any).imageUrl;
    }

    // Resolve unit weight before normalizing evidence
    let unitWeightResult = null;
    try {
      // Get label text from various sources
      const labelText = extractedLabelTerms?.join(" ") || 
        labelData?.rawText || 
        labelData?.text ||
        (report as any).labelText || 
        (report as any).data?.labelText || 
        (report as any).pipeline_result?.labelText ||
        (report as any).baseline?.evidence?.labelText ||
        null;
      
      // Get image URLs (use public URLs if available, otherwise data URLs)
      const productImagePublicUrl = productImageUrl || null;
      const labelImagePublicUrl = labelImageUrl || null;
      
      unitWeightResult = await resolveUnitWeight({
        reportId: finalReportId,
        inputStatus: {
          ...(report as any).inputStatus,
          ...uploadFlags,
        },
        labelText,
        productImageUrl: productImagePublicUrl,
        labelImageUrl: labelImagePublicUrl,
        category: report.category,
        productName: report.productName || result?.analysis?.productName,
        baseline: report.baseline,
      });
      
      // Store in report data
      if (!(report as any).data) {
        (report as any).data = {};
      }
      if (!(report as any).data._inputs) {
        (report as any).data._inputs = {};
      }
      (report as any).data._inputs.unitWeight = unitWeightResult;
      
      console.log("[Analyze API] Unit weight resolved:", {
        grams: unitWeightResult.grams,
        source: unitWeightResult.source,
        confidence: unitWeightResult.confidence,
      });
    } catch (error) {
      console.warn("[Analyze API] Failed to resolve unit weight:", error);
    }

    const normalizedEvidence = normalizeEvidence({
      ...(report as any),
      pipeline_result: sanitizedPipelineResult,
      uploadAudit: uploadFlags,
      data: { ...(report as any).data, uploadAudit: uploadFlags },
      inputStatus: {
        ...(report as any).inputStatus,
        ...uploadFlags,
        barcode: (report as any).inputStatus?.barcode || result?.analysis?.barcode || null,
        labelOcrStatus,
        labelOcrFailureReason,
        unitsPerCase: 1,
      },
    });

    // Update report with pipeline outputs (for both authenticated and guest users)
    // Use admin client to ensure update succeeds even with RLS policies
    if (!finalReportId) {
      console.error("[Analyze API] Cannot update report: finalReportId is null");
      return NextResponse.json(
        {
          ok: false,
          error: "REPORT_ID_MISSING",
          message: "Report ID is missing. Please try again.",
        },
        { status: 500 }
      );
    }

    // Attach supplier matches to report for decision summary computation
    // Use the same structure as hydration expects
    (report as any)._supplierMatches = result.recommendedSuppliers.concat(result.candidateSuppliers).map((match) => ({
      id: match.supplierId,
      supplierId: match.supplierId,
      supplier_id: match.supplierId,
      exact_match_count: match.isInferred === false ? 1 : 0,
      inferred_match_count: match.isInferred === true ? 1 : 0,
    }));
    (report as any)._recommendedMatches = result.recommendedSuppliers.map((match) => ({
      id: match.supplierId,
      supplierId: match.supplierId,
      supplier_id: match.supplierId,
      exact_match_count: match.isInferred === false ? 1 : 0,
      inferred_match_count: match.isInferred === true ? 1 : 0,
    }));
    (report as any)._candidateMatches = result.candidateSuppliers.map((match) => ({
      id: match.supplierId,
      supplierId: match.supplierId,
      supplier_id: match.supplierId,
      exact_match_count: match.isInferred === false ? 1 : 0,
      inferred_match_count: match.isInferred === true ? 1 : 0,
    }));
    
    // Compute decision summary from pipeline outputs
    const decisionSummary = computeDecisionSummary(report, sanitizedPipelineResult);
    
    // Build V2 snapshot for resilience (if match table read fails, UI can use snapshot)
    const v2Snapshot: any = {
      _supplierMatches: result.recommendedSuppliers.concat(result.candidateSuppliers).map((match) => ({
        id: match.supplierId,
        supplierId: match.supplierId,
        supplier_id: match.supplierId,
        supplierName: match.supplierName,
        supplier_name: match.supplierName,
        exact_match_count: match.isInferred === false ? 1 : 0,
        inferred_match_count: match.isInferred === true ? 1 : 0,
        _intel: {
          product_count: match.evidence?.recordCount || 0,
          price_coverage_pct: 0,
          last_seen_days: match.evidence?.lastSeenDays ?? null,
        },
        _profile: {
          country: match.country || null,
          last_seen_date: match.evidence?.lastShipmentDate || null,
          shipment_count_12m: match.evidence?.recordCount || null,
          role: match.supplierType || null,
          role_reason: match.matchReason || null,
        },
        _supplierType: match.supplierType || null,
        _companyType: null,
        _exampleProducts: [],
      })),
      _recommendedMatches: result.recommendedSuppliers.map((match) => ({
        id: match.supplierId,
        supplierId: match.supplierId,
        supplier_id: match.supplierId,
        supplierName: match.supplierName,
        supplier_name: match.supplierName,
        exact_match_count: match.isInferred === false ? 1 : 0,
        inferred_match_count: match.isInferred === true ? 1 : 0,
        _intel: {
          product_count: match.evidence?.recordCount || 0,
          price_coverage_pct: 0,
          last_seen_days: match.evidence?.lastSeenDays ?? null,
        },
        _profile: {
          country: match.country || null,
          last_seen_date: match.evidence?.lastShipmentDate || null,
          shipment_count_12m: match.evidence?.recordCount || null,
          role: match.supplierType || null,
          role_reason: match.matchReason || null,
        },
        _supplierType: match.supplierType || null,
        _companyType: null,
        _exampleProducts: [],
      })),
      _candidateMatches: result.candidateSuppliers.map((match) => ({
        id: match.supplierId,
        supplierId: match.supplierId,
        supplier_id: match.supplierId,
        supplierName: match.supplierName,
        supplier_name: match.supplierName,
        exact_match_count: match.isInferred === false ? 1 : 0,
        inferred_match_count: match.isInferred === true ? 1 : 0,
        _intel: {
          product_count: match.evidence?.recordCount || 0,
          price_coverage_pct: 0,
          last_seen_days: match.evidence?.lastSeenDays ?? null,
        },
        _profile: {
          country: match.country || null,
          last_seen_date: match.evidence?.lastShipmentDate || null,
          shipment_count_12m: match.evidence?.recordCount || null,
          role: match.supplierType || null,
          role_reason: match.matchReason || null,
        },
        _supplierType: match.supplierType || null,
        _companyType: null,
        _exampleProducts: [],
      })),
      _hsCandidates: (result.marketEstimate?.hsCodeCandidates || []).map((c: any) => ({
        code: c.code || c,
        confidence: c.confidence || 0.8,
        rationale: c.rationale || c.reason || "From pipeline",
        evidenceSnippet: c.evidenceSnippet || null,
      })),
    };

    // DB 저장 전 confidence 값 정제 (DB 제약 조건 준수)
    const sanitizeConfidence = (conf: any): "low" | "medium" | "high" => {
      if (typeof conf === "string") {
        const lower = conf.toLowerCase();
        if (lower === "low" || lower === "medium" || lower === "high") {
          return lower as "low" | "medium" | "high";
        }
      }
      // 숫자 값이 들어온 경우 변환 (0-1 범위 또는 0-100 범위)
      if (typeof conf === "number") {
        let normalized = conf;
        // 1보다 크면 0-100 범위로 가정하고 0-1로 변환
        if (normalized > 1) {
          normalized = normalized / 100;
        }
        // 0-1 범위로 클램핑
        normalized = Math.min(Math.max(normalized, 0), 1);
        return normalized >= 0.8 ? "high" : normalized >= 0.6 ? "medium" : "low";
      }
      // 기본값
      return "medium";
    };
    
    const sanitizedConfidence = sanitizeConfidence(report.confidence);

    const { data: updateData, error: updateError } = await admin
      .from("reports")
      .update({
        product_name: report.productName,
        category: report.category,
        confidence: sanitizedConfidence,
        signals: report.signals,
        baseline: report.baseline,
        data: {
          ...report,
          product_image_url: productImageUrl,
          barcode_image_url: barcodeImageUrl,
          label_image_url: labelImageUrl,
          extra_image_url_1: extra1ImageUrl,
          extra_image_url_2: extra2ImageUrl,
          ...uploadFlags,
          inputStatus: {
            ...(report as any).inputStatus,
            ...uploadFlags,
            unitsPerCase: 1,
          },
          evidenceNormalized: normalizedEvidence,
          // Store V2 snapshot for resilience
          _v2Snapshot: v2Snapshot,
          // Store decision summary
          _decisionSummary: decisionSummary,
        } as unknown as Record<string, unknown>,
        pipeline_result: {
          ...sanitizedPipelineResult,
          evidenceNormalized: normalizedEvidence,
        },
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", finalReportId)
      .select("id, status")
      .maybeSingle();

    if (updateError) {
      console.error("[Analyze API] Failed to update report with pipeline output", {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        reportId: finalReportId,
      });
      await admin
        .from("reports")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", finalReportId);

      return NextResponse.json(
        {
          ok: false,
          savedReport: false,
          error: "REPORT_SAVE_FAILED",
          details: updateError.message,
          data: result,
        },
        { status: 500 }
      );
    }

    // Verify update succeeded
    if (!updateData || updateData.id !== finalReportId) {
      console.error("[Analyze API] Report update returned no data or wrong ID", {
        reportId: finalReportId,
        updateData,
      });
      // Try to verify report still exists
      const { data: verifyData } = await admin
        .from("reports")
        .select("id, status")
        .eq("id", finalReportId)
        .maybeSingle();
      
      if (!verifyData) {
        console.error("[Analyze API] CRITICAL: Report disappeared after update attempt", {
          reportId: finalReportId,
        });
        return NextResponse.json(
          {
            ok: false,
            savedReport: false,
            error: "REPORT_DISAPPEARED",
            message: "Report was updated but cannot be found. Please try again.",
            data: result,
          },
          { status: 500 }
        );
      }
    }

    console.log(`[Analyze API] Report updated successfully: ${finalReportId}, status: ${updateData?.status || 'unknown'}`);

    // Persist trade data audit fields in a separate non-blocking update
    // Includes: attempted, result_count, used, reason, provider, checked_at + label audit + Vision extraction
    // Skip for guest users
    if (user) {
      try {
        await supabase
          .from("reports")
          .update({
          external_trade_data_attempted: externalTradeDataAttempted,
          external_trade_data_result_count: externalTradeDataResultCount,
          used_external_trade_data: usedExternalTradeData,
          external_trade_data_reason: externalTradeDataReason,
          external_trade_data_provider: usedExternalTradeData ? "importkey" : null, // Provider when used
          external_trade_data_checked_at: new Date().toISOString(), // Always set when decision is made
          label_uploaded: labelUploaded,
          label_ocr_status: labelOcrStatus,
          label_ocr_failure_reason: labelOcrFailureReason,
          label_terms: labelTermsJson,
          label_ocr_checked_at: labelOcrCheckedAt,
          // Vision extraction fields
          label_draft: labelDraft ? JSON.stringify(labelDraft) : null,
          label_extraction_source: labelExtractionSource,
          label_extraction_status: labelExtractionStatus,
          label_vision_extraction_attempted: labelVisionExtractionAttempted,
          label_vision_extraction_at: labelVisionExtractionAt,
          // Confirmation flags (false until user explicitly confirms)
          label_confirmed: false,
          compliance_confirmed: false,
          // Gemini inference draft fields
          critical_confirm: JSON.stringify(criticalConfirm),
          barcode_draft: barcodeDraft ? JSON.stringify(barcodeDraft) : null,
          barcode_extraction_source: barcodeExtractionSource,
          barcode_extraction_status: barcodeExtractionStatus,
          weight_draft: weightDraft ? JSON.stringify(weightDraft) : null,
          case_pack_draft: casePackDraft ? JSON.stringify(casePackDraft) : null,
          customs_category_draft: customsCategoryDraft ? JSON.stringify(customsCategoryDraft) : null,
          hs_candidates_draft: hsCandidatesDraft ? JSON.stringify(hsCandidatesDraft) : null,
          compliance_status: complianceStatus,
          compliance_notes: JSON.stringify(complianceNotes),
          updated_at: new Date().toISOString(),
        })
          .eq("id", finalReportId)
          .eq("user_id", user.id);
      } catch (e: any) {
        // Compact warning and continue - never fail report due to schema cache
        console.warn("[Analyze API] Audit fields not persisted (schema cache)");
        // Dev note: If you just added columns in Supabase and still see schema cache errors,
        // run NOTIFY pgrst, 'reload schema' or restart the API.
      }
    }

    // Save supplier matches to product_supplier_matches table (authenticated users only)
    if (user && finalReportId) {
      try {
      const supplierMatchesToSave: Array<{
        report_id: string;
        supplier_id: string;
        supplier_name: string;
        tier: "recommended" | "candidate";
        match_score: number | null;
        rerank_score: number | null;
        flags: Record<string, unknown>;
        evidence: Record<string, unknown>;
        unit_price: number | null;
        currency: string | null;
      }> = [];

      // Add recommended suppliers
      if (!finalReportId) {
        return NextResponse.json(
          { error: "Report creation failed" },
          { status: 500 }
        );
      }
      
      result.recommendedSuppliers.forEach((match) => {
        // Extract anchor_hit from rerankFlags if available (format: "anchor_hit:3")
        const rerankFlags = match._rerankFlags || [];
        const anchorHitFlag = rerankFlags.find((f: string) => f?.startsWith("anchor_hit:"));
        const anchorHitCount = anchorHitFlag 
          ? parseInt(anchorHitFlag.split(":")[1] || "0", 10) 
          : ((match as any)._matchedAnchors?.length || 0);
        
        supplierMatchesToSave.push({
          report_id: finalReportId as string,
          supplier_id: match.supplierId,
          supplier_name: match.supplierName,
          tier: "recommended",
          match_score: match.matchScore ?? null,
          rerank_score: match.rerankScore ?? null,
          flags: {
            supplierType: match.supplierType,
            isInferred: match.isInferred,
            rerankFlags: rerankFlags,
            // Store matched anchors (up to 2) for UI display
            matched_anchors: (match as any)._matchedAnchors || [],
            // Store anchor_hit count for backward compatibility
            anchor_hit: anchorHitCount,
            // Store why_lines and evidence_strength for explainable lead cards
            why_lines: (match as any)._whyLines || [],
            evidence_strength: (match as any)._evidenceStrength || "weak",
            // Store category_family for grouping (optional, not displayed as product fact)
            category_family: (match as any)._categoryFamily || null,
          },
          evidence: match.evidence ? {
            recordCount: match.evidence.recordCount,
            lastSeenDays: match.evidence.lastSeenDays,
            productTypes: match.evidence.productTypes,
            evidenceSnippet: match.evidence.evidenceSnippet,
          } : {},
          unit_price: match.unitPrice && match.unitPrice > 0 ? match.unitPrice : null,
          currency: match.currency || null,
        });
      });

      // Add candidate suppliers
      result.candidateSuppliers.forEach((match) => {
        // Extract anchor_hit from rerankFlags if available (format: "anchor_hit:3")
        const rerankFlags = match._rerankFlags || [];
        const anchorHitFlag = rerankFlags.find((f: string) => f?.startsWith("anchor_hit:"));
        const anchorHitCount = anchorHitFlag 
          ? parseInt(anchorHitFlag.split(":")[1] || "0", 10) 
          : ((match as any)._matchedAnchors?.length || 0);
        
        supplierMatchesToSave.push({
          report_id: finalReportId as string,
          supplier_id: match.supplierId,
          supplier_name: match.supplierName,
          tier: "candidate",
          match_score: match.matchScore ?? null,
          rerank_score: match.rerankScore ?? null,
          flags: {
            supplierType: match.supplierType,
            isInferred: match.isInferred,
            rerankFlags: rerankFlags,
            // Store matched anchors (up to 2) for UI display
            matched_anchors: (match as any)._matchedAnchors || [],
            // Store anchor_hit count for backward compatibility
            anchor_hit: anchorHitCount,
            // Store why_lines and evidence_strength for explainable lead cards
            why_lines: (match as any)._whyLines || [],
            evidence_strength: (match as any)._evidenceStrength || "weak",
            // Store category_family for grouping (optional, not displayed as product fact)
            category_family: (match as any)._categoryFamily || null,
          },
          evidence: match.evidence ? {
            recordCount: match.evidence.recordCount,
            lastSeenDays: match.evidence.lastSeenDays,
            productTypes: match.evidence.productTypes,
            evidenceSnippet: match.evidence.evidenceSnippet,
          } : {},
          unit_price: match.unitPrice && match.unitPrice > 0 ? match.unitPrice : null,
          currency: match.currency || null,
        });
      });

      // Deduplicate supplier matches before upsert to prevent 21000 error
      // Group by the same conflict key used by Supabase: (report_id, supplier_id, tier)
      const dedupeMap = new Map<string, typeof supplierMatchesToSave[0]>();
      
      for (const match of supplierMatchesToSave) {
        // Build conflict key: report_id + supplier_id + tier
        // Handle null supplier_id by using supplier_name as fallback
        const conflictKey = `${match.report_id}|||${match.supplier_id || match.supplier_name}|||${match.tier}`;
        
        if (dedupeMap.has(conflictKey)) {
          // Merge with existing match (keep the one with higher rerank_score)
          const existing = dedupeMap.get(conflictKey)!;
          const existingScore = existing.rerank_score ?? existing.match_score ?? 0;
          const newScore = match.rerank_score ?? match.match_score ?? 0;
          
          if (newScore > existingScore) {
            // Replace with better match
            dedupeMap.set(conflictKey, match);
          } else {
            // Merge flags (keep best evidence_strength, combine why_lines)
            const existingFlags = existing.flags as any;
            const newFlags = match.flags as any;
            
            // Merge matched_anchors
            const existingAnchors = (existingFlags.matched_anchors || []) as string[];
            const newAnchors = (newFlags.matched_anchors || []) as string[];
            const mergedAnchors = Array.from(new Set([...existingAnchors, ...newAnchors])).slice(0, 2);
            
            // Merge why_lines
            const existingWhyLines = (existingFlags.why_lines || []) as string[];
            const newWhyLines = (newFlags.why_lines || []) as string[];
            const mergedWhyLines = Array.from(new Set([...existingWhyLines, ...newWhyLines])).slice(0, 3);
            
            // Keep strongest evidence_strength
            const strengthOrder = { strong: 3, medium: 2, weak: 1 };
            const existingStrength = existingFlags.evidence_strength || "weak";
            const newStrength = newFlags.evidence_strength || "weak";
            const mergedStrength = 
              strengthOrder[existingStrength as keyof typeof strengthOrder] >= 
              strengthOrder[newStrength as keyof typeof strengthOrder]
                ? existingStrength
                : newStrength;
            
            existing.flags = {
              ...existingFlags,
              matched_anchors: mergedAnchors,
              why_lines: mergedWhyLines,
              evidence_strength: mergedStrength,
            };
          }
        } else {
          // First occurrence, add as-is
          dedupeMap.set(conflictKey, match);
        }
      }
      
      const deduplicatedMatches = Array.from(dedupeMap.values());
      
      // Debug log: show conflict key counts
      const conflictKeyCounts = new Map<string, number>();
      supplierMatchesToSave.forEach(m => {
        const key = `${m.report_id}|||${m.supplier_id || m.supplier_name}|||${m.tier}`;
        conflictKeyCounts.set(key, (conflictKeyCounts.get(key) || 0) + 1);
      });
      
      const duplicateKeys = Array.from(conflictKeyCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([key, count]) => ({ key, count }));
      
      if (duplicateKeys.length > 0) {
        console.warn(
          `[Analyze API] Found ${duplicateKeys.length} duplicate conflict keys before deduplication:`,
          duplicateKeys.slice(0, 5).map(d => `${d.key} (${d.count}x)`)
        );
      }
      
      console.log(
        `[Analyze API] Deduplicated ${supplierMatchesToSave.length} matches to ${deduplicatedMatches.length} unique matches`
      );

      // Final validation: filter out any matches with empty supplier_id (required by DB constraint)
      const validMatches = deduplicatedMatches.filter(m => {
        if (!m.supplier_id || m.supplier_id.trim() === "") {
          console.warn(
            `[Analyze API] Skipping match with empty supplier_id: ${m.supplier_name} (tier: ${m.tier})`
          );
          return false;
        }
        return true;
      });

      if (validMatches.length > 0) {
        // Final debug: confirm no duplicates in conflict keys
        const finalConflictKeys = new Set<string>();
        validMatches.forEach(m => {
          const key = `${m.report_id}|||${m.supplier_id}|||${m.tier}`;
          if (finalConflictKeys.has(key)) {
            console.error(`[Analyze API] CRITICAL: Duplicate conflict key found after deduplication: ${key}`);
          }
          finalConflictKeys.add(key);
        });
        
        console.log(
          `[Analyze API] Upserting ${validMatches.length} unique supplier matches (conflict key: report_id,supplier_id,tier)`
        );
        
        const { error: supplierMatchesError } = await admin
          .from("product_supplier_matches")
          .upsert(validMatches as any, {
            onConflict: "report_id,supplier_id,tier",
          });

        if (supplierMatchesError) {
          console.error("[Analyze API] Failed to save supplier matches:", supplierMatchesError);
          warnings.push("SUPPLIER_MATCH_SAVE_FAILED");
          // Don't fail the request, just log the error
        } else {
          console.log(`[Analyze API] Saved ${supplierMatchesToSave.length} supplier matches to product_supplier_matches`);
        }
      }

      // Save supplier enrichment data (inferred profile fields)
      // Optional: controlled by SUPPLIER_ENRICHMENT_ENABLED env flag (default: false)
      const enrichmentEnabled = process.env.SUPPLIER_ENRICHMENT_ENABLED === "true";
      
      if (enrichmentEnabled) {
        try {
          // Check if supplier_enrichment table exists by attempting a simple query
          const { error: tableCheckError } = await admin
            .from("supplier_enrichment")
            .select("supplier_id")
            .limit(1);
          
          if (tableCheckError) {
            // Table doesn't exist or not accessible - log compact warning once
            if (tableCheckError.code === "42P01" || tableCheckError.message?.includes("does not exist")) {
              console.warn("[Analyze API] SUPPLIER_ENRICHMENT_ENABLED=true but table missing");
            } else {
              console.warn("[Analyze API] SUPPLIER_ENRICHMENT_ENABLED=true but cannot access table");
            }
            // Don't add to warnings - silently skip if enabled but unavailable
          } else {
            // Table exists, proceed with enrichment
            const category = result.analysis?.category || "unknown";
            const allSuppliers = [...result.recommendedSuppliers, ...result.candidateSuppliers];
            
            // Generate and upsert enrichment for each supplier
            const enrichmentPromises = allSuppliers.map(async (match) => {
              // Check for generic manifest text
              const productNameLower = (match.productName || "").toLowerCase();
              const genericManifestPatterns = [
                "this shipment contains",
                "plastic toys this shipment",
                "various articles",
                "assorted goods",
                "mixed cargo",
                "general merchandise",
                "miscellaneous",
              ];
              const isGenericManifest = genericManifestPatterns.some((pattern) => productNameLower.includes(pattern));
              
              const enrichment = generateSupplierEnrichment(
                {
                  supplierId: match.supplierId,
                  supplierName: match.supplierName,
                  supplierType: match.supplierType,
                  country: match.country,
                  evidence: match.evidence,
                  matchReason: match.matchReason,
                  flags: {
                    isInferred: match.isInferred,
                    dummy_id: match.supplierId.startsWith("dummy_"),
                    generic_manifest: isGenericManifest,
                  },
                },
                category
              );
              await upsertSupplierEnrichment(admin, enrichment);
            });

            await Promise.all(enrichmentPromises);
            console.log(`[Analyze API] Saved enrichment data for ${allSuppliers.length} suppliers`);
          }
        } catch (error) {
          console.warn("[Analyze API] Error saving supplier enrichment:", error instanceof Error ? error.message : String(error));
          // Don't fail the request, just log the warning
        }
        } else {
          console.log("[Analyze API] SUPPLIER_ENRICHMENT_ENABLED=false, skipping enrichment step");
        }
      } catch (error) {
        console.error("[Analyze API] Error saving supplier matches:", error);
        // Don't fail the request, just log the error
      }
    }

    // readback으로 진짜 저장됐는지 검증 (authenticated users only)
    let savedReport = false;
    if (user && finalReportId) {
      const { data: readback, error: readbackError } = await admin
        .from("reports")
        .select("id")
        .eq("id", finalReportId)
        .maybeSingle();

      savedReport = !!readback && !readbackError;
    }
    
    console.log(`[Analyze API] ✓ Pipeline completed successfully:`, {
      reportId: finalReportId,
      input_key: inputKey.substring(0, 16) + "...",
      savedReport,
      status: "completed",
      warnings: warnings.length > 0 ? warnings : "none",
      userId: user?.id,
    });

    // Ensure finalReportId exists before returning
    if (!finalReportId && user) {
      console.error("[Analyze API] CRITICAL: finalReportId is null but user is authenticated");
      return NextResponse.json(
        {
          ok: false,
          error: "REPORT_ID_MISSING",
          message: "Report was created but ID is missing. Please try again.",
        },
        { status: 500 }
      );
    }

    // CRITICAL: Verify report exists in DB before returning (with aggressive retry for eventual consistency)
    if (finalReportId && user) {
      let verifyReport = null;
      let verifyError = null;
      const maxVerifyRetries = 10; // Increased retries
      const baseDelay = 300; // Base delay increased
      
      console.log(`[Analyze API] Starting report verification for ${finalReportId}...`);
      
      for (let attempt = 0; attempt < maxVerifyRetries; attempt++) {
        const { data, error } = await admin
          .from("reports")
          .select("id, status, user_id, created_at, updated_at")
          .eq("id", finalReportId)
          .maybeSingle();
        
        verifyReport = data;
        verifyError = error;
        
        if (verifyReport && !verifyError) {
          console.log(`[Analyze API] ✓ Report verified on attempt ${attempt + 1}:`, {
            reportId: finalReportId,
            status: verifyReport.status,
            user_id: verifyReport.user_id,
            created_at: verifyReport.created_at,
            updated_at: verifyReport.updated_at,
          });
          break; // Found the report, exit retry loop
        }
        
        if (attempt < maxVerifyRetries - 1) {
          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(1.5, attempt) + Math.random() * 100;
          console.log(`[Analyze API] Report verification failed (attempt ${attempt + 1}/${maxVerifyRetries}), retrying in ${Math.round(delay)}ms...`, {
            reportId: finalReportId,
            error: verifyError?.message,
            hasData: !!verifyReport,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (verifyError || !verifyReport) {
        // Last resort: try one more time with a longer delay
        console.log(`[Analyze API] Final verification attempt after ${maxVerifyRetries} retries...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: finalCheck, error: finalError } = await admin
          .from("reports")
          .select("id, status")
          .eq("id", finalReportId)
          .maybeSingle();
        
        if (finalCheck && !finalError) {
          console.log(`[Analyze API] ✓ Report found on final check: ${finalReportId}`);
          verifyReport = finalCheck;
        } else {
          console.error("[Analyze API] CRITICAL: Report ID returned but not found in DB after all retries:", {
            reportId: finalReportId,
            error: verifyError?.message || finalError?.message,
            attempts: maxVerifyRetries + 1,
            userId: user.id,
            timestamp: new Date().toISOString(),
          });
          return NextResponse.json(
            {
              ok: false,
              error: "REPORT_NOT_FOUND",
              message: "Report was created but cannot be found. Please try again or contact support.",
              reportId: finalReportId, // Return the ID anyway so user can try manually
            },
            { status: 500 }
          );
        }
      }
      
      console.log(`[Analyze API] ✓ Report verified and ready: ${finalReportId}, status: ${verifyReport.status}`);
    }

    // FINAL VERIFICATION: Read the report one more time to ensure it's readable
    if (finalReportId && user) {
      console.log(`[Analyze API] Final verification: Reading report ${finalReportId} before returning...`);
      const { data: finalRead, error: finalReadError } = await admin
        .from("reports")
        .select("id, status, user_id, product_name")
        .eq("id", finalReportId)
        .maybeSingle();
      
      if (finalReadError || !finalRead) {
        console.error("[Analyze API] CRITICAL: Report not readable in final check:", {
          reportId: finalReportId,
          error: finalReadError?.message,
          userId: user.id,
        });
        // Still return the reportId - let the client retry
        return NextResponse.json({
          ok: true,
          reportId: finalReportId,
          reused: false,
          savedReport: false,
          warning: "Report created but may not be immediately readable. Please refresh if you see a 404.",
          data: { ...result, draftInference },
          warnings,
        });
      }
      
      console.log(`[Analyze API] ✓ Final verification passed: Report ${finalReportId} is readable`, {
        status: finalRead.status,
        productName: finalRead.product_name,
      });
    }

    return NextResponse.json({
      ok: true,
      reportId: finalReportId,
      reused: false,
      savedReport: true,
      data: { ...result, draftInference },
      warnings,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[Analyze API] Pipeline execution failed:", {
      message: errorMessage,
      stack: errorStack,
      finalReportId,
      userId,
      errorType: error?.constructor?.name,
    });

    if (finalReportId && userId) {
      try {
        const supabase = await createClient();
        await supabase
          .from("reports")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", finalReportId)
          .eq("user_id", userId);
      } catch (updateError) {
        console.error("[Analyze API] Failed to mark report as failed", updateError);
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage || "Unknown error occurred",
        message: "Intelligence pipeline execution failed",
        details: process.env.NODE_ENV === "development" ? {
          stack: errorStack,
          type: error?.constructor?.name,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

