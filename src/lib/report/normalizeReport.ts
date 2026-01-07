/**
 * Normalize supplier matches from various report formats
 * Ensures UI always has a consistent supplier candidates array
 */

import { extractProductName } from "./extractProductName";

/**
 * Normalize a report object to ensure consistent structure
 * Applies supplier match normalization and ensures required fields exist
 */
export function normalizeReport(report: any): any {
  if (!report) {
    return report;
  }

  // Create a normalized copy
  const normalized = { ...report };

  // Ensure pipeline_result and scenarios exist
  if (!normalized.pipeline_result) {
    normalized.pipeline_result = {};
  }
  if (!normalized.pipeline_result.scenarios) {
    normalized.pipeline_result.scenarios = [];
  }

  // Normalize supplier matches
  const matches = getSupplierMatches(normalized);
  if (matches.length > 0) {
    normalized._supplierMatches = matches;
  }

  // Ensure productName exists (handle both camelCase and snake_case)
  // Extract readable name from JSON format if needed
  const rawProductName = normalized.productName || normalized.product_name;
  if (rawProductName) {
    const extractedName = extractProductName(rawProductName);
    normalized.productName = extractedName;
    normalized.product_name = extractedName;
  }

  // Ensure id exists
  if (!normalized.id && normalized.reportId) {
    normalized.id = normalized.reportId;
  }

  // Ensure baseline and costRange exist
  if (!normalized.baseline) {
    normalized.baseline = {};
  }
  if (!normalized.baseline.costRange) {
    normalized.baseline.costRange = {
      standard: { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0, totalLandedCost: 0 },
      conservative: { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0, totalLandedCost: 0 },
    };
  }
  // Ensure standard and conservative objects exist within costRange
  if (!normalized.baseline.costRange.standard) {
    normalized.baseline.costRange.standard = { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0, totalLandedCost: 0 };
  }
  if (!normalized.baseline.costRange.conservative) {
    normalized.baseline.costRange.conservative = { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0, totalLandedCost: 0 };
  }
  // Ensure all required properties exist in standard and conservative
  const defaultCostFields = { unitPrice: 0, shippingPerUnit: 0, dutyPerUnit: 0, feePerUnit: 0, totalLandedCost: 0 };
  normalized.baseline.costRange.standard = { ...defaultCostFields, ...normalized.baseline.costRange.standard };
  normalized.baseline.costRange.conservative = { ...defaultCostFields, ...normalized.baseline.costRange.conservative };

  // Normalize HS code fields from various sources
  // Check pipeline_result, baseline, signals, and marketEstimate
  const pipelineResult = normalized.pipeline_result || {};
  const baseline = normalized.baseline || {};
  const signals = normalized.signals || {};
  const marketEstimate = normalized._marketEstimate || pipelineResult.marketEstimate || baseline.marketEstimate;

  // Extract HS code (primary)
  if (!normalized._hs) {
    normalized._hs =
      normalized.hsCode ||
      normalized.hs_code ||
      pipelineResult.hs ||
      pipelineResult.hsCode ||
      pipelineResult.classification ||
      baseline.hsCode ||
      baseline.hs_code ||
      signals.hsCode ||
      marketEstimate?.hsCode ||
      null;
  }

  // Extract HS code candidates
  if (!normalized._hsCandidates || normalized._hsCandidates?.length === 0) {
    const candidates =
      normalized.hsCodeCandidates ||
      normalized.hs_code_candidates ||
      normalized._hsCandidates ||
      pipelineResult.hsCodeCandidates ||
      pipelineResult.hs_code_candidates ||
      pipelineResult.hsCandidates ||
      baseline.riskFlags?.tariff?.hsCodeRange ||
      marketEstimate?.hsCandidates ||
      null;

    if (candidates) {
      // Normalize candidates array format
      if (Array.isArray(candidates)) {
        normalized._hsCandidates = candidates.map((c: any) => {
          if (typeof c === "string") {
            return { code: c, confidence: 0.8, rationale: "From pipeline" };
          }
          return {
            code: c.code || c.hsCode || c,
            confidence: c.confidence || 0.8,
            rationale: c.rationale || c.reason || "From pipeline",
            evidenceSnippet: c.evidenceSnippet || null,
          };
        });
      } else {
        normalized._hsCandidates = [];
      }
    } else {
      normalized._hsCandidates = [];
    }
  }

  // Store HS candidates count for UI
  if (!normalized._hsCandidatesCount) {
    normalized._hsCandidatesCount = normalized._hsCandidates?.length || 0;
  }

  // Ensure _hsCandidates is always an array
  if (!Array.isArray(normalized._hsCandidates)) {
    normalized._hsCandidates = [];
  }
  
  // If HS candidates are missing and label is missing/unreadable, generate Draft candidates
  if ((normalized._hsCandidates.length === 0 || !normalized._hsCandidates) && normalized.productName) {
    const inputStatus = normalized.inputStatus || normalized.data?.inputStatus || normalized._proof?.inputStatus || normalized.extras?.inputStatus || {};
    const labelMissing = !inputStatus.labelPhotoUploaded || 
      inputStatus.labelOcrStatus === "failed" || 
      inputStatus.labelOcrStatus === "FAILED" ||
      !inputStatus.labelTextPresent;
    
    if (labelMissing) {
      try {
        const { generateDraftHsCandidates } = require("./localSimulators");
        normalized._hsCandidates = generateDraftHsCandidates(normalized);
        normalized._hsConfidence = 0.4; // Low confidence for Draft
      } catch (error) {
        console.warn("[normalizeReport] Failed to generate Draft HS candidates:", error);
      }
    }
  }
  
  // Resolve unit weight (will be done in analyze route, but ensure structure exists)
  if (!normalized._inputs) {
    normalized._inputs = {};
  }
  
  // If weight already resolved, keep it
  if (normalized._inputs.unitWeight) {
    // Already resolved
  } else {
    // Fallback to old resolved weight if exists
    if (normalized._resolvedWeight) {
      normalized._inputs.unitWeight = {
        grams: normalized._resolvedWeight,
        rangeGrams: normalized._resolvedWeightRange || { min: 0, max: 0 },
        source: normalized._resolvedWeightSource || "category_default",
        confidence: normalized._resolvedWeightSource === "user" || normalized._resolvedWeightSource === "label" ? 1.0 : 0.3,
        rationale: "Legacy weight data",
      };
    }
  }

  // Ensure decision summary exists (from data._decisionSummary or compute if missing)
  if (!normalized._decisionSummary) {
    // Try to get from data field
    normalized._decisionSummary = normalized.data?._decisionSummary || null;
  }

  // Pick verdict template deterministically if not already set
  if (!normalized._verdictText || !normalized._verdictTemplateId) {
    try {
      const { pickVerdictTemplate } = require("./pickVerdictTemplate");
      const reportId = normalized.id || normalized.reportId || "unknown";
      const category = normalized.category || normalized.baseline?.category || "unknown";
      
      // Extract data quality signals
      const inputStatus = normalized.inputStatus || normalized.data?.inputStatus || normalized._proof?.inputStatus || normalized.extras?.inputStatus || {};
      const supplierMatches = getSupplierMatches(normalized);
      
      // Determine compliance trigger (check for electronics, batteries, toys with regulations)
      const categoryLower = category.toLowerCase();
      const complianceTriggerSuspected = 
        categoryLower.includes("electronics") ||
        categoryLower.includes("battery") ||
        categoryLower.includes("toy") ||
        categoryLower.includes("hybrid") ||
        (normalized.baseline?.riskFlags?.compliance?.hasRisk === true);
      
      // Calculate margin estimate if possible
      const costRange = normalized.baseline?.costRange || {};
      const bestEstimate = costRange.standard?.totalLandedCost || 0;
      const targetSellPrice = normalized.targetSellPrice || normalized._priceUnit || null;
      const marginEstimate = targetSellPrice && bestEstimate > 0 
        ? ((targetSellPrice - bestEstimate) / targetSellPrice) * 100 
        : null;
      
      const verdictResult = pickVerdictTemplate({
        reportId,
        category,
        decision: normalized._decisionSummary?._verdict?.decision || "GO", // Use existing decision if available
        dataQuality: {
          hasBarcode: !!(inputStatus.barcodePhotoUploaded || inputStatus.barcodeDecoded || inputStatus.barcode),
          hasLabel: !!(inputStatus.labelPhotoUploaded),
          labelReadable: inputStatus.labelOcrStatus === "SUCCESS" || inputStatus.labelOcrStatus === "success",
          hasWeight: !!(inputStatus.weightGrams && !inputStatus.weightDefaultUsed),
          hasBoxSize: !!(inputStatus.boxSize && !inputStatus.boxSizeDefaultUsed),
          supplierMatches: supplierMatches.length,
          exactMatches: supplierMatches.filter((m: any) => (m.exact_match_count || 0) > 0).length,
          marginEstimate,
          complianceTriggerSuspected,
        },
      });
      
      normalized._verdictText = verdictResult.text;
      normalized._verdictTemplateId = verdictResult.templateId;
      
      // Also update decision summary if it exists
      if (normalized._decisionSummary?._verdict) {
        normalized._decisionSummary._verdict._templateId = verdictResult.templateId;
        normalized._decisionSummary._verdict._templateText = verdictResult.text;
      }
    } catch (error) {
      // Silently fail if template picking fails
      console.warn("[normalizeReport] Failed to pick verdict template:", error);
    }
  }

  // Pick report nudge (next best action and tip) if not already set
  if (!normalized._nudge) {
    try {
      const { pickReportNudge } = require("./pickReportNudges");
      normalized._nudge = pickReportNudge(normalized);
    } catch (error) {
      // Silently fail if nudge picking fails
      console.warn("[normalizeReport] Failed to pick report nudge:", error);
    }
  }

  // Extract HS decision (primary HS code choice)
  if (!normalized._hsDecision) {
    // Use first candidate if available, or the primary HS code
    const primaryHs = normalized._hsCandidates?.[0]?.code || normalized._hs || null;
    normalized._hsDecision = primaryHs;
  }

  // Extract duty range from decisionSupport or baseline
  if (!normalized._dutyRange) {
    const decisionSupport = normalized._decisionSupport || normalized.extras?.decisionSupport;
    if (decisionSupport?.dutyRate) {
      normalized._dutyRange = {
        min: decisionSupport.dutyRate.rateMin || 0,
        max: decisionSupport.dutyRate.rateMax || 0,
        rationale: decisionSupport.dutyRate.rationale || "",
        status: decisionSupport.dutyRate.status || "DRAFT",
      };
    } else {
      // Try to extract from baseline or pipeline_result
      const baselineDuty = baseline.riskFlags?.tariff?.dutyRate;
      const pipelineDuty = pipelineResult.dutyRate;
      
      if (baselineDuty || pipelineDuty) {
        const duty = baselineDuty || pipelineDuty;
        normalized._dutyRange = {
          min: typeof duty === "number" ? duty : duty?.min || 0,
          max: typeof duty === "number" ? duty : duty?.max || duty || 0,
          rationale: duty?.rationale || "Estimated from category",
          status: "DRAFT",
        };
      } else {
        normalized._dutyRange = null;
      }
    }
  }

  return normalized;
}

export interface NormalizedSupplierMatch {
  id: string;
  supplierName: string;
  supplierId: string;
  supplier_id: string;
  supplier_name: string;
  exact_match_count: number;
  inferred_match_count: number;
  _intel: {
    product_count: number;
    price_coverage_pct: number;
    last_seen_days: number | null;
  };
  _profile: {
    country: string | null;
    last_seen_date: string | null;
    shipment_count_12m: number | null;
    role: string | null;
    role_reason: string | null;
  };
  _supplierType: string | null;
  _companyType: string | null;
  _exampleProducts: Array<{
    product_name: string;
    category?: string;
    unit_price?: number;
  }>;
  // Preserve all other fields from original match
  [key: string]: any;
}

/**
 * Get supplier matches from report, normalizing from various sources
 * Priority:
 * 1. report._supplierMatches (if non-empty array)
 * 2. report._recommendedMatches + report._candidateMatches combined
 * 3. report.supplierMatches or report.supplier_matches (legacy)
 */
export function getSupplierMatches(report: any): NormalizedSupplierMatch[] {
  try {
    // Priority 1: Use _supplierMatches if it's a non-empty array
    if (Array.isArray(report._supplierMatches) && report._supplierMatches.length > 0) {
      return report._supplierMatches.map((match: any, index: number) => {
        try {
          return normalizeMatch(match, index);
        } catch (matchError) {
          console.warn("[getSupplierMatches] Error normalizing match, skipping:", {
            index,
            error: matchError instanceof Error ? matchError.message : String(matchError),
          });
          return null;
        }
      }).filter((match): match is NormalizedSupplierMatch => match !== null);
    }

    // Priority 2: Combine _recommendedMatches and _candidateMatches
    const recommended = Array.isArray(report._recommendedMatches) ? report._recommendedMatches : [];
    const candidates = Array.isArray(report._candidateMatches) ? report._candidateMatches : [];
    
    if (recommended.length > 0 || candidates.length > 0) {
      const combined = [...recommended, ...candidates];
      return combined.map((match: any, index: number) => {
        try {
          return normalizeMatch(match, index);
        } catch (matchError) {
          console.warn("[getSupplierMatches] Error normalizing match, skipping:", {
            index,
            error: matchError instanceof Error ? matchError.message : String(matchError),
          });
          return null;
        }
      }).filter((match): match is NormalizedSupplierMatch => match !== null);
    }

    // Priority 3: Fallback to legacy fields
    const legacyMatches = report.supplierMatches || report.supplier_matches || report.pipeline_result?.supplier_matches;
    if (Array.isArray(legacyMatches) && legacyMatches.length > 0) {
      return legacyMatches.map((match: any, index: number) => {
        try {
          return normalizeMatch(match, index);
        } catch (matchError) {
          console.warn("[getSupplierMatches] Error normalizing match, skipping:", {
            index,
            error: matchError instanceof Error ? matchError.message : String(matchError),
          });
          return null;
        }
      }).filter((match): match is NormalizedSupplierMatch => match !== null);
    }

    // No matches found
    return [];
  } catch (error) {
    console.error("[getSupplierMatches] Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Normalize a single supplier match to guarantee required keys exist
 */
function normalizeMatch(match: any, index: number): NormalizedSupplierMatch {
  try {
    // Ensure match is an object
    if (!match || typeof match !== "object") {
      throw new Error(`Invalid match object at index ${index}`);
    }

    // Extract id with safe fallbacks
    // prefer match.id, else match.supplier_id, else match.supplierId, else build `sample-${index}`
    const id = match.id || match.supplier_id || match.supplierId || `sample-${index}`;
    
    // Extract supplierName with safe fallbacks
    // Priority: Real trade data names (shipper_name, company_name) > supplier_name > supplierName > others
    // Remove synthetic_ prefix if present, but preserve actual company names from ImportKey trade data
    let supplierName = match.shipper_name || match.company_name || match.supplier_name || match.supplierName || match.supplier?.name || match.companyName || match.name || "Unknown supplier";
    
    // Ensure supplierName is a string
    if (typeof supplierName !== "string") {
      supplierName = String(supplierName || "Unknown supplier");
    }
    
    // Remove synthetic_ prefix only if it's actually a synthetic ID (not a real company name)
    if (supplierName && !supplierName.startsWith("synthetic_") && match.supplier_id?.startsWith("synthetic_")) {
      // Keep the name as-is if it's a real company name (even if supplier_id is synthetic)
      // This preserves actual ImportKey trade data company names
    } else if (supplierName.startsWith("synthetic_")) {
      // Only remove prefix if the name itself starts with synthetic_
      supplierName = supplierName.replace(/^synthetic_/i, "").trim() || supplierName;
    }
    
    // Extract supplierId with safe fallbacks
    // prefer match.supplier_id, else match.supplierId, else match.id
    const supplierId = match.supplier_id || match.supplierId || match.id || id;
    
    // Also set normalized snake_case versions for consistency
    const supplier_id = supplierId;
    const supplier_name = supplierName;

    // Extract match counts with safe fallbacks
    const exact_match_count = typeof match.exact_match_count === "number" ? match.exact_match_count : 
                              typeof match.exactMatchCount === "number" ? match.exactMatchCount : 0;
    const inferred_match_count = typeof match.inferred_match_count === "number" ? match.inferred_match_count : 
                                typeof match.inferredMatchCount === "number" ? match.inferredMatchCount : 0;

    // Normalize _intel with safe fallbacks
    const _intel = {
      product_count: typeof match._intel?.product_count === "number" ? match._intel.product_count :
                     typeof match._intel?.productCount === "number" ? match._intel.productCount : 0,
      price_coverage_pct: typeof match._intel?.price_coverage_pct === "number" ? match._intel.price_coverage_pct :
                          typeof match._intel?.priceCoveragePct === "number" ? match._intel.priceCoveragePct : 0,
      last_seen_days: typeof match._intel?.last_seen_days === "number" ? match._intel.last_seen_days :
                      typeof match._intel?.lastSeenDays === "number" ? match._intel.lastSeenDays : null,
    };

    // Normalize _profile with safe fallbacks
    const _profile = {
      country: typeof match._profile?.country === "string" ? match._profile.country :
                 typeof match.country === "string" ? match.country : null,
      last_seen_date: typeof match._profile?.last_seen_date === "string" ? match._profile.last_seen_date :
                      typeof match._profile?.lastSeenDate === "string" ? match._profile.lastSeenDate :
                      typeof match.last_seen_date === "string" ? match.last_seen_date : null,
      shipment_count_12m: typeof match._profile?.shipment_count_12m === "number" ? match._profile.shipment_count_12m :
                         typeof match._profile?.shipmentCount12m === "number" ? match._profile.shipmentCount12m :
                         typeof match.shipment_count_12m === "number" ? match.shipment_count_12m : null,
      role: typeof match._profile?.role === "string" ? match._profile.role :
            typeof match.role === "string" ? match.role :
            typeof match.supplierRole === "string" ? match.supplierRole : null,
      role_reason: typeof match._profile?.role_reason === "string" ? match._profile.role_reason :
                   typeof match._profile?.roleReason === "string" ? match._profile.roleReason :
                   typeof match.role_reason === "string" ? match.role_reason : null,
    };

    // Normalize supplier/company types
    const _supplierType = typeof match._supplierType === "string" ? match._supplierType :
                          typeof match.supplierType === "string" ? match.supplierType :
                          typeof match.supplierRole === "string" ? match.supplierRole : null;
    const _companyType = typeof match._companyType === "string" ? match._companyType :
                         typeof match.companyType === "string" ? match.companyType : null;

    // Normalize example products (max 2)
    let _exampleProducts: Array<{ product_name: string; category?: string; unit_price?: number }> = [];
    if (Array.isArray(match._exampleProducts)) {
      _exampleProducts = match._exampleProducts.slice(0, 2).map((p: any) => ({
        product_name: typeof p.product_name === "string" ? p.product_name :
                      typeof p.productName === "string" ? p.productName : "",
        category: typeof p.category === "string" ? p.category : undefined,
        unit_price: typeof p.unit_price === "number" ? p.unit_price :
                    typeof p.unitPrice === "number" ? p.unitPrice : undefined,
      }));
    }

    // Return normalized match with all original fields preserved
    return {
      ...match,
      id,
      supplierName,
      supplierId,
      supplier_id,
      supplier_name,
      exact_match_count,
      inferred_match_count,
      _intel,
      _profile,
      _supplierType,
      _companyType,
      _exampleProducts,
    };
  } catch (error) {
    console.error("[normalizeMatch] Error normalizing match:", {
      index,
      error: error instanceof Error ? error.message : String(error),
      match: match ? JSON.stringify(match).substring(0, 200) : "null",
    });
    // Return a minimal valid match to prevent complete failure
    return {
      id: `error-${index}`,
      supplierName: "Unknown supplier",
      supplierId: `error-${index}`,
      supplier_id: `error-${index}`,
      supplier_name: "Unknown supplier",
      exact_match_count: 0,
      inferred_match_count: 0,
      _intel: { product_count: 0, price_coverage_pct: 0, last_seen_days: null },
      _profile: { country: null, last_seen_date: null, shipment_count_12m: null, role: null, role_reason: null },
      _supplierType: null,
      _companyType: null,
      _exampleProducts: [],
    };
  }
}

