// @ts-nocheck
// ============================================================================
// Report Types - Model-Proof Schema
// ============================================================================

/**
 * Schema version for report compatibility
 * Increment when adding/renaming fields to maintain backward compatibility
 */
export const REPORT_SCHEMA_VERSION = 1;

/**
 * Normalized Report - the stable contract that UI and DB depend on
 * This is model-agnostic and computed from raw model output
 */
export interface Report {
  // Schema versioning
  schemaVersion: number;
  
  // Core product info
  id: string;
  productName: string;
  summary: string;
  category: string;
  confidence: "low" | "medium" | "high"; // Model confidence (raw, for reference)
  
  // Product classification confidence (0-1)
  categoryConfidence?: number;
  
  // Evidence ladder level (determines credibility)
  evidenceLevel: "verified_quote" | "exact_import" | "similar_import" | "category_prior";
  
  // Estimate quality badge
  estimateQuality?: "preliminary" | "trade_backed" | "verified";
  
  // Input status tracking (source of truth)
  inputStatus?: {
    productPhotoUploaded: boolean;
    barcodePhotoUploaded: boolean;
    labelPhotoUploaded: boolean;
    barcodeDecoded: boolean;
    labelOcrStatus: "success" | "failed" | "skipped" | "pending";
    labelOcrFailureReason?: string | null;
    unitWeight: number | null; // in grams
    shelfPrice: number | null; // in USD
    unitsPerCase: number | null;
    countryOfOrigin: string | null;
    // Manual label entry (from OCR fallback)
    labelDetailsEntered?: {
      netWeight?: number;
      unitsPerCase?: number;
      countryOfOrigin?: string;
      manufacturerOrDistributedBy?: string;
      allergens?: string;
      ingredientsShort?: string;
      enteredAt?: string;
    };
    // Vision extraction fallback (when OCR fails)
    labelDraft?: {
      brand_name?: { value: string | null; confidence: number; evidence: string };
      product_name?: { value: string | null; confidence: number; evidence: string };
      net_weight_value?: { value: number | null; confidence: number; evidence: string };
      net_weight_unit?: { value: string | null; confidence: number; evidence: string };
      country_of_origin?: { value: string | null; confidence: number; evidence: string };
      allergens_list?: { value: string[] | null; confidence: number; evidence: string };
      ingredients_summary?: { value: string | null; confidence: number; evidence: string };
    };
    labelExtractionSource?: "OCR" | "VISION" | "MANUAL";
    labelExtractionStatus?: "DRAFT" | "CONFIRMED";
    labelVisionExtractionAttempted?: boolean;
    labelVisionExtractionAt?: string | null;
    labelConfirmedAt?: string | null;
    labelConfirmedFields?: {
      country_of_origin?: string | null;
      allergens_list?: string[] | null;
      net_weight_value?: number | null;
      net_weight_unit?: string | null;
    };
  };
  
  // Gemini inference draft fields with trust-safe gating
  criticalConfirm?: {
    originCountry: { value: string | null; confirmed: boolean; source: "VISION" | "MANUAL" | "OCR" | "NONE"; confidence: number | null; evidenceSnippet: string | null };
    netWeight: { value: string | null; confirmed: boolean; source: "VISION" | "MANUAL" | "OCR" | "NONE"; confidence: number | null; evidenceSnippet: string | null };
    allergens: { value: string | null; confirmed: boolean; source: "VISION" | "MANUAL" | "OCR" | "NONE"; confidence: number | null; evidenceSnippet: string | null };
  };
  
  barcodeDraft?: { value: string | null; confidence: number; evidenceSnippet: string } | null;
  barcodeExtractionSource?: "OCR" | "VISION" | "MANUAL" | "NONE";
  barcodeExtractionStatus?: "CONFIRMED" | "DRAFT" | "FAILED" | "NONE";
  
  weightDraft?: { value: number | null; unit: "g" | "oz"; confidence: number; evidenceSnippet: string } | null;
  
  casePackDraft?: {
    candidates: Array<{ value: number; confidence: number; evidenceSnippet: string }>;
    chosen: number | null;
    confirmed: boolean;
  } | null;
  
  customsCategoryDraft?: { value: string | null; confidence: number; evidenceSnippet: string } | null;
  
  hsCandidatesDraft?: Array<{ code: string; confidence: number; rationale: string; evidenceSnippet: string }> | null;
  
  complianceStatus?: "INCOMPLETE" | "PRELIMINARY" | "COMPLETE";
  complianceNotes?: Array<{ level: "info" | "warn"; text: string }>;
  
  // Additional product details (optional, for sample plan requests)
  upc?: string | null;
  materialsAndDimensions?: string | null;
  packagingAndPrinting?: string | null;
  hasBackLabelPhoto?: boolean;
  certificationsNeeded?: string[] | null;
  
  // Evidence signals (model-agnostic, determines Evidence Level)
  signals: {
    hasImportEvidence: boolean;
    hasInternalSimilarRecords: boolean;
    hasSupplierCandidates: boolean;
    verificationStatus: "none" | "requested" | "verifying" | "quoted" | "completed";
  };

  // Extraction surface (derived from pipeline data; truth-safe for UI)
  hasBarcodeImage?: boolean;
  hasLabelImage?: boolean;
  barcodeValue?: string | null;
  weightGrams?: number | null;
  originCountry?: string | null;
  labelTerms?: string[] | null;
  labelTextPresent?: boolean;
  
  // Baseline estimate (computed from assumptions and ranges)
  baseline: {
    costRange: {
      conservative: {
        unitPrice: number;
        shippingPerUnit: number;
        dutyPerUnit: number;
        feePerUnit: number;
        totalLandedCost: number;
      };
      standard: {
        unitPrice: number;
        shippingPerUnit: number;
        dutyPerUnit: number;
        feePerUnit: number;
        totalLandedCost: number;
      };
      range?: {
        shippingPerUnit?: { p10: number; p50: number; p90: number };
        dutyPerUnit?: { p10: number; p50: number; p90: number };
        feePerUnit?: { p10: number; p50: number; p90: number };
        totalLandedCost?: { p10: number; p50: number; p90: number };
        billableWeightKg?: { p10: number; p50: number; p90: number };
      };
    };
    
    // Risk scores (0-100, higher = more risk)
    riskScores: {
      tariff: number;
      compliance: number;
      supply: number;
      total: number;
    };
    
    // Risk details
    riskFlags: {
      tariff: {
        hsCodeRange: string[];
        adCvdPossible: boolean;
        originSensitive: boolean;
      };
      compliance: {
        requiredCertifications: string[];
        labelingRisks: string[];
        recallHints: string[];
      };
      supply: {
        moqRange: { min: number; max: number; typical: number };
        leadTimeRange: { min: number; max: number; typical: number };
        qcChecks: string[];
      };
    };
    
    // Evidence sources
    evidence: {
      types: ("similar_records" | "category_based" | "regulation_check")[];
      assumptions: {
        packaging: string;
        weight: string;
        volume: string;
        incoterms: string;
        shippingMode: string;
        unitsPerCase?: string;
      };
      // Inferred inputs for cost model (V2)
      inferredInputs?: {
        shippingMode?: {
          value: "air" | "ocean";
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        unitWeightG?: {
          value: number;
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        unitVolumeM3?: {
          value: number;
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        cartonPack?: {
          value: number;
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        billableWeightKg?: {
          value: number;
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        dutyRate?: {
          value: number;
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        feesPerUnit?: {
          value: number;
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        shippingPerUnit?: {
          value: number;
          source: "assumed" | "from_category" | "from_customs" | "from_hs_estimate";
          confidence: number;
          explanation: string;
          range?: { p10: number; p50: number; p90: number };
          provenance?: string;
        };
        unitsPerCase?: number;
      };
      // Evidence upgrade tracking
      items: EvidenceItem[];
      lastAttemptAt: string | null;
      lastSuccessAt: string | null;
      lastResult: "found" | "none" | "error" | null;
      lastErrorCode: string | null;
    };
  };
  
  // Verification state (empty until verification is requested/completed)
  verification: {
    status: "not_requested" | "requested" | "verifying" | "quoted" | "done";
    requestedAt?: string;
    completedAt?: string;
    
    // Verified quote (only populated when status is "quoted" or "done")
    verifiedQuote?: {
      unitPrice: number;
      shippingPerUnit: number;
      dutyPerUnit: number;
      feePerUnit: number;
      totalLandedCost: number;
      factoryName: string;
      factoryId: string;
      moq: number;
      leadTime: number;
      certifications: string[];
      quoteDate: string;
      validUntil: string;
    };
  };
  
  // Next actions
  nextActions: Array<{
    title: string;
    description: string;
    estimatedTime: string;
  }>;
  
  // Verified quotes (only populated when verification status is "quoted" or "done")
  verifiedQuotes?: {
    suppliers: SupplierQuote[];
    updatedAt?: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // Raw model output (for audit/debugging, optional)
  _rawModelOutput?: unknown;
  
  // V2 normalized data (optional, added by API)
  v2?: {
    costModel: {
      standard: {
        unitPrice: number;
        shippingPerUnit: number;
        dutyPerUnit: number;
        feePerUnit: number;
        totalLandedCost: number;
      };
      conservative: {
        unitPrice: number;
        shippingPerUnit: number;
        dutyPerUnit: number;
        feePerUnit: number;
        totalLandedCost: number;
      };
    };
    deliveredCostRange: {
      min: number;
      max: number;
    };
    hsCandidates: Array<{ code: string; confidence: number; rationale: string; evidenceSnippet: string }>;
    evidenceLevel: "verified_quote" | "exact_import" | "similar_import" | "category_prior";
    missingInputs: string[];
    importKeyCompanies: Array<{
      companyName: string;
      role: string;
      shipmentsCount: number;
      lastSeen: string | null;
      originCountry: string | null;
      exampleDescription: string | null;
      source: string;
    }>;
    evidence?: any;
  };
  
  // Extended properties (added by API)
  _supplierMatches?: any[];
  _recommendedMatches?: any[];
  _candidateMatches?: any[];
  _excludedMatches?: any[];
  _supplierRecommendedCount?: number;
  _supplierCandidateCount?: number;
  _supplierExcludedCount?: number;
  categoryFactories?: any[];
  _proof?: {
    hsCode: string | null;
    hsConfidence: number;
    labelTerms: string[];
    labelUploaded?: boolean;
    labelOcrStatus?: string;
    labelOcrFailureReason?: string | null;
    labelTermsFromDb?: string[];
    labelOcrCheckedAt?: string | null;
    similarImportsCount: number;
    leadsCount: number;
    evidenceLevel: "high" | "medium" | "low";
  };
  draftInference?: {
    weightDraft?: { value: number | null; unit: "g" | "oz"; confidence: number; evidenceSnippet: string };
    casePackDraft?: {
      candidates: Array<{ value: number; confidence: number; evidenceSnippet: string }>;
      selectedValue?: number;
      selectedConfidence?: number;
      chosen?: number | null;
      confirmed?: boolean;
    };
    customsCategoryDraft?: { value: string | null; confidence: number; evidenceSnippet: string };
    hsCandidatesDraft?: Array<{ code: string; confidence: number; rationale: string; evidenceSnippet: string }>;
  };
}

export interface ReportResponse {
  success: boolean;
  data: Report;
  error?: string;
}

/**
 * Raw model output from different AI providers
 * These are model-specific and should be normalized via adapters
 */
export interface RawGeminiOutput {
  provider: "gemini";
  model: string;
  productName: string;
  category: string;
  hsCode: string | null;
  description: string;
  keywords: string[];
  attributes?: Record<string, string>;
  rawResponse: unknown;
}

export interface RawOpenAIOutput {
  provider: "openai";
  model: string;
  // Add OpenAI-specific fields as needed
  rawResponse: unknown;
}

export interface RawClaudeOutput {
  provider: "claude";
  model: string;
  // Add Claude-specific fields as needed
  rawResponse: unknown;
}

export type RawModelOutput = RawGeminiOutput | RawOpenAIOutput | RawClaudeOutput;

/**
 * Evidence Item - represents a single piece of evidence from import records or internal DB
 */
export interface EvidenceItem {
  id: string;
  source: "us_import_records" | "internal_db";
  title: string;
  summary: string;
  strength: "low" | "medium" | "high";
  observed: {
    lastSeenDate: string | null;
    likelyOrigins: string[];
    typicalLotRange: {
      min: number | null;
      max: number | null;
      unit: "units";
    };
    matchedBy: ("hs" | "keywords" | "category")[];
  };
}

/**
 * Supplier Quote - Verified quote from a supplier
 */
export interface SupplierQuote {
  id: string;
  supplierName: string;
  country: string;
  supplierType: "manufacturer" | "trading";
  quoteMin: number;
  quoteMax: number;
  currency: "USD";
  incoterms: "FOB";
  moq: number;
  leadTimeDays: number;
  sampleAvailable: boolean;
  certifications: string[];
  riskFlags: string[];
  notes?: string;
  supplierWhatsApp?: string | null; // E.164 without plus preferred, ex "8613812345678"
  supplierEmail?: string | null;
  supplierContactName?: string | null;
}

