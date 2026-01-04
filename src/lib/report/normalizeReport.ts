/**
 * Normalize supplier matches from various report formats
 * Ensures UI always has a consistent supplier candidates array
 */

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

  // Normalize supplier matches
  const matches = getSupplierMatches(normalized);
  if (matches.length > 0) {
    normalized._supplierMatches = matches;
  }

  // Ensure productName exists (handle both camelCase and snake_case)
  if (!normalized.productName && normalized.product_name) {
    normalized.productName = normalized.product_name;
  }
  if (!normalized.product_name && normalized.productName) {
    normalized.product_name = normalized.productName;
  }

  // Ensure id exists
  if (!normalized.id && normalized.reportId) {
    normalized.id = normalized.reportId;
  }

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
  // Priority 1: Use _supplierMatches if it's a non-empty array
  if (Array.isArray(report._supplierMatches) && report._supplierMatches.length > 0) {
    return report._supplierMatches.map((match: any, index: number) => normalizeMatch(match, index));
  }

  // Priority 2: Combine _recommendedMatches and _candidateMatches
  const recommended = Array.isArray(report._recommendedMatches) ? report._recommendedMatches : [];
  const candidates = Array.isArray(report._candidateMatches) ? report._candidateMatches : [];
  
  if (recommended.length > 0 || candidates.length > 0) {
    const combined = [...recommended, ...candidates];
    return combined.map((match: any, index: number) => normalizeMatch(match, index));
  }

  // Priority 3: Fallback to legacy fields
  const legacyMatches = report.supplierMatches || report.supplier_matches;
  if (Array.isArray(legacyMatches) && legacyMatches.length > 0) {
    return legacyMatches.map((match: any, index: number) => normalizeMatch(match, index));
  }

  // No matches found
  return [];
}

/**
 * Normalize a single supplier match to guarantee required keys exist
 */
function normalizeMatch(match: any, index: number): NormalizedSupplierMatch {
  // Extract id with safe fallbacks
  // prefer match.id, else match.supplier_id, else match.supplierId, else build `sample-${index}`
  const id = match.id || match.supplier_id || match.supplierId || `sample-${index}`;
  
  // Extract supplierName with safe fallbacks
  // prefer match.supplier_name, else match.supplierName, else match.supplier?.name, else "Unknown supplier"
  const supplierName = match.supplier_name || match.supplierName || match.supplier?.name || match.companyName || "Unknown supplier";
  
  // Extract supplierId with safe fallbacks
  // prefer match.supplier_id, else match.supplierId, else match.id
  const supplierId = match.supplier_id || match.supplierId || match.id || id;
  
  // Also set normalized snake_case versions for consistency
  const supplier_id = supplierId;
  const supplier_name = supplierName;

  // Extract match counts
  const exact_match_count = match.exact_match_count || match.exactMatchCount || 0;
  const inferred_match_count = match.inferred_match_count || match.inferredMatchCount || 0;

  // Normalize _intel
  const _intel = {
    product_count: match._intel?.product_count || match._intel?.productCount || 0,
    price_coverage_pct: match._intel?.price_coverage_pct || match._intel?.priceCoveragePct || 0,
    last_seen_days: match._intel?.last_seen_days ?? match._intel?.lastSeenDays ?? null,
  };

  // Normalize _profile
  const _profile = {
    country: match._profile?.country || match.country || null,
    last_seen_date: match._profile?.last_seen_date || match._profile?.lastSeenDate || match.last_seen_date || null,
    shipment_count_12m: match._profile?.shipment_count_12m || match._profile?.shipmentCount12m || match.shipment_count_12m || null,
    role: match._profile?.role || match.role || match.supplierRole || null,
    role_reason: match._profile?.role_reason || match._profile?.roleReason || match.role_reason || null,
  };

  // Normalize supplier/company types
  const _supplierType = match._supplierType || match.supplierType || match.supplierRole || null;
  const _companyType = match._companyType || match.companyType || null;

  // Normalize example products (max 2)
  let _exampleProducts: Array<{ product_name: string; category?: string; unit_price?: number }> = [];
  if (Array.isArray(match._exampleProducts)) {
    _exampleProducts = match._exampleProducts.slice(0, 2).map((p: any) => ({
      product_name: p.product_name || p.productName || "",
      category: p.category,
      unit_price: p.unit_price || p.unitPrice,
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
}

