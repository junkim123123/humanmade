// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchSupplierIntel, inferSupplierType } from "@/lib/server/supplier-intel";
import { fetchFactoriesForCategory } from "@/lib/server/supplier-factories";
import { fetchSupplierEnrichments } from "@/lib/server/supplier-enrichment";
import { fetchSupplierProfiles } from "@/lib/server/supplier-profiles";
import { buildQuestionsChecklist } from "@/lib/server/questions-checklist";
import { inferCompanyType } from "@/lib/shared/company-type-heuristic";
import { isLogisticsOnly } from "@/lib/supplier-lead-helpers";
import { createDefaultDraftInference } from "@/lib/draft-inference-builder";
import { buildDecisionSupport } from "@/lib/server/decision-support-builder";
import { normalizeEvidence } from "@/lib/report/evidence";
import type { Report } from "@/lib/report/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await ctx.params;
  
  if (!reportId || typeof reportId !== 'string' || reportId.trim() === '') {
    console.error("[Reports API] Invalid reportId:", reportId);
    return NextResponse.json(
      { success: false, error: "INVALID_REPORT_ID" },
      { status: 400 }
    );
  }
  
  const admin = getSupabaseAdmin();

  console.log("[Reports API] Fetching report:", reportId);
  
  // Try multiple times with increasing delays
  let data = null;
  let error = null;
  const maxAttempts = 3;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: attemptData, error: attemptError } = await admin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();
    
    data = attemptData;
    error = attemptError;
    
    if (data && !error) {
      console.log(`[Reports API] Report found on attempt ${attempt + 1}`);
      break;
    }
    
    if (attempt < maxAttempts - 1) {
      const delay = 500 * (attempt + 1); // 500ms, 1000ms, 1500ms
      console.log(`[Reports API] Report not found, retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (error) {
    console.error("[Reports API] Read error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      reportId,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "READ_FAILED",
        message: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    console.error("[Reports API] Report not found:", reportId);
    // Check if report exists with different query
    const { data: checkData, error: checkError } = await admin
      .from("reports")
      .select("id, status, user_id, created_at")
      .eq("id", reportId)
      .maybeSingle();
    
    // Also check recent reports to see if there's a pattern
    const { data: recentReports } = await admin
      .from("reports")
      .select("id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    
    console.error("[Reports API] Report not found - diagnostic info:", {
      reportId,
      verificationQuery: {
        found: !!checkData,
        error: checkError?.message,
        data: checkData,
      },
      recentReports: recentReports?.map(r => ({ id: r.id, status: r.status, created_at: r.created_at })),
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: "NOT_FOUND",
        message: `Report ${reportId} not found in database. Please check if the analysis completed successfully.`,
        diagnostic: {
          reportId,
          checkedAt: new Date().toISOString(),
          recentReportsCount: recentReports?.length || 0,
        },
      },
      { status: 404 }
    );
  }
  
  console.log("[Reports API] Report found:", {
    id: data.id,
    status: data.status,
    product_name: data.product_name,
  });

  const reportData = data as any;

  // Fetch supplier matches
  const { data: supplierMatches, error: supplierMatchesError } = await admin
    .from("product_supplier_matches")
    .select("*")
    .eq("report_id", reportId)
    .order("tier", { ascending: true }) // recommended first
    .order("rerank_score", { ascending: false })
    .order("match_score", { ascending: false });

  if (supplierMatchesError) {
    console.error("[Reports API] Failed to fetch supplier matches:", supplierMatchesError);
    // Don't fail the request, just continue with empty matches
  }

  // Fetch supplier intel for all supplier IDs
  let supplierIntelMap = new Map();
  if (supplierMatches && supplierMatches.length > 0) {
    try {
      const supplierIds = supplierMatches.map((m: any) => m.supplier_id as string);
      supplierIntelMap = await fetchSupplierIntel(admin, supplierIds);
    } catch (intelError) {
      console.error("[Reports API] Failed to fetch supplier intel:", intelError);
      // Continue without intel
    }
  }

  // Fetch supplier enrichment data
  let supplierEnrichmentMap = new Map();
  if (supplierMatches && supplierMatches.length > 0) {
    try {
      const supplierIds = supplierMatches.map((m: any) => m.supplier_id as string);
      supplierEnrichmentMap = await fetchSupplierEnrichments(admin, supplierIds);
    } catch (enrichmentError) {
      console.error("[Reports API] Failed to fetch supplier enrichment:", enrichmentError);
      // Continue without enrichment
    }
  }

  // Fetch supplier profiles with import stats
  let supplierProfileMap = new Map();
  if (supplierMatches && supplierMatches.length > 0) {
    try {
      const supplierIds = supplierMatches.map((m: any) => m.supplier_id as string);
      supplierProfileMap = await fetchSupplierProfiles(admin, supplierIds);
    } catch (profileError) {
      console.error("[Reports API] Failed to fetch supplier profiles:", profileError);
      // Continue without profiles
    }
  }

  // Fetch example products for each supplier (up to 2 per supplier)
  const supplierIds = supplierMatches?.map((m: any) => m.supplier_id) || [];
  const exampleProductsMap = new Map<string, Array<{ product_name: string; category?: string; unit_price?: number }>>();
  
  if (supplierIds.length > 0) {
    try {
      // Fetch up to 2 products per supplier
      const { data: exampleProducts, error: exampleError } = await admin
        .from("supplier_products")
        .select("supplier_id, product_name, category, unit_price")
        .in("supplier_id", supplierIds)
        .order("updated_at", { ascending: false });
      
      if (exampleError) {
        console.error("[Reports API] Failed to fetch example products:", exampleError);
      } else if (exampleProducts) {
        // Group by supplier_id and take up to 2 per supplier
        const grouped = new Map<string, typeof exampleProducts>();
        for (const product of exampleProducts) {
          const sid = product.supplier_id as string;
          if (!grouped.has(sid)) {
            grouped.set(sid, []);
          }
          const products = grouped.get(sid)!;
          if (products.length < 2) {
            products.push({
              product_name: product.product_name as string,
              category: product.category as string | undefined,
              unit_price: product.unit_price as number | undefined,
            });
          }
        }
        
        // Convert to the format we need
        for (const [sid, products] of grouped.entries()) {
          exampleProductsMap.set(sid, products);
        }
      }
    } catch (error) {
      console.error("[Reports API] Error fetching example products:", error);
      // Continue without examples
    }
  }

  // Attach intel, enrichment, profile, and example products to each supplier match
  // Also normalize to consistent shape: id, supplierId, supplierName, supplierRole, matchMode, confidence, evidenceLabel, reasonBadges
  const enrichedSupplierMatches = supplierMatches?.map((match: any) => {
    const intel = supplierIntelMap.get(match.supplier_id);
    const enrichment = supplierEnrichmentMap.get(match.supplier_id);
    const profile = supplierProfileMap.get(match.supplier_id);
    const exampleProducts = exampleProductsMap.get(match.supplier_id) || [];
    
    // Enhance why_lines with intel data if available (category-agnostic format)
    const flags = match.flags || {};
    let whyLines = (flags.why_lines as string[]) || [];
    
    // If intel exists, update or add dataset support line (Line C)
    if (intel) {
      const hasDatasetLine = whyLines.some(line => line.includes("Internal dataset:"));
      if (!hasDatasetLine && intel.product_count > 0) {
        // Add new dataset line
        let datasetLine = `Internal dataset: ${intel.product_count} related item${intel.product_count === 1 ? "" : "s"}`;
        if (intel.price_coverage_pct === 0) {
          datasetLine += ", no pricing yet";
        } else if (intel.price_coverage_pct > 0) {
          datasetLine += `, pricing coverage ${Math.round(intel.price_coverage_pct)}%`;
        }
        // Truncate to 72 chars
        if (datasetLine.length > 72) {
          datasetLine = datasetLine.substring(0, 69) + "...";
        }
        whyLines.push(datasetLine);
        whyLines = whyLines.slice(0, 3); // Max 3 lines
      } else if (hasDatasetLine) {
        // Update existing dataset line with pricing info if not present
        whyLines = whyLines.map(line => {
          if (line.includes("Internal dataset:") && !line.includes("pricing") && !line.includes("limited history") && !line.includes("not enough history")) {
            if (intel.product_count > 0) {
              if (intel.price_coverage_pct === 0) {
                return line + ", no pricing yet";
              } else if (intel.price_coverage_pct > 0) {
                return line + `, pricing coverage ${Math.round(intel.price_coverage_pct)}%`;
              }
            }
          }
          return line;
        }).map(line => line.length > 72 ? line.substring(0, 69) + "..." : line);
      } else if (intel.product_count === 0) {
        // No products in dataset
        const datasetLine = "Internal dataset: limited history for this supplier";
        if (!whyLines.some(line => line.includes("Internal dataset:"))) {
          whyLines.push(datasetLine);
          whyLines = whyLines.slice(0, 3);
        }
      }
    } else if (!whyLines.some(line => line.includes("Internal dataset:"))) {
      // No intel available
      whyLines.push("Internal dataset: not enough history yet");
      whyLines = whyLines.slice(0, 3);
    }
    
    // Infer supplier type from intel
    const supplierType = inferSupplierType(intel, match.supplier_name, flags);
    
    // Infer company type from supplier name (fallback if not in flags)
    const companyType = (flags.companyType as string) || inferCompanyType(match.supplier_name);
    
    // Check if this is a logistics-only match and should be excluded
    const logisticsOnlyExcluded = isLogisticsOnly({
      flags,
      supplierName: match.supplier_name,
      categoryKey: reportData.category || "unknown",
    });
    
    // Update flags with exclusion reason if logistics-only
    const updatedFlags = { ...flags, why_lines: whyLines, companyType: companyType };
    if (logisticsOnlyExcluded && !updatedFlags.excluded_reason) {
      updatedFlags.excluded_reason = "logistics_only";
    }
    
    // Compute isVerifiedLead deterministically on server
    // Verified: tier === "recommended" AND evidenceStrength === "strong" OR "medium"
    // AND not excluded
    const tier = match.tier || "candidate";
    const evidenceStrength = flags.evidence_strength || "weak";
    const isExcluded = logisticsOnlyExcluded || (updatedFlags.excluded_reason !== undefined);
    const isVerifiedLead = !isExcluded && tier === "recommended" && 
      (evidenceStrength === "strong" || evidenceStrength === "medium");
    
    // Determine evidence label based on match source
    let evidenceLabel: "customs_matched" | "customs_company_only" | "db_keyword_only" | "signals_limited" = "db_keyword_only";
    const matchScore = match.match_score || match.matchScore || 0;
    const hasExactCustomsMatch = (match.exact_match_count || 0) > 0;
    const hasCustomsCompanyInference = (match.inferred_match_count || 0) > 0;
    
    if (hasExactCustomsMatch) {
      evidenceLabel = "customs_matched";
    } else if (hasCustomsCompanyInference) {
      evidenceLabel = "customs_company_only";
    } else if (match.reason_code === "fallback" || match.matchMode === "fallback") {
      evidenceLabel = "signals_limited";
    }
    
    // Determine confidence level
    const confidence = match.confidence || (matchScore >= 50 ? "high" : matchScore >= 30 ? "medium" : "low");
    
    return {
      // Normalized fields for UI
      id: match.id || match.supplier_id,
      supplierId: match.supplier_id,
      supplierName: match.supplier_name || "Unknown", // REQUIRED - filter out missing names at component level
      supplierRole: supplierType && supplierType !== "unknown" ? supplierType : undefined, // Optional - hide if undefined
      matchMode: match.matchMode || "normal",
      confidence: confidence,
      evidenceLabel,
      reasonBadges: flags.why_lines || [],
      
      // Legacy fields for backward compatibility
      ...match,
      flags: updatedFlags,
      _intel: intel || null,
      _enrichment: enrichment || null,
      _profile: profile || null,
      _supplierType: supplierType,
      _exampleProducts: exampleProducts, // Attach example products (0-2 items)
      _companyType: companyType, // Also attach directly for easier access
      isVerifiedLead, // Deterministic verified lead flag computed on server
      isExcluded, // New: computed exclusion flag
      // Attach profile fields directly for easier access
      supplier_id: match.supplier_id,
      country: profile?.country || null,
      last_seen_date: profile?.last_seen_date || null,
      shipment_count_12m: profile?.shipment_count_12m || null,
      top_hs_codes: profile?.top_hs_codes || null,
      top_origins: profile?.top_origins || null,
      role: profile?.role || null,
      role_reason: profile?.role_reason || null,
    };
  }) || [];
  
  // Filter out matches with missing supplierName
  const validSupplierMatches = enrichedSupplierMatches.filter((m: any) => m.supplierName && m.supplierName !== "Unknown");

  // Fetch factories for this category
  const factories = await fetchFactoriesForCategory(admin, reportData.category || "unknown");

  // payload 컬럼명이 다르면 여기만 맞추면 됨
  const baseline = reportData.baseline as Report["baseline"];
  const signals = reportData.signals as Report["signals"];
  const pipelineResult = reportData.pipeline_result as any;
  
  // Backfill draftInference if not present (for old reports)
  let draftInference = pipelineResult?.draftInference;
  if (!draftInference || Object.keys(draftInference).length === 0) {
    const category = reportData.category || "product";
    draftInference = createDefaultDraftInference(category);
    console.log(`[Reports API] Backfilled draftInference for old report ${reportId} (category: ${category})`);
  }

  const parsedWeightDraft = (() => {
    try {
      const weightDraftStr = (reportData as any).weight_draft;
      return weightDraftStr ? JSON.parse(weightDraftStr) : null;
    } catch {
      return null;
    }
  })();

  const parsedCasePackDraft = (() => {
    try {
      const casePackDraftStr = (reportData as any).case_pack_draft;
      return casePackDraftStr ? JSON.parse(casePackDraftStr) : null;
    } catch {
      return null;
    }
  })();

  const parsedCustomsDraft = (() => {
    try {
      const customsCategoryDraftStr = (reportData as any).customs_category_draft;
      return customsCategoryDraftStr ? JSON.parse(customsCategoryDraftStr) : null;
    } catch {
      return null;
    }
  })();

  const parsedHsDraft = (() => {
    try {
      const hsCandidatesDraftStr = (reportData as any).hs_candidates_draft;
      return hsCandidatesDraftStr ? JSON.parse(hsCandidatesDraftStr) : null;
    } catch {
      return null;
    }
  })();
  
  // Extract price unit from pipeline_result
  const priceUnit = pipelineResult?.marketEstimate?.fobUnitPriceRange?.unit || 
                    pipelineResult?.marketEstimate?.fobPriceRange?.unit || 
                    pipelineResult?.marketEstimate?.priceRange?.unit || 
                    "per unit";
  
  // Compute questions checklist
  const analysis = pipelineResult?.analysis || {};
  const hasPackagingPhoto = !!(analysis.labelData && Object.keys(analysis.labelData).length > 0);
  const hasBarcode = !!(analysis.barcode && analysis.barcode.length > 0);
  const hasUnitWeight = !!(analysis.labelData?.netWeight);
  const hasUnitVolume = false; // Not typically available in analysis
  const hasQuotes = false; // Free report doesn't include verified quotes
  const shippingMode = baseline?.evidence?.assumptions?.shippingMode as "air" | "ocean" | null || null;
  const hsCandidatesCount = pipelineResult?.marketEstimate?.hsCodeCandidates?.length || 0;
  
  const questionsChecklist = buildQuestionsChecklist({
    productName: reportData.product_name || "Unknown product",
    category: reportData.category || "unknown",
    hsCandidatesCount,
    hasPackagingPhoto,
    hasBarcode,
    hasUnitWeight,
    hasUnitVolume,
    hasQuotes,
    shippingMode,
  });
  
  // Compute coverage metrics
  const similarRecordsCount = pipelineResult?.marketEstimate?.similarRecordsCount || 0;
  const evidenceSource = pipelineResult?.marketEstimate?.evidenceSource || "llm_baseline";
  const leadsCount = enrichedSupplierMatches.length;
  
  // Calculate average pricing coverage across leads
  let totalPricingCoverage = 0;
  let leadsWithPricing = 0;
  enrichedSupplierMatches.forEach((match: any) => {
    const intel = supplierIntelMap.get(match.supplier_id);
    if (intel && intel.price_coverage_pct !== undefined && intel.price_coverage_pct !== null) {
      totalPricingCoverage += intel.price_coverage_pct;
      leadsWithPricing++;
    }
  });
  const avgPricingCoverage = leadsWithPricing > 0 
    ? Math.round(totalPricingCoverage / leadsWithPricing) 
    : 0;
  
  // Check if any leads have enrichment data
  const hasEnrichment = enrichedSupplierMatches.some((match: any) => {
    const enrichment = supplierEnrichmentMap.get(match.supplier_id);
    return !!enrichment;
  });
  
  // Calculate total related items count
  let totalRelatedItems = 0;
  enrichedSupplierMatches.forEach((match: any) => {
    const intel = supplierIntelMap.get(match.supplier_id);
    if (intel && intel.product_count) {
      totalRelatedItems += intel.product_count;
    }
  });
  
  const coverage = {
    similarRecordsCount,
    evidenceSource,
    leadsCount,
    avgPricingCoverage,
    hasEnrichment,
    totalRelatedItems,
  };
  
  // Determine evidence level with strict semantics
  // verified_quote: only when real quote data exists
  // exact_import: only when strict match condition (HS code exact match + high product name similarity)
  // similar_import: when internal similar records exist
  // category_prior: otherwise
  const hasVerifiedQuotes = reportData.verification?.status === "quoted" || reportData.verification?.status === "done";
  
  // exact_import requires: similar records exist AND evidence source is internal_records AND high confidence match
  // For now, we'll be conservative: only mark as exact if we have strong signals
  const topHsCandidate = pipelineResult?.marketEstimate?.hsCodeCandidates?.[0];
  const analysisHsCode = pipelineResult?.analysis?.hsCode;
  const hasExactHsMatch = topHsCandidate && analysisHsCode && 
    topHsCandidate.hsCode?.substring(0, 6) === analysisHsCode.substring(0, 6);
  const hasExactImports = similarRecordsCount > 0 && 
    pipelineResult?.marketEstimate?.evidenceSource === "internal_records" &&
    hasExactHsMatch;
  
  const hasSimilarImports = similarRecordsCount > 0;
  
  const evidenceLevel: "verified_quote" | "exact_import" | "similar_import" | "category_prior" = 
    hasVerifiedQuotes ? "verified_quote" :
    hasExactImports ? "exact_import" :
    hasSimilarImports ? "similar_import" :
    "category_prior";

  // Helper: Calculate total from components
  const calcTotal = (components: {
    unitPrice?: number;
    shippingPerUnit?: number;
    dutyPerUnit?: number;
    feePerUnit?: number;
  }): number => {
    return (
      (components.unitPrice || 0) +
      (components.shippingPerUnit || 0) +
      (components.dutyPerUnit || 0) +
      (components.feePerUnit || 0)
    );
  };

  // Helper: Normalize HS candidates to consistent format
  const normalizeHsCandidates = (): Array<{
    code: string;
    confidence: number;
    reason?: string;
    description?: string;
  }> => {
    // Case 1: marketEstimate.hsCodeCandidates is an array of objects
    if (Array.isArray(pipelineResult?.marketEstimate?.hsCodeCandidates)) {
      return pipelineResult.marketEstimate.hsCodeCandidates
        .filter((c: any) => c && (c.code || typeof c === 'string'))
        .map((c: any) => {
          if (typeof c === 'string') {
            return { code: c, confidence: 0.8, reason: "From market estimate" };
          }
          return {
            code: c.code || String(c),
            confidence: c.confidence ?? 0.8,
            reason: c.reason || "From market estimate",
            description: c.description,
          };
        });
    }
    
    // Case 2: marketEstimate.hsCodeCandidates is a number (count) - treat as empty and fallback
    // Case 3: analysis.hsCodeCandidates is an array
    if (Array.isArray(pipelineResult?.analysis?.hsCodeCandidates)) {
      return pipelineResult.analysis.hsCodeCandidates
        .filter((c: any) => c && (c.code || typeof c === 'string'))
        .map((c: any) => {
          if (typeof c === 'string') {
            return { code: c, confidence: 0.8, reason: "From image analysis" };
          }
          return {
            code: c.code || String(c),
            confidence: c.confidence ?? 0.8,
            reason: c.reason || "From image analysis",
            description: c.description,
          };
        });
    }
    
    // Case 4: analysis has a single hsCode string
    if (pipelineResult?.analysis?.hsCode && typeof pipelineResult.analysis.hsCode === 'string') {
      return [{
        code: pipelineResult.analysis.hsCode,
        confidence: 0.8,
        reason: "From image analysis",
      }];
    }
    
    return [];
  };
  
  const normalizedHsCandidates = normalizeHsCandidates();
  
  // Build Proof data for Overview strip (label-derived only)
  const extractLabelTerms = (): string[] => {
    const a = pipelineResult?.analysis || {};
    const ingredients: string[] = Array.isArray(a.labelData?.ingredients) ? (a.labelData!.ingredients as string[]) : [];
    const allergens: string[] = Array.isArray(a.labelData?.allergens) ? (a.labelData!.allergens as string[]) : [];
    const terms = [...ingredients, ...allergens]
      .filter((t) => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim());
    return terms.slice(0, 3);
  };
  
  const toPercent = (val: number | undefined | null): number => {
    if (val === undefined || val === null) return 65;
    const n = Number(val);
    if (!isFinite(n)) return 65;
    if (n <= 1) return Math.max(0, Math.min(100, Math.round(n * 100)));
    return Math.max(0, Math.min(100, Math.round(n)));
  };
  
  const topHs = normalizedHsCandidates?.[0];
  const proofHsCode = (topHs?.code as string) || (pipelineResult?.analysis?.hsCode as string) || null;
  const proofHsConfidence = toPercent(topHs?.confidence);
  const proofLabelTerms = extractLabelTerms();
  const proofSimilarImportsCount = similarRecordsCount;
  // Leads count must match Leads tab: recommended + candidate, excluding explicit excluded_reason and logistics-typed
  const proofLeadsCount = (enrichedSupplierMatches || [])
    .filter((m: any) => (m.tier === "recommended" || m.tier === "candidate") && !m.isExcluded)
    .filter((m: any) => !(m.flags?.excluded_reason) && m.flags?.type_logistics !== true)
    .length;
  const proofEvidenceLevel: "high" | "medium" | "low" = 
    evidenceLevel === "verified_quote" || evidenceLevel === "exact_import" ? "high" :
    evidenceLevel === "similar_import" ? "medium" : "low";
  
  // Helper: Normalize company name (remove special chars, uppercase, trim)
  const normalizeCompanyName = (name: string): string => {
    if (!name) return "";
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s&]/g, " ") // Remove special chars except & and spaces
      .replace(/\s+/g, " ") // Normalize spaces
      .trim();
  };

  // Extract and aggregate ImportKey companies from similar import records
  // This builds a raw list for transparency, not recommendations
  const extractImportKeyCompanies = async (): Promise<Array<{
    companyName: string;
    role: string;
    shipmentsCount: number;
    lastSeen: string | null;
    originCountry: string | null;
    exampleDescription: string | null;
    source: string;
  }>> => {
    // Only extract if similar import records exist
    if (similarRecordsCount === 0 || evidenceSource !== "internal_records") {
      return [];
    }

    try {
      // Try to fetch similar import records from shipping tables
      // Use the same logic as collectRecentImportersLastNDays but also get shipper/exporter
      const analysis = pipelineResult?.analysis;
      if (!analysis) return [];

      // Build search terms from analysis
      const searchTerms: string[] = [];
      if (analysis.productName) searchTerms.push(analysis.productName);
      if (analysis.keywords && Array.isArray(analysis.keywords)) {
        searchTerms.push(...analysis.keywords.slice(0, 3));
      }

      if (searchTerms.length === 0) return [];

      const sourcesToTry = [
        { table: "shipping_records_normalized", dateCol: "shipment_date" },
        { table: "shipping_records", dateCol: "shipment_date" },
        { table: "import_records", dateCol: "shipment_date" },
      ] as const;

      const companiesByKey = new Map<string, {
        companyName: string;
        role: string;
        shipmentsCount: number;
        lastSeen: Date | null;
        originCountries: Map<string, number>;
        exampleDescriptions: string[];
      }>();

      for (const src of sourcesToTry) {
        try {
          // Try to select shipper/exporter/consignee columns if they exist
          // Use a flexible select that handles missing columns
          const orFilter = searchTerms
            .map((t) => `product_description.ilike.%${t}%`)
            .join(",");

          // Try to get records with company info
          // First try with shipper/exporter columns
          const { data: rows, error } = await admin
            .from(src.table as any)
            .select(`
              shipment_date,
              product_description,
              origin_country,
              shipper_name,
              exporter_name,
              consignee_name,
              importer_name
            `)
            .or(orFilter)
            .limit(500);

          if (error || !rows || rows.length === 0) {
            // Fallback: try with just importer_name (what we know exists)
            const { data: fallbackRows } = await admin
              .from(src.table as any)
              .select(`
                shipment_date,
                product_description,
                origin_country,
                importer_name
              `)
              .or(orFilter)
              .limit(500);

            if (!fallbackRows || fallbackRows.length === 0) continue;

            // Process importer records
            for (const r of fallbackRows) {
              const companyName = normalizeCompanyName((r.importer_name as string) || "");
              if (!companyName) continue;

              const key = `${companyName}|Importer`;
              if (!companiesByKey.has(key)) {
                companiesByKey.set(key, {
                  companyName,
                  role: "Importer",
                  shipmentsCount: 0,
                  lastSeen: null,
                  originCountries: new Map(),
                  exampleDescriptions: [],
                });
              }

              const company = companiesByKey.get(key)!;
              company.shipmentsCount += 1;

              const shipmentDate = r.shipment_date ? new Date(r.shipment_date as string) : null;
              if (shipmentDate && (!company.lastSeen || shipmentDate > company.lastSeen)) {
                company.lastSeen = shipmentDate;
              }

              const origin = (r.origin_country as string)?.trim();
              if (origin) {
                company.originCountries.set(origin, (company.originCountries.get(origin) || 0) + 1);
              }

              const desc = (r.product_description as string)?.trim();
              if (desc && company.exampleDescriptions.length < 3) {
                company.exampleDescriptions.push(desc.length > 100 ? desc.substring(0, 97) + "..." : desc);
              }
            }
          } else {
            // Process records with shipper/exporter/consignee
            for (const r of rows) {
              // Extract companies by role
              const roles = [
                { name: (r.shipper_name as string) || "", role: "Shipper" },
                { name: (r.exporter_name as string) || "", role: "Exporter" },
                { name: (r.consignee_name as string) || "", role: "Consignee" },
                { name: (r.importer_name as string) || "", role: "Importer" },
              ];

              for (const { name, role } of roles) {
                const companyName = normalizeCompanyName(name);
                if (!companyName) continue;

                const key = `${companyName}|${role}`;
                if (!companiesByKey.has(key)) {
                  companiesByKey.set(key, {
                    companyName,
                    role,
                    shipmentsCount: 0,
                    lastSeen: null,
                    originCountries: new Map(),
                    exampleDescriptions: [],
                  });
                }

                const company = companiesByKey.get(key)!;
                company.shipmentsCount += 1;

                const shipmentDate = r.shipment_date ? new Date(r.shipment_date as string) : null;
                if (shipmentDate && (!company.lastSeen || shipmentDate > company.lastSeen)) {
                  company.lastSeen = shipmentDate;
                }

                const origin = (r.origin_country as string)?.trim();
                if (origin) {
                  company.originCountries.set(origin, (company.originCountries.get(origin) || 0) + 1);
                }

                const desc = (r.product_description as string)?.trim();
                if (desc && company.exampleDescriptions.length < 3) {
                  company.exampleDescriptions.push(desc.length > 100 ? desc.substring(0, 97) + "..." : desc);
                }
              }
            }
          }

          // If we got results, break (don't try other sources)
          if (companiesByKey.size > 0) break;
        } catch {
          continue;
        }
      }

      // Convert to array and format
      const companies = Array.from(companiesByKey.values())
        .map((c) => {
          // Get most common origin country
          const topOrigin = Array.from(c.originCountries.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

          return {
            companyName: c.companyName,
            role: c.role,
            shipmentsCount: c.shipmentsCount,
            lastSeen: c.lastSeen ? c.lastSeen.toISOString().split("T")[0] : null,
            originCountry: topOrigin,
            exampleDescription: c.exampleDescriptions[0] || null,
            source: "internal_records",
          };
        })
        .sort((a, b) => b.shipmentsCount - a.shipmentsCount)
        .slice(0, 50); // Top 50 companies

      // Upsert to database
      if (companies.length > 0) {
        const upsertData = companies.map((c) => ({
          report_id: reportId,
          company_name: c.companyName,
          role: c.role,
          shipments_count: c.shipmentsCount,
          last_seen: c.lastSeen,
          origin_country: c.originCountry,
          example_description: c.exampleDescription,
          source: c.source,
        }));

        // Delete existing records for this report and insert new ones
        await admin.from("report_importkey_companies").delete().eq("report_id", reportId);
        await admin.from("report_importkey_companies").insert(upsertData);
      }

      return companies;
    } catch (error) {
      console.error("[Reports API] Error extracting ImportKey companies:", error);
      return [];
    }
  };

  // Extract ImportKey companies (async, but we'll await it)
  const importKeyCompanies = await extractImportKeyCompanies();
  
  // Extract missing inputs for V2
  const missingInputs: string[] = [];
  if (!pipelineResult?.analysis?.labelData?.netWeight) {
    missingInputs.push("unit_weight");
  }
  
  // Check label/packaging photo status
  const labelUploaded = (() => {
    if (typeof (reportData as any).label_uploaded === "boolean") return (reportData as any).label_uploaded;
    if (typeof pipelineResult?.label_audit?.labelUploaded === "boolean") return pipelineResult.label_audit.labelUploaded;
    const reportDataObj = reportData.data as any;
    if (reportDataObj?.label_image_url && reportDataObj.label_image_url.length > 0) return true;
    return false;
  })();
  
  const labelOcrStatus = pipelineResult?.label_audit?.labelOcrStatus ?? (reportData as any).label_ocr_status;
  const hasLabelData = !!(pipelineResult?.analysis?.labelData && Object.keys(pipelineResult?.analysis?.labelData || {}).length > 0);
  
  // If label uploaded but OCR failed or no label data extracted, ask for readable label
  // If label not uploaded at all, ask for packaging photo
  if (!hasLabelData) {
    if (labelUploaded && (labelOcrStatus === "FAILED" || labelOcrStatus === "PARTIAL")) {
      missingInputs.push("readable_label_photo");
    } else if (!labelUploaded) {
      missingInputs.push("packaging_photo");
    }
  }
  
  if (!pipelineResult?.analysis?.barcode) {
    missingInputs.push("barcode");
  }
  if (!pipelineResult?.analysis?.hsCode) {
    missingInputs.push("hs_code");
  }
  
  // Calculate cost model totals for V2 using helper
  const standardComponents = {
    unitPrice: baseline?.costRange?.standard?.unitPrice,
    shippingPerUnit: baseline?.costRange?.standard?.shippingPerUnit,
    dutyPerUnit: baseline?.costRange?.standard?.dutyPerUnit,
    feePerUnit: baseline?.costRange?.standard?.feePerUnit,
  };
  const conservativeComponents = {
    unitPrice: baseline?.costRange?.conservative?.unitPrice,
    shippingPerUnit: baseline?.costRange?.conservative?.shippingPerUnit,
    dutyPerUnit: baseline?.costRange?.conservative?.dutyPerUnit,
    feePerUnit: baseline?.costRange?.conservative?.feePerUnit,
  };
  
  const standardTotal = calcTotal(standardComponents);
  const conservativeTotal = calcTotal(conservativeComponents);

  const weightDraft = draftInference.weightDraft || parsedWeightDraft || {
    value: null,
    unit: "g",
    confidence: 0,
    evidenceSnippet: "Not inferred",
    source: "DEFAULT",
  };
  const casePackDraft = draftInference.casePackDraft || parsedCasePackDraft || {
    candidates: [
      { value: 12, confidence: 0.4, evidenceSnippet: "Default case pack", source: "DEFAULT" },
      { value: 24, confidence: 0.3, evidenceSnippet: "Default alternate", source: "DEFAULT" },
    ],
    selectedValue: null,
    selectedConfidence: null,
  };
  const customsCategoryDraft = draftInference.customsCategoryDraft || parsedCustomsDraft || {
    value: null,
    confidence: 0,
    evidenceSnippet: "Not inferred",
    source: "DEFAULT",
  };
  const hsCandidatesDraft = draftInference.hsCandidatesDraft || parsedHsDraft || { candidates: [] };
  
  // Update baseline costRange totals to match calculated values
  if (baseline?.costRange) {
    baseline.costRange.standard.totalLandedCost = standardTotal;
    baseline.costRange.conservative.totalLandedCost = conservativeTotal;
  }

  const report: Report = {
    schemaVersion: reportData.schema_version,
    id: reportData.id,
    productName: reportData.product_name || "Unknown product",
    summary: `${reportData.product_name} - ${reportData.category}`,
    category: reportData.category || "unknown",
    confidence: (reportData.confidence as "low" | "medium" | "high") || "medium",
    categoryConfidence: pipelineResult?.analysis?.confidence,
    evidenceLevel,
    
    signals: signals || {
      hasImportEvidence: false,
      hasInternalSimilarRecords: false,
      hasSupplierCandidates: false,
      verificationStatus: "none",
    },
    
    baseline: baseline || {
      costRange: {
        standard: {
          unitPrice: 0,
          shippingPerUnit: 0,
          dutyPerUnit: 0,
          feePerUnit: 0,
          totalLandedCost: 0,
        },
        conservative: {
          unitPrice: 0,
          shippingPerUnit: 0,
          dutyPerUnit: 0,
          feePerUnit: 0,
          totalLandedCost: 0,
        },
      },
      riskScores: {
        tariff: 50,
        compliance: 40,
        supply: 50,
        total: 47,
      },
      riskFlags: {
        tariff: {
          hsCodeRange: [],
          adCvdPossible: false,
          originSensitive: false,
        },
        compliance: {
          requiredCertifications: [],
          labelingRisks: [],
          recallHints: [],
        },
        supply: {
          moqRange: { min: 100, max: 5000, typical: 1000 },
          leadTimeRange: { min: 30, max: 90, typical: 60 },
          qcChecks: [],
        },
      },
      evidence: {
        types: ["category_based"],
        assumptions: {
          packaging: "Standard packaging assumed",
          weight: "Estimated from category",
          volume: "Estimated from category",
          incoterms: "FOB",
          shippingMode: "air",
        },
        items: [],
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastResult: null,
        lastErrorCode: null,
      },
    },
    
    verification: { status: "not_requested" },
    nextActions: [],
    verifiedQuotes: undefined,
    
    createdAt: reportData.created_at,
    updatedAt: reportData.updated_at,
    
    // Add metadata for UI display
    _priceUnit: priceUnit,
    // Trade data transparency flags: prefer DB if present, else compute from coverage
    used_external_trade_data: (reportData as any).used_external_trade_data ?? (coverage.evidenceSource === "internal_records"),
    external_trade_data_attempted: (reportData as any).external_trade_data_attempted ?? false,
    external_trade_data_result_count: (reportData as any).external_trade_data_result_count ?? null,
    external_trade_data_reason: (reportData as any).external_trade_data_reason ?? (
      coverage.evidenceSource === "internal_records"
        ? `Used: evidenceSource=internal_records, similarCount=${coverage.similarRecordsCount}`
        : `Skipped: evidenceSource=${coverage.evidenceSource}, similarCount=${coverage.similarRecordsCount}`
    ),
    external_trade_data_provider: (reportData as any).external_trade_data_provider || null,
    external_trade_data_checked_at: (reportData as any).external_trade_data_checked_at || null,
    _proof: {
      hsCode: proofHsCode,
      hsConfidence: proofHsConfidence,
      labelTerms: proofLabelTerms,
      // Label audit: DB-first (if present), then pipeline_result, then check if file exists
      labelUploaded: (() => {
        // Priority 1: DB column (if set)
        if (typeof (reportData as any).label_uploaded === "boolean") {
          return (reportData as any).label_uploaded;
        }
        // Priority 2: pipeline_result.label_audit
        if (typeof pipelineResult?.label_audit?.labelUploaded === "boolean") {
          return pipelineResult.label_audit.labelUploaded;
        }
        // Priority 3: Check if label_image_url exists in report data
        const reportDataObj = reportData.data as any;
        if (reportDataObj?.label_image_url && reportDataObj.label_image_url.length > 0) {
          return true;
        }
        // Unknown
        return undefined;
      })(),
      labelOcrStatus: pipelineResult?.label_audit?.labelOcrStatus ?? (reportData as any).label_ocr_status ?? undefined,
      labelOcrFailureReason: pipelineResult?.label_audit?.labelOcrFailureReason ?? (reportData as any).label_ocr_failure_reason ?? null,
      labelTermsFromDb: (() => {
        // Priority 1: pipeline_result.label_audit
        if (Array.isArray(pipelineResult?.label_audit?.labelTerms) && pipelineResult.label_audit.labelTerms.length > 0) {
          return pipelineResult.label_audit.labelTerms;
        }
        // Priority 2: DB label_terms
        try {
          const terms = (reportData as any).label_terms;
          if (typeof terms === "string") return JSON.parse(terms);
          if (Array.isArray(terms)) return terms;
        } catch {
          // ignore parse errors
        }
        // Priority 3: legacy label extraction
        return proofLabelTerms;
      })(),
      labelOcrCheckedAt: pipelineResult?.label_audit?.labelOcrCheckedAt ?? (reportData as any).label_ocr_checked_at ?? null,
      similarImportsCount: proofSimilarImportsCount,
      leadsCount: proofLeadsCount,
      evidenceLevel: proofEvidenceLevel,
    },
    _similarRecordsCount: pipelineResult?.marketEstimate?.similarRecordsCount || 0,
    _hsCandidatesCount: pipelineResult?.marketEstimate?.hsCodeCandidates?.length || 0,
    _hasLandedCosts: (pipelineResult?.landedCosts?.length || 0) > 0,
    // Market estimate metadata
    _marketEstimate: pipelineResult?.marketEstimate ? {
      priceRange: pipelineResult.marketEstimate.fobUnitPriceRange || pipelineResult.marketEstimate.fobPriceRange || pipelineResult.marketEstimate.priceRange,
      unit: pipelineResult.marketEstimate.fobUnitPriceRange?.unit || pipelineResult.marketEstimate.fobPriceRange?.unit || pipelineResult.marketEstimate.priceRange?.unit || "per unit",
      hsCandidates: normalizedHsCandidates, // Use normalized candidates
      evidenceSource: pipelineResult.marketEstimate.evidenceSource,
      source: pipelineResult.marketEstimate.source,
      rangeMethod: pipelineResult.marketEstimate.rangeMethod,
      confidenceTier: pipelineResult.marketEstimate.confidenceTier,
    } : null,
    // V2 normalized data adapter
    v2: {
      costModel: {
        standard: {
          unitPrice: baseline?.costRange?.standard?.unitPrice || 0,
          shippingPerUnit: baseline?.costRange?.standard?.shippingPerUnit || 0,
          dutyPerUnit: baseline?.costRange?.standard?.dutyPerUnit || 0,
          feePerUnit: baseline?.costRange?.standard?.feePerUnit || 0,
          totalLandedCost: standardTotal, // Always computed from components
        },
        conservative: {
          unitPrice: baseline?.costRange?.conservative?.unitPrice || 0,
          shippingPerUnit: baseline?.costRange?.conservative?.shippingPerUnit || 0,
          dutyPerUnit: baseline?.costRange?.conservative?.dutyPerUnit || 0,
          feePerUnit: baseline?.costRange?.conservative?.feePerUnit || 0,
          totalLandedCost: conservativeTotal, // Always computed from components
        },
      },
      // Cost range: always min to max (not conservative to standard)
      deliveredCostRange: {
        min: Math.min(standardTotal, conservativeTotal),
        max: Math.max(standardTotal, conservativeTotal),
      },
      hsCandidates: normalizedHsCandidates,
      evidenceLevel,
      missingInputs,
      importKeyCompanies: importKeyCompanies.map((c) => ({
        companyName: c.companyName,
        role: c.role,
        shipmentsCount: c.shipmentsCount,
        lastSeen: c.lastSeen,
        originCountry: c.originCountry,
        exampleDescription: c.exampleDescription,
        source: c.source,
      })),
    },
    // Similar records sample
    _similarRecordsSample: pipelineResult?.marketEstimate?.observedSuppliers?.slice(0, 3) || [],
    // Removal reasons (if available)
    _removalReasons: pipelineResult?._removalReasons || null,
    // Supplier matches - split into recommended, candidates, and excluded
    _supplierMatches: enrichedSupplierMatches || [],
    _recommendedMatches: (enrichedSupplierMatches || [])
      .filter((m: any) => m.tier === "recommended" && !m.isExcluded)
      .sort((a: any, b: any) => (b.rerank_score || b.match_score || 0) - (a.rerank_score || a.match_score || 0)),
    _candidateMatches: (enrichedSupplierMatches || [])
      .filter((m: any) => m.tier === "candidate" && !m.isExcluded)
      .sort((a: any, b: any) => (b.rerank_score || b.match_score || 0) - (a.rerank_score || a.match_score || 0)),
    _excludedMatches: (enrichedSupplierMatches || [])
      .filter((m: any) => m.isExcluded)
      .sort((a: any, b: any) => (b.rerank_score || b.match_score || 0) - (a.rerank_score || a.match_score || 0)),
    _supplierRecommendedCount: (validSupplierMatches || []).filter((m: any) => m.tier === "recommended" && !m.isExcluded).length,
    _supplierCandidateCount: (validSupplierMatches || []).filter((m: any) => m.tier === "candidate" && !m.isExcluded).length,
    _supplierExcludedCount: (validSupplierMatches || []).filter((m: any) => m.isExcluded).length,
    // Factories
    categoryFactories: factories || [],
    // Questions checklist
    _questionsChecklist: questionsChecklist,
    // Coverage metrics
    _coverage: coverage,
    draftInference,
    weightDraft,
    casePackDraft,
    customsCategoryDraft,
    hsCandidatesDraft,
    // Draft fields from Gemini inference
    _draft: {
      labelDraft: (() => {
        try {
          const labelDraftStr = (reportData as any).label_draft;
          return labelDraftStr ? JSON.parse(labelDraftStr) : null;
        } catch {
          return null;
        }
      })(),
      barcodeDraft: (() => {
        try {
          const barcodeDraftStr = (reportData as any).barcode_draft;
          return barcodeDraftStr ? JSON.parse(barcodeDraftStr) : null;
        } catch {
          return null;
        }
      })(),
      assumptionsDraft: {
        unitWeightDraft: weightDraft,
        unitsPerCaseDraft: casePackDraft,
      },
      customsCategoryDraft: (() => {
        try {
          const customsCategoryDraftStr = (reportData as any).customs_category_draft;
          return customsCategoryDraftStr ? JSON.parse(customsCategoryDraftStr) : null;
        } catch {
          return null;
        }
      })(),
      hsDraft: (() => {
        try {
          const hsCandidatesDraftStr = (reportData as any).hs_candidates_draft;
          return hsCandidatesDraftStr ? JSON.parse(hsCandidatesDraftStr) : null;
        } catch {
          return null;
        }
      })(),
      complianceDraft: {
        status: (reportData as any).compliance_status || "unknown",
        notes: (() => {
          try {
            const complianceNotesStr = (reportData as any).compliance_notes;
            return complianceNotesStr ? JSON.parse(complianceNotesStr) : [];
          } catch {
            return [];
          }
        })(),
      },
      labelConfirmed: (reportData as any).label_confirmed ?? false,
      complianceConfirmed: (reportData as any).compliance_confirmed ?? false,
      // Computed compliance status based on confirmation flags
      complianceStatus: (() => {
        const labelConfirmed = (reportData as any).label_confirmed ?? false;
        const complianceConfirmed = (reportData as any).compliance_confirmed ?? false;
        
        if (!labelConfirmed) {
          return "Incomplete" as const;
        }
        if (labelConfirmed && !complianceConfirmed) {
          return "Preliminary" as const;
        }
        // Never treat compliance as complete in V2
        return "Preliminary" as const;
      })(),
    },
  } as Report & {
    _priceUnit?: string;
    _similarRecordsCount?: number;
    _hsCandidatesCount?: number;
    _hasLandedCosts?: boolean;
    _supplierMatches?: any[];
    _recommendedMatches?: any[];
    _candidateMatches?: any[];
    _excludedMatches?: any[];
    _supplierRecommendedCount?: number;
    _supplierCandidateCount?: number;
    _supplierExcludedCount?: number;
    categoryFactories?: any[];
    _decisionSupport?: any;
  };

  const evidenceNormalized = normalizeEvidence({
    ...report,
    pipeline_result: pipelineResult,
    data: reportData.data,
    evidenceNormalized: (reportData as any).evidence_normalized || (reportData.data as any)?.evidenceNormalized,
    uploadAudit: pipelineResult?.uploadAudit,
  });

  const reportWithEvidence = {
    ...report,
    evidenceNormalized,
    v2: {
      ...report.v2,
      evidence: evidenceNormalized,
    },
  } as Report & { evidenceNormalized: any };

  // Build decision support
  const decisionSupport = buildDecisionSupport({
    hsCodeCandidates: normalizedHsCandidates,
    customsCategoryText: customsCategoryDraft?.value || null,
    baseline: report.baseline,
    shelfPrice: (reportData as any).shelf_price || null,
    evidenceLevel: evidenceLevel as any,
    similarRecordsCount: similarRecordsCount,
    category: reportData.category || "product",
    priceUnit: priceUnit,
    supplierMatchCount: validSupplierMatches?.length || 0,
  });

  // Attach decision support and supplier matches to report
  const reportWithDecision = {
    ...reportWithEvidence,
    _decisionSupport: decisionSupport,
    _supplierMatches: validSupplierMatches || [],
    supplierEmptyReason: pipelineResult?.supplierEmptyReason,
    supplierMatchMode: pipelineResult?.supplierMatchMode,
  };

  return NextResponse.json({
    success: true,
    reportId: reportData.id,
    report: reportWithDecision,
  });
}
