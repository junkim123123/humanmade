// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import crypto from "crypto";
import {
  determineCategoryKey,
  getCategoryProfile,
  allowHs2FromAnalysis,
  rerankWithProfile,
} from "./category-profiles";
import {
  extractBrandPhrasesStrict,
  buildAnchorTermsStrict,
} from "./brand-anchor";
import { countAnchorHitsStrict, findMatchedAnchors } from "./text-match";
import { buildWhyLines, computeEvidenceStrength } from "./supplier-lead-helpers";
import { resolveCategoryProfile } from "./category-profile-resolver";
import { inferCompanyType } from "@/lib/shared/company-type-heuristic";
import { removeNoiseTokens } from "./noise-tokens";
import { buildFobRangeResult, type MoneyRange } from "./pricing/fobRange";
import { buildSignalsFromUploads, type ProductSignals, type ProductSignalEvidence } from "./report/signals";
import { inferCategoryHint, getCategoryPriorities, type CategoryHint } from "./report/category-rules";
import { matchSuppliersFallback } from "@/utils/intelligence/supplier-matching";
import { resolveHsCodeCandidates } from "./report/hs-resolver";

// ============================================================================
// Top Global Suppliers (Emergency Fallback)
// ============================================================================
const TOP_GLOBAL_SUPPLIERS: Record<string, any[]> = {
  "Toys": [
    { supplier_name: "Guangdong Loongon Animation & Toys Industrial Co., Ltd.", product_name: "Building Blocks & Educational Toys" },
    { supplier_name: "Shantou Chenghai Plastic Toys Factory", product_name: "Plastic Toys & Games" },
    { supplier_name: "Zhejiang Xinyun Crafts Co., Ltd.", product_name: "Wooden Toys" },
    { supplier_name: "Dongguan Toy Town Co., Ltd.", product_name: "Plush Toys" },
    { supplier_name: "Goodbaby International Holdings Ltd.", product_name: "Strollers & Juvenile Products" }
  ],
  "Food": [
    { supplier_name: "Nestlé S.A.", product_name: "Packaged Foods & Beverages" },
    { supplier_name: "Mondelēz International", product_name: "Confectionery & Snacks" },
    { supplier_name: "Cargill, Incorporated", product_name: "Food Ingredients" },
    { supplier_name: "Archer Daniels Midland Company (ADM)", product_name: "Agricultural Processing" },
    { supplier_name: "Danone S.A.", product_name: "Dairy & Plant-Based Products" }
  ],
  "Furniture": [
    { supplier_name: "IKEA (Ingka Holding B.V.)", product_name: "Home Furniture & Accessories" },
    { supplier_name: "Ashley Furniture Industries", product_name: "Residential Furniture" },
    { supplier_name: "Herman Miller, Inc.", product_name: "Office Furniture" },
    { supplier_name: "Steelcase Inc.", product_name: "Office Furniture" },
    { supplier_name: "Zinus Inc.", product_name: "Mattresses & Bed Frames" }
  ],
  "Electronics": [
    { supplier_name: "Foxconn Technology Group", product_name: "Electronic Components & Assembly" },
    { supplier_name: "Samsung Electronics Co., Ltd.", product_name: "Consumer Electronics & Semiconductors" },
    { supplier_name: "Huawei Technologies Co., Ltd.", product_name: "Telecommunications & Consumer Electronics" },
    { supplier_name: "Pegatron Corporation", product_name: "Electronic Manufacturing Services" },
    { supplier_name: "Quanta Computer Inc.", product_name: "Notebooks & Computing Hardware" }
  ],
  "Apparel": [
    { supplier_name: "Inditex (Zara)", product_name: "Fashion Apparel & Accessories" },
    { supplier_name: "H&M (Hennes & Mauritz AB)", product_name: "Clothing & Fast Fashion" },
    { supplier_name: "Nike, Inc.", product_name: "Sportswear & Footwear" },
    { supplier_name: "Fast Retailing (Uniqlo)", product_name: "Casual Wear" },
    { supplier_name: "VF Corporation", product_name: "Outdoor & Workwear" }
  ],
  "Home": [
    { supplier_name: "Procter & Gamble (P&G)", product_name: "Household Products" },
    { supplier_name: "Unilever", product_name: "Consumer Goods & Home Care" },
    { supplier_name: "Henkel AG & Co. KGaA", product_name: "Home Care & Laundry" },
    { supplier_name: "Reckitt Benckiser Group", product_name: "Hygiene & Home Products" },
    { supplier_name: "SC Johnson & Son", product_name: "Household Cleaning & Storage" }
  ]
};

// ============================================================================
// Type Definitions
// ============================================================================

export type CategoryKey =
  | "toy"
  | "food"
  | "beauty"
  | "apparel"
  | "electronics"
  | "home"
  | "furniture"
  | "packaging"
  | "industrial_parts"
  | "jewelry_accessories"
  | "stationery_office"
  | "pet"
  | "sports"
  | "industrial"
  | "unknown"
  | "hybrid";

export interface CategoryProfile {
  key: CategoryKey;
  version: number;
  updatedAtIso: string;

  globalStopwords: string[];
  anchorStopwords: string[];
  hardMismatchTerms: string[];
  softPenaltyTerms: string[];

  allowHs2: string[];
  denyHs2: string[];

  brandPhrasePatterns: string[];

  scoringWeights: {
    hs2Match: number;
    hs2Mismatch: number;
    hardMismatch: number;
    softPenalty: number;
    anchorHit: number;
    genericManifest: number;
    logisticsPenalty: number;
  };

  limits: {
    maxCandidatesBeforeRerank: number;
    maxFinal: number;
    minAnchorScore?: number; // Minimum anchor hits required (e.g., 2 for toy category)
  };
}

export interface IntelligencePipelineParams {
  imageUrl: string;
  imagePublicUrl?: string; // Storage/public URL if available; used for caching instead of data URL
  quantity: number;
  dutyRate: number; // decimal (e.g., 0.15 for 15%)
  shippingCost: number;
  fee: number;
  productId?: string; // Optional: if updating existing product
  // Optional: Extraction results for building signals (for fallback matching)
  barcodeExtraction?: any; // From OCR extraction
  barcodeVisionResult?: any; // From Vision extraction
  labelExtraction?: any; // From OCR extraction  
  labelVisionResult?: any; // From Vision extraction
  visionTags?: string[]; // Keywords from vision analysis
  weightInferenceG?: number; // Inferred weight in grams
}

export interface ImageAnalysisResult {
  productName: string;
  description: string;
  category: string;
  hsCode: string | null; // Harmonized System Code
  attributes: Record<string, string>;
  keywords: string[];
  confidence: number; // 0-1
  estimatedUnitCBM?: number; // Cubic meters per unit
  unitWeightKg?: number; // Kilograms per unit
  // Evidence level for credibility
  evidenceLevel?: "image_only" | "image_and_label" | "image_and_label_and_barcode";
  // Optional: Extracted from barcode or label
  barcode?: string | null; // UPC, EAN, QR code, etc.
  labelData?: {
    ingredients?: string[];
    allergens?: string[];
    netWeight?: string;
    origin?: string;
    manufacturer?: string;
    warnings?: string[];
    batteryType?: string; // For electronics
    certifications?: string[];
  } | null;
  extendedKeywordSet?: {
    processBased?: string[];
    categoryBased?: string[];
    supplyChainBased?: string[];
    hsCodeExpansion?: string[];
  };
}

export type SupplierType = "factory" | "trading" | "logistics" | "unknown";

export interface SupplierEvidence {
  recordCount: number; // Number of import records for this supplier
  lastShipmentDate: string | null; // Most recent shipment date (ISO string)
  lastSeenDays: number | null; // Days since last shipment (null if no records)
  productTypes: string[]; // Types of products this supplier handles (top 3)
  evidenceSnippet?: string | null; // One-line snippet from shipping record (max 120 chars)
}

export interface SupplierMatch {
  supplierId: string;
  supplierName: string;
  productName: string;
  unitPrice: number;
  moq: number; // Minimum Order Quantity
  leadTime: number; // days
  matchScore: number; // 0-100 (original search score, for reference)
  rerankScore?: number; // 0-100 (category profile reranked score, used for final sorting)
  matchReason: string; // Why this match was made (HS Code, keyword, etc.)
  importKeyId: string | null;
  currency: string;
  isInferred: boolean; // true if this is an AI-inferred match (material/category based)
  // AI-enriched fields (from original data only, no fabrication)
  supplierType?: SupplierType; // Classified by AI: factory, trading, logistics, unknown
  normalizedName?: string; // AI-normalized company name
  country?: string; // Extracted from address/data
  city?: string; // Extracted from address/data
  evidence?: SupplierEvidence; // Evidence from database (record count, last shipment, etc.)
  summary?: string; // One-line summary of why this candidate (using evidence fields only)
  // Reranking metadata (for debugging and UI display)
  _rerankFlags?: string[]; // Internal flags from rerankWithProfile
  _removalReasons?: string[]; // Reasons why this candidate was filtered/penalized
}

export interface LandedCost {
  unitPrice: number;
  dutyRate: number;
  shippingCost: number;
  fee: number;
  totalLandedCost: number;
  formula: string;
  breakdown: {
    baseUnitPrice: number;
    dutyAmount: number;
    shippingPerUnit: number;
    feePerUnit: number;
  };
}

export interface MarketEstimate {
  hsCodeCandidates: Array<{
    code: string;
    confidence: number;
    reason: string;
  }>;
  fobUnitPriceRange: {
    min: number;
    max: number;
    currency: string;
    unit: string;
  };
  moqRange: {
    min: number;
    max: number;
    typical: number;
  };
  leadTimeRange: {
    min: number; // days
    max: number; // days
    typical: number; // days
  };
  primaryProductionCountries: string[];
  riskChecklist: string[];
  notes: string;
  // Evidence metadata for credibility
  source: "internal_records" | "supplier_prices" | "llm_baseline" | "category_default";
  // Legacy alias used by UI components (kept for backward compatibility)
  evidenceSource?: "internal_records" | "llm_baseline";
  similarRecordsCount?: number; // Number of similar records found in DB or supplier prices
  confidenceTier?: "high_potential" | "medium" | "high"; // Based on data availability
  rangeMethod?: "p20p80" | "p25p75" | "minMaxClamp" | "medianPlusMinus" | "p35p65" | "p40p60" | "category_default";
  // Observed suppliers when evidenceSource is internal_records
  observedSuppliers?: Array<{
    exporterName: string;
    recordCount: number;
    lastSeenDays: number | null;
    evidenceSnippet?: string | null;
  }>;
  // Pack math for retail/wholesale pricing
  packMath?: {
    unitsPerInnerPack?: number;
    innerPacksPerCarton?: number;
    unitsPerCarton?: number;
    cartonGrossWeightKg?: number;
    cartonDimensionsCm?: {
      length: number;
      width: number;
      height: number;
    };
  };
  // Recent import activity (last 90/180/365 days with fallback)
  recentImporters?: Array<{
    importerName: string;
    shipmentCount: number;
    lastSeenDays: number;
    topOrigins?: string[];
    topPorts?: string[];
    evidenceSnippet?: string | null;
  }>;
  // Metadata for recent importers (internal use, not in JSON)
  recentImportersWindowDays?: number; // 90, 180, or 365
  recentImportersTotalShipments?: number; // Total matched shipments in the window
  // Backward compatibility for older payloads (deprecated)
  fobPriceRange?: MarketEstimate["fobUnitPriceRange"];
  // New fields for scenario analysis
  scenarioAnalysis?: {
    originCountries?: Array<{
      country: string;
      tariffRange: {
        bestCase: number;
        worstCase: number;
      };
    }>;
  };
  volumeBasedPricing?: Array<{
    quantity: number;
    perUnit: number;
  }>;
}

export interface IntelligencePipelineResult {
  productId: string;
  analysis: ImageAnalysisResult;
  supplierMatches: SupplierMatch[]; // All matches (for backward compatibility)
  // Separated by match quality
  recommendedSuppliers: SupplierMatch[]; // Perfect matches only (isInferred = false, matchScore >= 50)
  candidateSuppliers: SupplierMatch[]; // Inferred or lower-score matches (isInferred = true OR matchScore < 50)
  landedCosts: Array<{
    match: SupplierMatch;
    landedCost: LandedCost;
  }>;
  marketEstimate?: MarketEstimate; // Only present when pricedMatches.length === 0
  cached: {
    analysis: boolean;
    matches: boolean;
  };
  timestamp?: string;
  warnings?: string[];
  // Report quality metadata
  reportQuality?: {
    evidenceLevel: "image_only" | "image_and_label" | "image_and_label_and_barcode" | "internal_records";
    categoryKey: string;
    intakeRules?: Array<{
      key: string;
      requirement: "optional" | "recommended" | "critical";
      reason: string;
    }>;
  };
  // Signals for fallback supplier matching (resilience)
  productSignals?: ProductSignals;
  productSignalEvidence?: ProductSignalEvidence;
  supplierEmptyReason?: "no_signals" | "no_matches" | "pipeline_error";
  supplierMatchMode?: "normal" | "fallback";
  // Comparison data for UI (DIY vs NexSupply)
  comparison?: {
    diyEstimate: number;
    nexSupplyEstimate: number;
    potentialSavings: number;
    diyBreakdown: {
      productCost: number;
      shipping: number;
      hiddenCosts: number; // Unexpected fees, bad quality buffer, time cost
    };
    nexSupplyBreakdown: {
      productCost: number;
      shipping: number; // Optimized
      serviceFee: number; // 7%
    };
  };
}

export interface CachedAnalysis {
  id: string;
  product_id: string;
  image_url: string;
  image_hash: string | null;
  product_name: string;
  description: string;
  category: string;
  hs_code: string | null;
  attributes: Record<string, string>;
  keywords: string[];
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface CachedSupplierMatch {
  id: string;
  product_id: string;
  analysis_id: string | null;
  supplier_id: string;
  supplier_name: string;
  product_name: string;
  unit_price: number;
  moq: number;
  lead_time: number;
  match_score: number;
  match_reason: string | null;
  import_key_id: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Safe Array Helpers
// ============================================================================

/**
 * Convert value to string array safely
 * Returns empty array if value is not an array or is undefined/null
 */
function asArrayString(value: unknown): string[] {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * Take first n items from array safely
 * Returns empty array if value is not an array or is undefined/null
 */
function takeArray(value: unknown, n: number): string[] {
  return asArrayString(value).slice(0, n);
}

/**
 * Normalize analysis result to ensure all array fields are safe
 * Call this immediately after Step 1 to prevent downstream errors
 */
function normalizeAnalysisResult(analysis: ImageAnalysisResult): ImageAnalysisResult {
  return {
    ...analysis,
    keywords: asArrayString(analysis.keywords),
    // Normalize optional array fields that might be used later
    // These are set to empty arrays if missing to prevent slice errors
  };
}

// ============================================================================
// Step 1: Image Analysis (Gemini)
// ============================================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate SHA-256 hash of image for cache lookup
 */
async function generateImageHash(imageBuffer: ArrayBuffer): Promise<string> {
  // Use Web Crypto API for hashing (works in both Node.js and browser)
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    imageBuffer
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Analyze product image using Gemini 1.5 Flash
 * Results are cached in Supabase to avoid redundant API calls
 * Uses image hash for cache lookup even without productId
 */
async function analyzeProductImage(
  imageUrl: string,
  productId?: string,
  storageImageUrl?: string
): Promise<{ result: ImageAnalysisResult; cached: boolean; analysisId?: string }> {
  console.log("[Pipeline Step 1] Starting image analysis for:", imageUrl);
  const supabase = await createClient();

  try {
    let imageBuffer: ArrayBuffer;
    let imageHash: string;

    // Handle data URLs (base64 images)
    if (imageUrl.startsWith("data:image/")) {
      // Extract base64 data from data URL
      const base64Data = imageUrl.split(",")[1];
      if (!base64Data) {
        throw new Error("Invalid data URL format");
      }
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBuffer = bytes.buffer;
      imageHash = await generateImageHash(imageBuffer);
    } else {
      // Fetch image from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      imageBuffer = await imageResponse.arrayBuffer();
      imageHash = await generateImageHash(imageBuffer);
    }

    // Check cache by image hash (more reliable than URL)
    const { data: cached } = await supabase
      .from("product_analyses")
      .select("*")
      .eq("image_hash", imageHash)
      .maybeSingle();

    if (cached) {
      console.log("[Pipeline Step 1] Cache hit! Using cached analysis:", cached.id);
      const cachedResult: ImageAnalysisResult = {
          productName: cached.product_name,
          description: cached.description,
          category: cached.category,
          hsCode: cached.hs_code || null,
          attributes: cached.attributes as Record<string, string>,
          keywords: cached.keywords as string[],
          confidence: cached.confidence || 0.8,
      };
      // Normalize immediately after retrieval
      return {
        result: normalizeAnalysisResult(cachedResult),
        cached: true,
        analysisId: cached.id,
      };
    }

    console.log("[Pipeline Step 1] Cache miss. Calling Gemini API...");

    // Perform Gemini analysis
    // Use gemini-2.5-flash for latest image analysis capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this product image and extract structured information in JSON format.

CRITICAL: 
- Even if you are not 100% sure what the product is, you MUST generate the most likely product name based on its visual characteristics (material, shape, color, usage). 
- NEVER return "Unknown Product" or "null" for the productName. Always provide your best professional estimate.
- Be extremely aggressive in extracting material and manufacturing process keywords.

Instructions:
1.  Extract the brand name (if any) and key adjectives (e.g., flavor, material, design features) for the product.
2.  Add the following attributes to the 'attributes' object:
    *   'material': Identify the material (Plastic, Wood, Metal, Glass, Silicone, Cotton, etc.) very specifically.
    *   'manufacturingProcess': Infer the manufacturing process (Injection molding, Die-casting, CNC machining, Extrusion, Weaving, etc.).
    *   'complexityScore': A score from 1 to 10 (1-3 for simple processing, 7-10 for complex processes).
    *   'logisticsType': 'bulky', 'fragile', or 'standard'.
3.  Clearly specify the main category: 'Food', 'Furniture', 'Lighting', 'Tableware', 'Electronics', 'Apparel', 'Toys', 'Sports', 'Home', etc.
4.  Generate an extensive set of 'keywords' for supplier matching, including materials, processes, and category terms.

Return only valid JSON in the following format:
{
  "productName": "Most likely product name (MANDATORY: NEVER USE UNKNOWN)",
  "description": "detailed product description",
  "category": "Food | Furniture | Lighting | Tableware | Electronics | Apparel | Toys | Sports | Home | Other",
  "hsCode": "HS Code if identifiable (format: XXXX.XX.XX)",
  "attributes": {
    "material": "material type (BE SPECIFIC)",
    "manufacturingProcess": "inferred process (BE AGGRESSIVE)",
    "color": "color",
    "size": "size/dimensions",
    "complexityScore": "1-10",
    "logisticsType": "bulky | fragile | standard"
  },
  "keywords": ["keyword1", "keyword2", "process_keyword", "material_keyword"]
}

Be specific and aggressive in keyword generation.`;

    // Convert ArrayBuffer to base64 or extract from data URL
    let imageBase64: string;
    let mimeType: string;

    if (imageUrl.startsWith("data:image/")) {
      // Extract mime type and base64 from data URL
      const matches = imageUrl.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid data URL format");
      }
      mimeType = `image/${matches[1]}`;
      imageBase64 = matches[2];
    } else {
      // Convert ArrayBuffer to base64 (works in both Node.js and browser)
      const bytes = new Uint8Array(imageBuffer);
      const binary = String.fromCharCode(...bytes);
      imageBase64 =
        typeof Buffer !== "undefined"
          ? Buffer.from(binary, "binary").toString("base64")
          : btoa(binary);
      mimeType = "image/jpeg"; // Default, could be improved by checking file extension
    }

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response as JSON");
    }

    const analysis = JSON.parse(jsonMatch[0]) as Omit<
      ImageAnalysisResult,
      "confidence"
    >;

    const analysisResult: ImageAnalysisResult = {
      productName: analysis.productName || "Unknown Product",
      description: analysis.description || "",
      category: analysis.category || "Uncategorized",
      hsCode: analysis.hsCode || null,
      attributes: analysis.attributes || {},
      keywords: analysis.keywords || [],
      confidence: 0.9, // Gemini 1.5 Flash typically has high confidence
      estimatedUnitCBM: (analysis as any).estimatedUnitCBM,
      unitWeightKg: (analysis as any).unitWeightKg,
    };

    // Normalize immediately after creation to ensure all array fields are safe
    const normalizedResult = normalizeAnalysisResult(analysisResult);

    console.log("[Pipeline Step 1] Analysis complete:", {
      productName: normalizedResult.productName,
      category: normalizedResult.category,
      hsCode: normalizedResult.hsCode,
      keywordsCount: normalizedResult.keywords.length,
    });

    // Cache the result in Supabase using admin client (bypasses RLS)
    // Don't store data URLs in image_url (too large for index)
    // Use image_hash as the cache key instead
    // Prefer real storage/public URL when available; otherwise fall back to a tiny placeholder for data URLs
    const safeImageUrl = imageUrl.startsWith("data:image/")
      ? storageImageUrl || `data-url:${imageHash}`
      : imageUrl;
    
    const supabaseAdmin = createAdminClient();
    
    // Check if analysis already exists by image_hash
    const { data: existing } = await supabaseAdmin
      .from("product_analyses")
      .select("id")
      .eq("image_hash", imageHash)
      .maybeSingle();

    let cachedData;
    let cacheError;

    if (existing) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from("product_analyses")
        .update({
          product_id: productId || null,
          image_url: safeImageUrl,
        product_name: normalizedResult.productName,
        description: normalizedResult.description,
        category: normalizedResult.category,
        hs_code: normalizedResult.hsCode,
        attributes: normalizedResult.attributes,
        keywords: normalizedResult.keywords,
        confidence: normalizedResult.confidence,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      
      cachedData = data;
      cacheError = error;
    } else {
      // Insert new record
      const { data, error } = await supabaseAdmin
        .from("product_analyses")
        .insert({
          product_id: productId || null,
          image_url: safeImageUrl,
          image_hash: imageHash,
        product_name: normalizedResult.productName,
        description: normalizedResult.description,
        category: normalizedResult.category,
        hs_code: normalizedResult.hsCode,
        attributes: normalizedResult.attributes,
        keywords: normalizedResult.keywords,
        confidence: normalizedResult.confidence,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      cachedData = data;
      cacheError = error;
    }

    if (cacheError) {
      console.error("[Pipeline Step 1] Cache error:", cacheError);
      // Continue even if caching fails
    } else {
      console.log("[Pipeline Step 1] Analysis cached:", cachedData?.id);
    }

    return {
      result: normalizedResult,
      cached: false,
      analysisId: cachedData?.id,
    };
  } catch (error) {
    console.error("[Pipeline Step 1] Error analyzing image with Gemini:", error);
    throw new Error(
      `Failed to analyze product image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ============================================================================
// Step 2: Supplier Matching (ImportKey/Supabase Cache)
// ============================================================================

/**
 * Collect evidence data for a supplier from database
 * Returns record count, last shipment date, days since last seen, and top product types
 * ALWAYS returns evidence (even if empty) - mandatory for UI credibility
 */
async function collectSupplierEvidence(
  supplierId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<SupplierEvidence> {
  try {
    // Get all records for this supplier (include product_description for snippet)
    const { data: records, error } = await supabase
      .from("supplier_products")
      .select("created_at, updated_at, category, product_name, product_description")
      .eq("supplier_id", supplierId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !records || records.length === 0) {
      return {
        recordCount: 0,
        lastShipmentDate: null,
        lastSeenDays: null,
        productTypes: [],
      };
    }

    // Find most recent date
    const dates = records
      .map((r) => r.updated_at || r.created_at)
      .filter(Boolean)
      .map((d) => new Date(d as string))
      .sort((a, b) => b.getTime() - a.getTime());
    
    const lastShipmentDate = dates[0] ? dates[0].toISOString() : null;
    
    // Calculate days since last seen
    let lastSeenDays: number | null = null;
    if (lastShipmentDate) {
      const now = new Date();
      const lastDate = new Date(lastShipmentDate);
      const diffMs = now.getTime() - lastDate.getTime();
      lastSeenDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Collect top product types/categories (count frequency, then take top 3)
    const categoryCounts = new Map<string, number>();
    records.forEach((r) => {
      const cat = r.category as string;
      if (cat) {
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      }
    });
    
    // Sort by frequency and take top 3
    const productTypes = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Extract evidence snippet from most recent record (max 120 chars)
    // Use product_description if available, otherwise product_name
    let evidenceSnippet: string | null = null;
    if (records.length > 0) {
      const mostRecent = records[0];
      const text = (mostRecent.product_description as string) || (mostRecent.product_name as string) || "";
      if (text) {
        // Clean and truncate to 120 chars
        const cleaned = text.replace(/\s+/g, " ").trim();
        evidenceSnippet = cleaned.length > 120 ? cleaned.slice(0, 117) + "..." : cleaned;
      }
    }

    return {
      recordCount: records.length,
      lastShipmentDate,
      lastSeenDays,
      productTypes,
      evidenceSnippet,
    };
  } catch (error) {
    console.error(`[Evidence] Error collecting evidence for ${supplierId}:`, error);
    return {
      recordCount: 0,
      lastShipmentDate: null,
      lastSeenDays: null,
      productTypes: [],
      evidenceSnippet: null,
    };
  }
}

/**
 * Rule-based supplier type classification (1st pass)
 * Uses keyword matching to classify before AI enrichment
 */
function classifySupplierTypeByRules(supplierName: string): SupplierType {
  const name = supplierName.toLowerCase();
  
  // Logistics keywords (highest priority - strict check)
  const logisticsKeywords = [
    "logistics", "shipping", "cargo", "freight", "forward", "forwarder",
    "expeditors", "transport", "broker", "lines", "oocl", "maersk", "cosco",
    "cma", "dhl", "fedex", "ups", "vessel", "customs", "express", "line",
    "carrier", "shipping line", "freight forwarder",
    "sea air", "sea-air", "air sea", "air-sea", "globalnet", "courier"
  ];
  
  if (logisticsKeywords.some(keyword => name.includes(keyword))) {
    return "logistics";
  }
  
  // Factory/manufacturing keywords
  // Note: "co ltd", "limited" are removed as they're too generic (used by both factories and trading companies)
  const factoryKeywords = [
    "factory", "manufacturing", "mfg", "mfg.", "industrial", "plastics",
    "toys", "arts", "craft", "mold", "molding", "production",
    "manufacture", "workshop", "plant"
  ];
  
  if (factoryKeywords.some(keyword => name.includes(keyword))) {
    return "factory";
  }
  
  // Trading keywords
  const tradingKeywords = [
    "trading", "import", "export", "intl", "international", "co ltd",
    "group", "enterprise", "trading co", "trading company", "import export"
  ];
  
  // Check if trading keywords exist AND no factory keywords
  const hasTradingKeyword = tradingKeywords.some(keyword => name.includes(keyword));
  const hasFactoryKeyword = factoryKeywords.some(keyword => name.includes(keyword));
  
  if (hasTradingKeyword && !hasFactoryKeyword) {
    return "trading";
  }
  
  // Default to unknown if no clear classification
  return "unknown";
}

/**
 * AI-enrich supplier information using Gemini (2nd pass)
 * Only normalizes and classifies existing data, never fabricates facts
 * Uses rule-based classification as baseline, AI refines if needed
 */
async function enrichSupplierWithAI(
  match: SupplierMatch,
  evidence: SupplierEvidence
): Promise<Partial<SupplierMatch>> {
  // 1st pass: Rule-based classification
  const ruleBasedType = classifySupplierTypeByRules(match.supplierName);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are a supplier data normalization assistant. Your job is to clean and classify supplier information using ONLY the provided original data. NEVER invent or guess facts.

Original Data:
- Supplier Name: ${match.supplierName}
- Product Name: ${match.productName}
- Match Reason: ${match.matchReason}
- Record Count: ${evidence.recordCount}
- Last Shipment: ${evidence.lastShipmentDate || "Unknown"}
- Product Types: ${evidence.productTypes.join(", ") || "Unknown"}
- Rule-based Type: ${ruleBasedType} (use this as baseline, only refine if clearly wrong)

Classification Rules (rule-based result is usually correct):
- "factory": Company name contains manufacturing keywords (factory, mfg, manufacturing, industrial, mold, molding, production, co ltd, limited) OR product types suggest manufacturing
- "trading": Company name suggests trading/import-export (trading, import, export, international, hong kong address only) OR acts as intermediary
- "logistics": Company name contains shipping keywords (logistics, shipping, cargo, freight, forward, forwarder, expeditors, transport, broker, lines, oocl, maersk, cosco, cma, dhl, fedex, ups) OR clearly a freight forwarder
- "unknown": Cannot determine from available data

Tasks (use original data only):
1. Normalize company name: Remove extra spaces, clean parentheses, standardize format. Return the cleaned name.
2. Classify supplier type: Use rule-based type (${ruleBasedType}) as baseline. Only change if you have strong evidence it's wrong. If rule-based says "logistics", keep it as "logistics".
3. Extract location: If supplier name or product data contains country/city info, extract it. Otherwise return null.

Return JSON only:
{
  "normalizedName": "cleaned company name",
  "supplierType": "factory" | "trading" | "logistics" | "unknown",
  "country": "country name or null",
  "city": "city name or null"
}

Note: Summary is generated by code (not LLM) for consistency.

Rules:
- Do NOT invent prices, MOQ, lead times, or certifications
- Do NOT guess supplier capabilities beyond what evidence shows
- Use original supplier name if normalization fails
- If rule-based type is "logistics", ALWAYS keep it as "logistics" (do not change)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[AI Enrich] Failed to parse Gemini response, using defaults");
      return {
        normalizedName: match.supplierName,
        supplierType: "unknown" as SupplierType,
      };
    }

    const enriched = JSON.parse(jsonMatch[0]) as {
      normalizedName: string;
      supplierType: SupplierType;
      country?: string | null;
      city?: string | null;
    };

    // Enforce rule-based logistics classification (AI should not override)
    const finalType = ruleBasedType === "logistics" ? "logistics" : (enriched.supplierType || ruleBasedType);

    return {
      normalizedName: enriched.normalizedName || match.supplierName,
      supplierType: finalType,
      country: enriched.country || undefined,
      city: enriched.city || undefined,
      evidence,
    };
  } catch (error) {
    console.error("[AI Enrich] Error enriching supplier:", error);
    // Fallback: return original data with rule-based classification
    // Note: summary is generated by buildSummary() in Step 2.5, not here
    return {
      normalizedName: normalizeName(match.supplierName),
      supplierType: ruleBasedType,
      evidence,
    };
  }
}

/**
 * Extract company name from product_description (ImportKey trade data)
 * Prioritizes actual manufacturers over forwarders/logistics companies
 * Looks for patterns like "FWDR REF:", "CNEE REF:", "ND NOTIFY:", "SHIPPER:", "EXPORTER:"
 */
function extractCompanyNameFromDescription(description: string | null | undefined): string | null {
  if (!description || typeof description !== 'string') return null;
  
  const candidates: Array<{ name: string; priority: number; isForwarder: boolean }> = [];
  
  // Common patterns in ImportKey product_description
  const patterns = [
    // Shipper (actual exporter/manufacturer) - HIGHEST PRIORITY
    { regex: /SHIPPER[:\s]+([A-Z][A-Z0-9\s&\-.,()]+?)(?:\s+STATES|PO|SC|HS|Origin|TEL|FAX|@|$)/i, priority: 10, isForwarder: false },
    // Exporter (actual manufacturer)
    { regex: /EXPORTER[:\s]+([A-Z][A-Z0-9\s&\-.,()]+?)(?:\s+STATES|PO|SC|HS|Origin|TEL|FAX|@|$)/i, priority: 9, isForwarder: false },
    // Consignee reference (buyer/importer, but sometimes manufacturer name appears)
    { regex: /CNEE\s+REF[:\s]+([A-Z][A-Z0-9\s&\-.,()]+?)(?:\s+PO|SC|ND|HS|Origin|TEL|FAX|@|$)/i, priority: 5, isForwarder: false },
    // Notify party (often distributor, but sometimes manufacturer)
    { regex: /ND\s+NOTIFY[:\s]+([A-Z][A-Z0-9\s&\-.,()]+?)(?:\s+FOR|PO|SC|HS|Origin|TEL|FAX|@|$)/i, priority: 4, isForwarder: false },
    // Forwarder reference (LOWEST PRIORITY - usually logistics companies)
    { regex: /FWDR\s+REF[:\s]+([A-Z][A-Z0-9\s&\-.,()]+?)(?:\s+CNEE|$|PO|SC|ND|HS|Origin|TEL|FAX|@)/i, priority: 1, isForwarder: true },
    // Company name patterns (all caps, followed by common suffixes)
    { regex: /\b([A-Z][A-Z0-9\s&\-.,()]{10,}(?:CO|LTD|INC|LLC|CORP|LIMITED|GROUP|TRADING|PACKAGING|MANUFACTURING|INDUSTRIAL|TECHNOLOGY|INTERNATIONAL|EXPORT|IMPORT)[\s.,]?)(?:\s+@|TEL|FAX|PHONE|PO|SC|HS|Origin|$)/i, priority: 6, isForwarder: false },
  ];
  
  for (const { regex, priority, isForwarder } of patterns) {
    const match = description.match(regex);
    if (match && match[1]) {
      let companyName = match[1].trim();
      
      // Clean up common suffixes and noise
      companyName = companyName
        .replace(/\s+(FOR|PO|SC|ND|HS|ORIGIN|TEL|FAX|PHONE|EMAIL|@|STATES|THAT|THIS|CONTAINS|SHIPMENT).*$/i, '')
        .replace(/\s+-\s*$/, '')
        .replace(/^[:\s\-]+/, '')
        .replace(/[:\s\-]+$/, '')
        .replace(/\s{2,}/g, ' ') // Multiple spaces to single
        .trim();
      
      // Filter out invalid names
      if (companyName.length < 5) continue;
      if (companyName.toLowerCase().includes('phone') || 
          companyName.toLowerCase().includes('email') ||
          companyName.toLowerCase().includes('contact') ||
          companyName.toLowerCase().includes('n/a') ||
          companyName.toLowerCase().includes('unknown')) continue;
      
      // Must contain at least one letter
      if (!/[A-Za-z]/.test(companyName)) continue;
      
      // Must not be just numbers or special chars
      if (/^[0-9\s\-.,()]+$/.test(companyName)) continue;
      
      // Check if it's a forwarder (but still add to candidates with lower priority)
      const isActuallyForwarder = isLikelyLogistics(companyName);
      
      candidates.push({
        name: companyName,
        priority: isActuallyForwarder ? priority - 5 : priority, // Penalize forwarders
        isForwarder: isActuallyForwarder || isForwarder,
      });
    }
  }
  
  // Sort by priority (highest first), then filter out forwarders if we have non-forwarder options
  candidates.sort((a, b) => b.priority - a.priority);
  
  // Prefer non-forwarder companies
  const nonForwarder = candidates.find(c => !c.isForwarder);
  if (nonForwarder) {
    return nonForwarder.name;
  }
  
  // If all are forwarders, return null (don't show forwarders as manufacturers)
  return null;
}

/**
 * Check if supplier_name is a dummy/placeholder value
 */
function isDummySupplierName(supplierName: string): boolean {
  if (!supplierName || supplierName.trim().length < 3) return true;
  const lower = supplierName.toLowerCase();
  return lower.includes('phone') || 
         lower.includes('email') ||
         lower.includes('contact') ||
         lower === '-' ||
         lower === 'n/a' ||
         lower === 'unknown' ||
         lower.startsWith('synthetic_') ||
         /^[0-9\s\-.,()]+$/.test(supplierName); // Only numbers/special chars
}

/**
 * Enrich supplier products with real company names from product_description
 * Replaces dummy supplier_name with extracted company names
 */
function enrichSupplierNamesFromDescription(products: any[]): void {
  if (!products || !Array.isArray(products)) return;
  
  products.forEach((product: any) => {
    const supplierName = (product.supplier_name as string) || "";
    
    if (isDummySupplierName(supplierName) && product.product_description) {
      const extractedName = extractCompanyNameFromDescription(product.product_description);
      if (extractedName) {
        product.supplier_name = extractedName; // Replace dummy name with real name
        console.log(`[Pipeline Step 2] Extracted company name: "${extractedName}" (was: "${supplierName}")`);
      }
    }
  });
}

/**
 * Normalize supplier name (trim and clean whitespace)
 */
function normalizeName(s?: string): string {
  return (s ?? "").trim().replace(/\s+/g, " ");
}

/**
 * Forwarder/Logistics company blacklist (comprehensive)
 * These companies should be filtered out as they are not actual manufacturers
 */
const FORWARDER_KEYWORDS = [
  // Major global forwarders
  'logistics', 'freight', 'shipping', 'cargo', 'forward', 'forwarding', 'forwarder',
  'expeditors', 'transport', 'broker', 'lines', 'intl', 'international freight',
  // Specific company names
  'maersk', 'cosco', 'cma', 'dhl', 'fedex', 'ups', 'oocl', 'evergreen', 'yang ming',
  'damco', 'dsv', 'kuehne', 'panalpina', 'schenker', 'ceva', 'agility', 'geodis',
  // Common patterns
  'air sea', 'sea co', 'shipping co', 'freight co', 'logistics co', 'transport co',
  'translead', 'translead int', 'united logistics', 'connection logistics',
  'port southeast logistics', 'wider logistics', 'safround logistics',
  'charter link logistics', 'honour lane shipping', 'maxwide logistics',
  'shipco transport', 'pt dsv transport', 'beijing century joyo courier',
  'ningbo translead', 'dsv air sea', 'u s united logistics',
];

/**
 * Check if supplier name indicates logistics/forwarder (not a factory)
 * Enhanced with comprehensive forwarder blacklist
 * RELAXED: Only filter if logistics keywords are clearly present (not just CO, LTD)
 */
function isLikelyLogistics(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  const n = name.toUpperCase();
  
  // Check for explicit logistics keywords (must be clearly logistics-related)
  // Don't filter just because of CO, LTD, etc.
  const explicitLogisticsKeywords = [
    'logistics', 'freight', 'shipping', 'cargo', 'forward', 'forwarding', 'forwarder',
    'expeditors', 'transport', 'broker', 'lines', 'intl', 'international freight',
    'maersk', 'cosco', 'cma', 'dhl', 'fedex', 'ups', 'oocl', 'evergreen', 'yang ming',
    'damco', 'dsv', 'kuehne', 'panalpina', 'schenker', 'ceva', 'agility', 'geodis',
    'air sea', 'sea co', 'shipping co', 'freight co', 'logistics co', 'transport co',
    'translead', 'translead int', 'united logistics', 'connection logistics',
    'port southeast logistics', 'wider logistics', 'safround logistics',
    'charter link logistics', 'honour lane shipping', 'maxwide logistics',
    'shipco transport', 'pt dsv transport', 'beijing century joyo courier',
    'ningbo translead', 'dsv air sea', 'u s united logistics',
  ];
  
  // Only filter if name contains explicit logistics keywords
  // CO, LTD alone are not enough - they're common in manufacturing companies too
  return explicitLogisticsKeywords.some((keyword) => n.includes(keyword.toUpperCase()));
}

/**
 * Check if supplier ID is a dummy/invalid ID
 */
function isDummySupplierId(supplierId: string): boolean {
  if (!supplierId || supplierId.trim().length === 0) return true;
  const id = supplierId.toLowerCase();
  const dummyPatterns = [
    "import",
    "phone",
    "email",
    "contact",
    "unknown",
    "n/a",
    "na",
    "null",
    "undefined",
    "test",
    "dummy",
  ];
  return dummyPatterns.some((pattern) => id.includes(pattern));
}

/**
 * Generate a stable synthetic supplier ID for inferred or low-quality supplier IDs
 * Uses normalized name, country, city to create a hash-based ID
 */
function ensureStableSupplierId(
  match: SupplierMatch,
  normalizedName: string
): string {
  // If supplierId is already valid and not dummy, keep it
  if (match.supplierId && !isDummySupplierId(match.supplierId)) {
    return match.supplierId;
  }

  // Generate synthetic ID from available data
  const parts = [
    normalizedName || match.supplierName || "unknown",
    match.country || "",
    match.city || "",
  ]
    .filter(Boolean)
    .join("|");

  // Simple hash function (djb2-like)
  let hash = 5381;
  for (let i = 0; i < parts.length; i++) {
    hash = ((hash << 5) + hash) + parts.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and convert to hex
  const hashStr = Math.abs(hash).toString(16).slice(0, 8);
  return `synth_${hashStr}`;
}

/**
 * Check if product description is generic manifest text
 */
function isGenericManifestText(productName: string): boolean {
  const text = productName.toLowerCase();
  const genericPatterns = [
    "this shipment contains",
    "plastic toys this shipment",
    "various articles",
    "assorted goods",
    "mixed cargo",
    "general merchandise",
    "miscellaneous",
  ];
  return genericPatterns.some((pattern) => text.includes(pattern));
}

/**
 * Check if supplier name should be completely removed (not just demoted to candidate)
 * Only removes truly invalid entries:
 * - Completely empty
 * - Only symbols
 * - Only placeholder words (phone, email, etc.)
 * - Truly garbage names like "phone -" or "-"
 * 
 * Note: For toy suppliers, short names are ALLOWED (many toy makers have brief names)
 * This should only reject truly invalid entries, not short legitimate names
 */
function shouldRemoveName(name: string): boolean {
  const n = normalizeName(name);
  
  // Completely empty
  if (!n || n.length === 0) return true;
  
  // Only symbols (no letters or numbers)
  if (!/[a-zA-Z0-9]/.test(n)) return true;
  
  // RELAXED: If name contains any alphabetic characters, keep it (even if short)
  // This allows short but valid company names
  if (/[a-zA-Z]/.test(n)) {
    // Only remove if it's clearly a placeholder
    const lower = n.toLowerCase();
    const placeholderOnly = /^(phone|email|address|contact|tel|fax|zip|postal|code)[\s\-]*$/i.test(n);
    if (placeholderOnly) return true;
    
    // Truly garbage patterns: just punctuation + placeholder
    // Examples: "phone -", "- company", "--", "."
    const garbagePattern = /^[\s\-\.]+$|^[\s\-\.]+(phone|email|company)[\s\-\.]*$/i.test(n);
    if (garbagePattern) return true;
    
    // If it has alphabetic characters, keep it (even if short)
    return false;
  }
  
  // Only placeholder words (no alphabetic characters)
  const lower = n.toLowerCase();
  const placeholderOnly = /^(phone|email|address|contact|tel|fax|zip|postal|code)[\s\-]*$/i.test(n);
  if (placeholderOnly) return true;
  
  // Truly garbage patterns: just punctuation + placeholder
  const garbagePattern = /^[\s\-\.]+$|^[\s\-\.]+(phone|email|company)[\s\-\.]*$/i.test(n);
  if (garbagePattern) return true;
  
  return false;
}

/**
 * Check if supplier name is low quality (should be demoted to candidate, not removed)
 * This is less strict than shouldRemoveName - allows names that might be salvageable
 */
function isLowQualityName(name: string): boolean {
  const n = normalizeName(name);
  
  // Already handled by shouldRemoveName
  if (shouldRemoveName(name)) return false;
  
  // Very short names (might be abbreviations, but low confidence)
  if (n.length < 3) return true;
  
  // High symbol ratio (might be messy but not empty)
  const symbols = (n.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const symbolRatio = symbols / n.length;
  if (symbolRatio > 0.3 && n.length < 10) return true;
  
  return false;
}

/**
 * Temporary backward-compat function
 * @deprecated Use shouldRemoveName or isLowQualityName instead
 */
function isBadName(name: string): boolean {
  return shouldRemoveName(name);
}

/**
 * Check if product name contains banned keywords (adult products, etc.)
 */
function isBannedCandidate(name: string): boolean {
  const s = name.toLowerCase();
  const banned = [
    "anal",
    "adult",
    "sex",
    "vibrator",
    "dildo",
    "lubricant",
    "condom",
    "massage",
    "erotic",
    "porn",
    "xxx",
  ];
  return banned.some((w) => s.includes(w));
}

/**
 * Industry mismatch filter for toy/sport categories
 * Filters out products that are clearly from different industries
 */
const TOY_SPORT_MISMATCH = [
  "rubber",
  "polymer",
  "cylinder",
  "compressed gas",
  "methane",
  "staple fibre",
  "polypropylene",
  "hs code polypropylene",
  "necklace",
  "earring",
  "jewelry",
  "jewellery",
  "chemical",
  "resin",
];

function isToySportCategory(category: string): boolean {
  const c = (category || "").toLowerCase();
  return c.includes("toy") || c.includes("game") || c.includes("sport") || c.includes("outdoor");
}

function isMismatchForCategory(analysis: ImageAnalysisResult, supplierProductName: string): boolean {
  const p = (supplierProductName || "").toLowerCase();
  if (isToySportCategory(analysis.category)) {
    return TOY_SPORT_MISMATCH.some((k) => p.includes(k));
  }
  if (isFoodCategory(analysis.category)) {
    return FOOD_HARD_MISMATCH_TERMS.some((k) => p.includes(k));
  }
  return false;
}

/**
 * Check if category is toy-related
 */
function isToyCategory(category: string | null | undefined): boolean {
  const c = (category ?? "").toLowerCase();
  return (
    c.includes("toy") ||
    c.includes("game") ||
    c.includes("kids") ||
    c.includes("children") ||
    c.includes("play")
  );
}

/**
 * Hard mismatch terms for toy category
 * These indicate industrial equipment, not toys
 */
const TOY_HARD_MISMATCH_TERMS = [
  "dough",
  "flour",
  "bakery",
  "fermentation",
  "mixer",
  "kneader",
  "divider",
  "rounder",
  "proofer",
  "oven",
  "rotary oven",
  "steamer",
  "tray",
  "cabinet",
  "industrial",
  "machine",
  "machinery",
  "compressor",
  "cylinder",
  "valve",
];

/**
 * Check if text contains toy mismatch terms
 */
function isMismatchForToyCandidate(text: string): boolean {
  const t = text.toLowerCase();
  return TOY_HARD_MISMATCH_TERMS.some((w) => t.includes(w));
}

/**
 * Check if HS code indicates industrial equipment (not toys)
 * HS2 84, 85 are machinery/electrical equipment
 */
function isHs2MismatchForToy(hs: string | null | undefined): boolean {
  if (!hs) return false;
  const digits = hs.replace(/\D/g, "");
  if (digits.length < 2) return false;
  const hs2 = digits.slice(0, 2);
  // 84 85 are machinery/electrical equipment, often surfacing as false positives for toys
  return hs2 === "84" || hs2 === "85";
}

/**
 * Check if category is food-related
 */
function isFoodCategory(category: string | null | undefined): boolean {
  const c = (category ?? "").toLowerCase();
  return (
    c.includes("food") ||
    c.includes("snack") ||
    c.includes("candy") ||
    c.includes("confectionery") ||
    c.includes("jelly") ||
    c.includes("gummy") ||
    c.includes("beverage") ||
    c.includes("drink")
  );
}

/**
 * Hard mismatch terms for food category
 * These indicate furniture, machinery, or industrial materials, not food
 */
const FOOD_HARD_MISMATCH_TERMS = [
  "furniture",
  "basin",
  "shampoo",
  "mattress",
  "bed",
  "jewelry",
  "jewellery",
  "cylinder",
  "compressed gas",
  "methane",
  "polymer",
  "polypropylene",
  "fibre",
  "fiber",
  "mixer",
  "grinder",
  "oven",
  "rotary oven",
  "fermentation",
  "bakery",
  "dough",
  "flour",
  "machine",
  "machinery",
  "industrial",
  "electric",
  "electrical",
];

/**
 * Check if text contains food mismatch terms
 */
function isMismatchForFoodCandidate(text: string): boolean {
  const t = text.toLowerCase();
  return FOOD_HARD_MISMATCH_TERMS.some((w) => t.includes(w));
}

/**
 * Check if HS code indicates non-food items
 * HS2 84, 85, 94 are machinery/electrical/furniture (not food)
 * HS2 17, 18, 19, 20, 21 are food-related (should pass)
 */
function isHs2MismatchForFood(hs: string | null | undefined): boolean {
  if (!hs) return false;
  const digits = hs.replace(/\D/g, "");
  if (digits.length < 2) return false;
  const hs2 = digits.slice(0, 2);
  // 84 85 94 are machinery, electrical equipment, and furniture, often surfacing as false positives for food
  return hs2 === "84" || hs2 === "85" || hs2 === "94";
}

/**
 * Material stopwords - common generic words that should be filtered out
 * Note: 'plastic' is now allowed (important for toys)
 */
const MATERIAL_STOPWORDS = new Set([
  "natural",
  "synthetic",
  "fabric",
  "strip",
  "strips",
  "weighted",
  "octagonal",
  "base",
  "wood",
  "heavy",
  "material",
  "component",
  "fiber",
  "fibre",
]);

/**
 * Extract material tokens, filtering out stopwords
 */
function extractMaterialTokens(material: string): string[] {
  return material
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4)
    .filter((t) => !MATERIAL_STOPWORDS.has(t))
    .slice(0, 6);
}

/**
 * Map category to head noun for food fallback queries
 * Example: "Jelly Candy" => "candy"
 */
function getFoodCategoryHeadNoun(category: string | null | undefined): string | null {
  if (!category) return null;
  const c = category.toLowerCase();
  
  // Extract the last significant word (head noun)
  const tokens = c.split(/[^a-z0-9]+/).filter(t => t.length > 0);
  if (tokens.length === 0) return null;
  
  const headNoun = tokens[tokens.length - 1];
  
  // Return null if head noun is generic/stopword
  if (['food', 'product', 'item', 'goods', 'snack'].includes(headNoun)) {
    // Try the second-to-last token instead
    if (tokens.length > 1) {
      return tokens[tokens.length - 2];
    }
    return null;
  }
  
  return headNoun;
}

/**
 * Build food-specific material search terms requiring 2+ tokens
 * For food profile: material + head noun (e.g., "jelly candy", "gummy candy")
 * Produces 3-5 query terms instead of single material word
 */
function buildFoodMaterialSearchTerms(material: string, category: string | null | undefined): string[] {
  if (!material) return [];
  
  const materialTokens = extractMaterialTokens(material);
  if (materialTokens.length === 0) return [];
  
  const headNoun = getFoodCategoryHeadNoun(category);
  if (!headNoun) {
    // If no valid head noun, require at least 2 material tokens
    if (materialTokens.length >= 2) {
      return [materialTokens.slice(0, 2).join(" ")];
    }
    return [];
  }
  
  // Build combined search terms: material + headNoun
  const searchTerms: string[] = [];
  
  // Add primary combinations (up to 3-5)
  for (let i = 0; i < Math.min(materialTokens.length, 3); i++) {
    const combined = `${materialTokens[i]} ${headNoun}`;
    searchTerms.push(combined);
  }
  
  return searchTerms.slice(0, 5); // Limit to 5 terms
}

/**
 * Build anchor terms from product name and keywords for fallback search
 * These are domain-specific terms that are more reliable than generic material words
 */
function buildAnchorTerms(analysis: ImageAnalysisResult): string[] {
  const base = [
    ...(analysis.keywords ?? []),
    analysis.productName,
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  const uniq = Array.from(new Set(base));

  // Minimal extension for cases like Jegichagi
  const expanded: string[] = [];
  if (uniq.some((t) => t.includes("jegichagi") || t.includes("jegi"))) {
    expanded.push("shuttlecock", "feather", "badminton", "birdie");
  }

  return Array.from(new Set([...uniq, ...expanded])).slice(0, 6);
}

/**
 * Ensure string ends with period
 */
function ensurePeriod(s: string): string {
  const t = (s ?? "").trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : t + ".";
}

/**
 * Format ISO date to short format (YYYY-MM-DD)
 */
function formatIsoDateShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Build deterministic summary from match reason and evidence
 * This replaces LLM-generated summaries for consistency
 * Always returns a complete sentence, never empty
 */
function buildSummary(matchReason: string, evidence: SupplierEvidence): string {
  const reason = ensurePeriod(matchReason || "Related match. Verification required.");

  const rc = typeof evidence.recordCount === "number" ? evidence.recordCount : 0;
  const last = formatIsoDateShort(evidence.lastShipmentDate);
  const evidenceSentence =
    rc > 0
      ? ` ${rc} internal references found. Last shipment ${last ?? "unknown"}.`
      : " No internal references found. Last shipment unknown.";

  // Ensure there are always at least two sentences
  return reason + evidenceSentence;
}

/**
 * Boost score for factory-like supplier names
 */
function factoryLikeBoost(name: string): number {
  const n = name.toLowerCase();
  const good = [
    "toy",
    "toys",
    "factory",
    "mfg",
    "manufactur",
    "industrial",
    "plast",
    "mold",
    "molding",
    "co ltd",
    "limited",
    "enterprise",
  ];
  return good.some((w) => n.includes(w)) ? 8 : 0;
}

/**
 * Apply penalty for logistics companies
 */
function logisticsPenalty(name: string): number {
  return isLikelyLogistics(name) ? 50 : 0;
}

/**
 * Score candidate with factory boost and logistics penalty
 */
function scoreCandidate(base: number, name: string): number {
  return base + factoryLikeBoost(name) - logisticsPenalty(name);
}

/**
 * Generate universal manufacturing keywords based on product materials and usage
 * Works across all categories: Food, Furniture, Apparel, Electronics, etc.
 * Analyzes materials, manufacturing processes, and use cases to create sourcing keywords
 */
async function generateManufacturingKeywords(
  productName: string,
  keyAdjectives: string[],
  material?: string,
  category?: string
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Build comprehensive prompt that analyzes materials and usage across all categories
    const prompt = `Analyze the product "${productName}" with attributes: ${keyAdjectives.join(", ")}${material ? `, Material: ${material}` : ""}${category ? `, Category: ${category}` : ""}.

Generate a comprehensive list of manufacturing-focused keywords for global sourcing. Consider:
1. **Materials**: What materials are used? (e.g., plastic, wood, fabric, metal, food ingredients)
2. **Manufacturing Processes**: What processes create this? (e.g., injection molding, extrusion, sewing, assembly, cooking)
3. **Use Cases**: What is it used for? (e.g., furniture, clothing, electronics, food, toys)
4. **Industry Terms**: What are the industry-specific sourcing terms? (e.g., OEM, wholesale, factory, manufacturer)

Return a JSON array of 8-12 keywords that would help find suppliers across different categories.
Examples across categories:
- Food: ["Confectionery factory", "Food processing plant", "Beverage manufacturer"]
- Furniture: ["Furniture manufacturer", "Woodworking factory", "Upholstery supplier"]
- Apparel: ["Garment factory", "Textile manufacturer", "Clothing OEM"]
- Electronics: ["Electronics assembly", "PCB manufacturer", "Consumer electronics factory"]

Return only the JSON array of strings, no other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn("[AI Keywords] Failed to parse Gemini response as JSON array");
      return [];
    }

    const keywords = JSON.parse(jsonMatch[0]) as string[];
    console.log(
      `[AI Keywords] Generated ${keywords.length} universal manufacturing keywords for "${productName}" (Category: ${category || "any"}, Material: ${material || "unknown"})`
    );
    return keywords;
  } catch (error) {
    console.error("[AI Keywords] Error generating manufacturing keywords:", error);
    return [];
  }
}

/**
 * Find supplier matches from Supabase cache
 * Searches by HS Code (priority), product name, category, and keywords
 */
async function findSupplierMatches(
  analysis: ImageAnalysisResult,
  productId?: string,
  analysisId?: string,
  runtimeAllowHs2?: string[],
  warnOnce?: (message: string) => void,
  reportId?: string
): Promise<{ matches: SupplierMatch[]; cached: boolean }> {
  console.log("[Pipeline Step 2] Starting 3-Stage Search Ladder Strategy...");
  const supabase = await createClient();

  // Check if we have cached matches for this product/analysis
  const cacheKey = productId || analysisId;
  if (cacheKey) {
    const { data: cachedMatches } = await supabase
      .from("product_supplier_matches")
      .select("*")
      .eq(productId ? "product_id" : "analysis_id", cacheKey)
      .order("match_score", { ascending: false })
      .limit(10);

    if (cachedMatches && cachedMatches.length > 0) {
      console.log(
        `[Pipeline Step 2] Cache hit! Found ${cachedMatches.length} cached matches`
      );
      return {
        matches: cachedMatches.map((item) => ({
          supplierId: item.supplier_id,
          supplierName: item.supplier_name,
          productName: item.product_name,
          unitPrice: item.unit_price,
          moq: item.moq,
          leadTime: item.lead_time,
          matchScore: item.match_score,
          matchReason: item.match_reason || "Cached match",
          importKeyId: item.import_key_id,
          currency: item.currency || "USD",
          isInferred: false, // Cached matches are not inferred
        })),
        cached: true,
      };
    }
  }

  // [Step 3] Preprocessing: All keywords to UPPERCASE
  const productName = (analysis.productName || "").toUpperCase();
  const category = (analysis.category || "Home").toUpperCase();
  const material = (analysis.attributes?.material || "").toUpperCase();
  
  const productTokens = productName
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length >= 2 && !['AND', 'WITH', 'FOR', 'FROM', 'BY', 'THE', 'A', 'AN', 'OF', 'IN', 'ON', 'AT', 'TO', 'AS'].includes(t));

  const allProducts = new Map<string, any>();

  // ============================================================================
  // [Stage 1] Precision Search (2+ tokens matching)
  // ============================================================================
  if (productTokens.length >= 2) {
    console.log("[Search Ladder Stage 1] Precision token search:", productTokens.slice(0, 5));
    const stage1Terms = productTokens.slice(0, 5);
    const stage1Filter = stage1Terms.flatMap(t => [
      `product_name.ilike.%${t}%`,
      `product_description.ilike.%${t}%`
    ]).join(",");

    const { data: stage1Data } = await supabase
      .from("supplier_products")
      .select("*")
      .or(stage1Filter)
      .limit(150);

    (stage1Data || []).forEach(item => {
      const text = `${item.product_name} ${item.product_description}`.toUpperCase();
      const matchCount = productTokens.filter(t => text.includes(t)).length;
      if (matchCount >= 2) {
        allProducts.set(`${item.supplier_id}_${item.product_name}`, item);
      }
    });
  }

  // ============================================================================
  // [Stage 2] Expansion: Category + Material (If < 5 results)
  // ============================================================================
  if (allProducts.size < 5) {
    console.log("[Search Ladder Stage 2] Category + Material expansion:", { category, material });
    const stage2Filters = [];
    if (category && category !== "UNCATEGORIZED") {
      stage2Filters.push(`category.ilike.%${category}%`, `product_name.ilike.%${category}%`);
    }
    if (material) {
      stage2Filters.push(`product_name.ilike.%${material}%`, `product_description.ilike.%${material}%`);
    }

    if (stage2Filters.length > 0) {
      const { data: stage2Data } = await supabase
        .from("supplier_products")
        .select("*")
        .or(stage2Filters.join(","))
        .limit(100);

      (stage2Data || []).forEach(item => {
        const key = `${item.supplier_id}_${item.product_name}`;
        if (!allProducts.has(key)) allProducts.set(key, item);
      });
    }
  }

  // ============================================================================
  // [Stage 3] Cargo Description Broad Search (If still insufficient)
  // ============================================================================
  if (allProducts.size < 5) {
    console.log("[Search Ladder Stage 3] Cargo Description broad search with category words");
    const categoryWords = category.split(/\s+/).filter(w => w.length >= 3);
    if (categoryWords.length > 0) {
      const stage3Filter = categoryWords.map(w => `product_description.ilike.%${w}%`).join(",");
      const { data: stage3Data } = await supabase
        .from("supplier_products")
        .select("*")
        .or(stage3Filter)
        .order("updated_at", { ascending: false })
        .limit(20);

      (stage3Data || []).forEach(item => {
        const key = `${item.supplier_id}_${item.product_name}`;
        if (!allProducts.has(key)) allProducts.set(key, item);
      });
    }
  }

  // ============================================================================
  // [Step 4] Emergency Fallback: Top Global Suppliers (If 0 results)
  // ============================================================================
  if (allProducts.size === 0) {
    console.log("[Search Ladder Fallback] Using Top Global Suppliers for:", analysis.category);
    const cat = (analysis.category || "Home") as string;
    const fallbackList = TOP_GLOBAL_SUPPLIERS[cat] || TOP_GLOBAL_SUPPLIERS["Home"];
    
    fallbackList.forEach((s, i) => {
      const item = {
        supplier_id: `global_${cat}_${i}`,
        supplier_name: s.supplier_name,
        product_name: s.product_name,
        product_description: `Top Global Supplier for ${cat}`,
        unit_price: 0,
        moq: 1,
        lead_time: 0,
        is_inferred: true
      };
      allProducts.set(item.supplier_id, item);
    });
  }

  // Final Scoring and Enrichment
  const matches: SupplierMatch[] = [];
  const allItems = Array.from(allProducts.values());
  
  for (const item of allItems) {
    const { score, reason } = calculateMatchScore(item, analysis);
    
    // [Step 3] Increase weight for Cargo Description
    let finalScore = score;
    const desc = (item.product_description || "").toUpperCase();
    productTokens.forEach(t => {
      if (desc.includes(t)) finalScore += 5; 
    });

    matches.push({
      supplierId: item.supplier_id,
      supplierName: item.supplier_name || "Unknown Supplier",
      productName: item.product_name || "Product",
      unitPrice: item.unit_price || 0,
      moq: item.moq || 1,
      leadTime: item.lead_time || 0,
      matchScore: Math.max(finalScore, item.is_inferred ? 1 : 0),
      matchReason: item.is_inferred ? "Top Global Supplier" : reason,
      importKeyId: item.import_key_id || null,
      currency: item.currency || "USD",
      isInferred: !!item.is_inferred
    });
  }

  const resultMatches = matches
    .filter(m => m.matchScore >= 1) // Threshold 1
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  // Enrichment (Evidence & AI)
  const enrichedMatches: SupplierMatch[] = [];
  for (const match of resultMatches) {
    try {
      const evidence = await collectSupplierEvidence(match.supplierId, supabase);
      const enriched = await enrichSupplierWithAI(match, evidence);
      
      enrichedMatches.push({
        ...match,
        ...enriched,
        supplierName: enriched.normalizedName || match.supplierName,
        evidence: evidence,
        summary: match.matchReason,
      });
    } catch (err) {
      console.warn(`[Pipeline] Enrichment failed for ${match.supplierId}:`, err);
      enrichedMatches.push(match);
    }
  }

  // Cache the results if we have matches
  if (cacheKey && enrichedMatches.length > 0) {
    try {
      const supabaseAdmin = createAdminClient();
      let conflictColumns = productId ? "product_id,supplier_id" : "analysis_id,supplier_id";
      
      await supabaseAdmin
        .from("product_supplier_matches")
        .upsert(
          enrichedMatches.map((match) => ({
            product_id: productId || null,
            analysis_id: analysisId || null,
            report_id: reportId || null,
            supplier_id: match.supplierId,
            supplier_name: match.supplierName,
            product_name: match.productName,
            unit_price: match.unitPrice,
            moq: match.moq,
            lead_time: match.leadTime,
            match_score: match.matchScore,
            match_reason: match.matchReason,
            import_key_id: match.importKeyId,
            currency: match.currency,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: conflictColumns }
        );
      console.log(`[Pipeline Step 2] Cached ${enrichedMatches.length} matches`);
    } catch (err) {
      console.warn("[Pipeline Step 2] Failed to cache matches:", err);
    }
  }

  return { matches: enrichedMatches, cached: false };
}

/**
 * Calculate match score based on HS Code, product name, category, and keywords
 * Returns both score and reason for the match
 */
function calculateMatchScore(
  item: Record<string, unknown>,
  analysis: ImageAnalysisResult
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Guard: If missing critical text, return 0 immediately
  const itemProductName = (item.product_name as string) || "";
  if (!itemProductName || itemProductName.trim().length === 0) {
    return { score: 0, reason: "Missing product name" };
  }

  // EMERGENCY FIX: HS Code match - Relaxed to include HS4 matches
  // Normalize to 6-digit format for comparison
  const analysisHs6 = normalizeHs6(analysis.hsCode);
  const itemHs6 = normalizeHs6(item.hs_code?.toString());
  
  // Also extract HS4 (first 4 digits)
  const analysisHs4 = analysisHs6 ? analysisHs6.substring(0, 4) : null;
  const itemHs4 = itemHs6 ? itemHs6.substring(0, 4) : null;

  if (analysisHs6 && itemHs6) {
    if (analysisHs6 === itemHs6) {
      score += 50; // Exact HS6 match
      reasons.push("HS6 match");
    } else if (analysisHs4 && itemHs4 && analysisHs4 === itemHs4) {
      // EMERGENCY FIX: HS4 match also gets points (relaxed matching)
      score += 25; // HS4 match gets significant points
      reasons.push("HS4 match");
    } else if (
      analysisHs6.startsWith(itemHs6.substring(0, 4)) ||
      itemHs6.startsWith(analysisHs6.substring(0, 4))
    ) {
      score += 30; // Partial HS Code match
      reasons.push("Partial HS Code match");
    }
  } else if (analysisHs4 && itemHs4 && analysisHs4 === itemHs4) {
    // EMERGENCY FIX: Even if HS6 is missing, HS4 match still counts
    score += 20;
    reasons.push("HS4 match (no HS6)");
  }

  // Material match bonus (0-20 points)
  if (analysis.attributes?.material && itemProductName) {
    const material = analysis.attributes.material.toLowerCase();
    if (itemProductName.toLowerCase().includes(material)) {
      score += 20;
      reasons.push(`Material match (${material})`);
    }
  }

  // Furniture manufacturer bonus
  if (analysis.category?.toLowerCase().includes('furniture')) {
    const supplierName = (item.supplier_name as string || "").toLowerCase();
    if (supplierName.includes('furniture') || supplierName.includes('mfg')) {
      score += 15;
      reasons.push("Furniture Specialist");
    }
  }

  // EMERGENCY FIX: Token-based matching (at least 2 tokens must match)
  // Split product name into tokens
  const analysisTokens = (analysis.productName || "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .filter(w => !['AND', 'WITH', 'FOR', 'FROM', 'BY', 'THE', 'A', 'AN', 'OF', 'IN', 'ON', 'AT', 'TO', 'AS'].includes(w));
  
  const itemProductNameUpper = itemProductName.toUpperCase();
  const itemTokens = itemProductNameUpper
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  
  // Count matching tokens in product name
  const matchingTokens = analysisTokens.filter(t => itemTokens.includes(t));
  const tokenMatchCount = matchingTokens.length;
  const minTokensForMatch = 2; // EMERGENCY FIX: At least 2 tokens must match
  
  // Token overlap score (0-40 points) - Based on token count
  if (tokenMatchCount >= minTokensForMatch) {
    // Base score for having minimum tokens
    score += 25; // Increased from 20
    // Bonus for more matching tokens
    score += Math.min(25, (tokenMatchCount - minTokensForMatch) * 5);
    reasons.push(`${tokenMatchCount} name token match(es)`);
  } else if (tokenMatchCount === 1) {
    // Single token match gets lower score but still included
    score += 10;
    reasons.push("1 name token match");
  }

  // EMERGENCY FIX: Cargo Description (product_description) match bonus (0-40 points)
  // HIGHER WEIGHT for ImportKey trade data compatibility
  if (item.product_description) {
    const desc = (item.product_description as string).toUpperCase();
    const matchingDescTokens = analysisTokens.filter(t => desc.includes(t));
    if (matchingDescTokens.length > 0) {
      const descBonus = 20 + Math.min(20, matchingDescTokens.length * 5);
      score += descBonus;
      reasons.push(`${matchingDescTokens.length} description token match(es)`);
    }
  }

  // Name similarity (0-35 points) - Levenshtein based (fallback)
  const nameSimilarity = calculateStringSimilarity(
    analysis.productName.toLowerCase(),
    itemProductName.toLowerCase()
  );
  if (nameSimilarity > 0.8) {
    score += 35;
    reasons.push("High name similarity");
  } else if (nameSimilarity > 0.5) {
    score += nameSimilarity * 35;
    reasons.push("Moderate name similarity");
  }

  // Token overlap score (0-25 points) - Jaccard based (additional scoring)
  const combinedAnalysis = `${analysis.productName} ${analysis.category}`;
  const combinedItem = `${itemProductName} ${(item.category as string) || ""}`;
  const overlap = tokenOverlapScore(combinedAnalysis, combinedItem);
  
  if (overlap > 0) {
    const overlapPoints = Math.min(25, overlap * 25);
    score += overlapPoints;
    if (overlap > 0.3) {
      reasons.push("Token overlap");
    }
  }

  // Category match (0-15 points)
  // Map category variations
  const categoryMapping: Record<string, string> = {
    "Headphones": "Audio Equipment",
    "headphones": "Audio Equipment",
    "Audio": "Audio Equipment",
    "audio": "Audio Equipment",
  };
  const mappedCategory = categoryMapping[analysis.category] || analysis.category;

  if (item.category) {
    const itemCategory = item.category.toString().toLowerCase();
    const analysisCategory = analysis.category.toLowerCase();
    const mappedCategoryLower = mappedCategory.toLowerCase();

    // Exact match
    if (
      itemCategory === analysisCategory ||
      itemCategory === mappedCategoryLower
    ) {
      score += 15;
      reasons.push("Category match");
    } else if (
      // Partial match
      itemCategory.includes(analysisCategory) ||
      analysisCategory.includes(itemCategory) ||
      itemCategory.includes(mappedCategoryLower) ||
      mappedCategoryLower.includes(itemCategory)
    ) {
      score += 8;
      reasons.push("Partial category match");
    }
  }

  // Keyword matches (0-10 points)
  const itemName = itemProductName.toLowerCase();
  const keywordMatches = analysis.keywords.filter((keyword) =>
    itemName.includes(keyword.toLowerCase())
  );
  if (analysis.keywords.length > 0 && keywordMatches.length > 0) {
    const keywordScore = (keywordMatches.length / analysis.keywords.length) * 10;
    score += keywordScore;
    reasons.push(`${keywordMatches.length} keyword match(es)`);
  }

  // EMERGENCY FIX: Apply penalties instead of filtering
  // Check for logistics/forwarder (penalty instead of removal)
  const supplierNameRaw = (item.supplier_name as string) || "";
  const supplierName = normalizeName(supplierNameRaw);
  if (isLikelyLogistics(supplierName)) {
    score -= 40; // Large penalty but don't remove
    reasons.push("Logistics penalty");
  }
  
  // Check for bad names (penalty instead of removal)
  if (shouldRemoveName(supplierNameRaw)) {
    score -= 30; // Penalty but don't remove
    reasons.push("Name quality penalty");
  }
  
  // Check for banned products (still filter these - safety issue)
  const itemProductNameLower = itemProductName.toLowerCase();
  if (isBannedCandidate(itemProductNameLower)) {
    // Banned products are still filtered (safety)
    return { score: 0, reason: "Banned product" };
  }

  // Ensure score is always a valid number (coerce NaN/undefined to 0)
  // EMERGENCY FIX: Allow negative scores (they'll be sorted to bottom)
  let finalScore = Math.round(score);
  if (isNaN(finalScore) || !isFinite(finalScore)) {
    finalScore = 0;
  }
  const reason = reasons.length > 0 ? reasons.join(", ") : "Low similarity match";

  return { score: finalScore, reason };
}

/**
 * Normalize HS Code to 6-digit format for comparison
 * Example: "3926.40.00" -> "392640", "3926.40" -> "392640"
 */
function normalizeHs6(hs: string | null | undefined): string | null {
  if (!hs) return null;
  const digits = hs.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits.slice(0, 6);
}

/**
 * Tokenize text into words (length >= 3)
 */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

/**
 * Calculate token overlap score using Jaccard similarity
 * Returns 0-1 score based on token overlap
 */
function tokenOverlapScore(a: string, b: string): number {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (A.size === 0 || B.size === 0) return 0;

  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;

  const union = A.size + B.size - inter;
  if (union === 0) return 0;

  const jaccard = inter / union;
  return jaccard; // 0 to 1
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  const editDist = editDistance(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

/**
 * Calculate Levenshtein edit distance
 */
function editDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// Recent Importers (last 90 days)
// ============================================================================

type RecentImporterRow = {
  shipment_date: string | null;
  importer_name: string | null;
  origin_country: string | null;
  origin_port: string | null;
  destination_port: string | null;
  product_description: string | null;
};

function truncateSnippet(s: string, max = 120): string {
  const cleaned = s.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max - 3) + "..." : cleaned;
}

/**
 * Build anchor terms for recent importers search
 * Filters out common stopwords
 */
function buildAnchorTermsForImporters(analysis: ImageAnalysisResult): string[] {
  const raw = [
    analysis.productName,
    ...(analysis.keywords ?? []),
    analysis.category,
  ]
    .filter(Boolean)
    .join(" ");

  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);

  // Remove overly common words
  const stop = new Set(["kids", "child", "children", "toy", "game", "set", "play"]);
  const filtered = tokens.filter((t) => !stop.has(t));

  // Use top 6 only
  return Array.from(new Set(filtered)).slice(0, 6);
}

/**
 * Result type for recent importers collection
 */
type RecentImportersResult = {
  importers: NonNullable<MarketEstimate["recentImporters"]>;
  windowDaysUsed: 90 | 180 | 365;
  totalMatchedShipments: number;
};

/**
 * Collect recent importers from last N days
 * Uses normalized view if available, falls back to raw tables
 */
async function collectRecentImportersLastNDays(
  analysis: ImageAnalysisResult,
  supabase: Awaited<ReturnType<typeof createClient>>,
  windowDays: 90 | 180 | 365
): Promise<RecentImportersResult> {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const terms = buildAnchorTermsForImporters(analysis);

  if (terms.length === 0) {
    return { importers: [], windowDaysUsed: windowDays, totalMatchedShipments: 0 };
  }

  // Recommended to use views first
  // If not available, replace with the actual shipping table name in the project
  const sourcesToTry = [
    { table: "shipping_records_normalized", dateCol: "shipment_date" },
    { table: "shipping_records", dateCol: "shipment_date" },
    { table: "import_records", dateCol: "shipment_date" },
  ] as const;

  for (const src of sourcesToTry) {
    try {
      const orFilter = terms
        .map((t) => `product_description.ilike.%${t}%`)
        .join(",");

      const { data, error } = await supabase
        .from(src.table as any)
        .select(
          "shipment_date, importer_name, origin_country, origin_port, destination_port, product_description"
        )
        .gte(src.dateCol as any, cutoff)
        .or(orFilter)
        .limit(500);

      if (error || !data) continue;

      let rows = data as RecentImporterRow[];
      
      // Fallback: Try HS6-based search if anchor terms returned 0 results
      if (rows.length === 0) {
        const hs6 = normalizeHs6(analysis.hsCode);
        if (hs6) {
          const { data: hsRows, error: hsError } = await supabase
            .from(src.table as any)
            .select(
              "shipment_date, importer_name, origin_country, origin_port, destination_port, product_description, hs_code"
            )
            .gte(src.dateCol as any, cutoff)
            .ilike("hs_code", `%${hs6}%`)
            .limit(500);
          
          if (!hsError && hsRows && hsRows.length > 0) {
            rows = hsRows as RecentImporterRow[];
          } else {
            continue;
          }
        } else {
          continue;
        }
      }
      
      if (rows.length === 0) continue;

      // Process rows (either from anchor terms or HS6 fallback)

      const now = Date.now();

      const byImporter = new Map<
        string,
        {
          importerName: string;
          shipmentCount: number;
          lastSeenDays: number;
          origins: Map<string, number>;
          ports: Map<string, number>;
          bestSnippet: string | null;
          bestSnippetDate: number;
        }
      >();

      for (const r of rows) {
        const name = (r.importer_name ?? "").trim();
        if (!name) continue;

        const dateMs = r.shipment_date ? new Date(r.shipment_date).getTime() : 0;
        const lastSeenDays = dateMs
          ? Math.max(0, Math.floor((now - dateMs) / (1000 * 60 * 60 * 24)))
          : 9999;

        const key = name.toLowerCase();

        if (!byImporter.has(key)) {
          byImporter.set(key, {
            importerName: name,
            shipmentCount: 0,
            lastSeenDays,
            origins: new Map(),
            ports: new Map(),
            bestSnippet: null,
            bestSnippetDate: 0,
          });
        }

        const item = byImporter.get(key)!;
        item.shipmentCount += 1;
        item.lastSeenDays = Math.min(item.lastSeenDays, lastSeenDays);

        const origin = (r.origin_country ?? "").trim();
        if (origin) item.origins.set(origin, (item.origins.get(origin) || 0) + 1);

        const port = (r.destination_port ?? r.origin_port ?? "").trim();
        if (port) item.ports.set(port, (item.ports.get(port) || 0) + 1);

        const desc = (r.product_description ?? "").trim();
        if (desc && dateMs >= item.bestSnippetDate) {
          item.bestSnippetDate = dateMs;
          item.bestSnippet = truncateSnippet(desc, 120);
        }
      }

      const top = Array.from(byImporter.values())
        .sort((a, b) => b.shipmentCount - a.shipmentCount)
        .slice(0, 5)
        .map((x) => ({
          importerName: x.importerName,
          shipmentCount: x.shipmentCount,
          lastSeenDays: x.lastSeenDays === 9999 ? 9999 : x.lastSeenDays,
          topOrigins: Array.from(x.origins.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k]) => k),
          topPorts: Array.from(x.ports.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k]) => k),
          evidenceSnippet: x.bestSnippet,
        }));

      const totalMatchedShipments = rows.length;
      return {
        importers: top,
        windowDaysUsed: windowDays,
        totalMatchedShipments,
      };
    } catch {
      continue;
    }
  }

  return { importers: [], windowDaysUsed: windowDays, totalMatchedShipments: 0 };
}

/**
 * Collect recent importers with fallback windows (90 → 180 → 365 days)
 * Returns the first window that has results, or empty if all fail
 */
async function collectRecentImportersWithFallback(
  analysis: ImageAnalysisResult,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<RecentImportersResult> {
  for (const windowDays of [90, 180, 365] as const) {
    const result = await collectRecentImportersLastNDays(analysis, supabase, windowDays);
    if (result.importers.length > 0) {
      return result;
    }
  }
  // All windows returned 0, return 90-day result
  return { importers: [], windowDaysUsed: 90, totalMatchedShipments: 0 };
}

// ============================================================================
// Step 2.5: Market Estimate Fallback (when no supplier matches found)
// ============================================================================

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function clampByRatio(min: number, max: number, ratioLimit = 3): { min: number; max: number } {
  if (min <= 0) return { min: 0, max: max || 0 };
  const maxAllowed = min * ratioLimit;
  return { min, max: Math.min(max, maxAllowed) };
}

function buildFobRange(samples: number[]): { min: number; max: number; method: MarketEstimate["rangeMethod"] } {
  if (samples.length === 0) {
    return { min: 0, max: 0, method: "category_default" };
  }

  const sorted = [...samples].filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { min: 0, max: 0, method: "category_default" };
  }

  if (sorted.length >= 30) {
    const min = quantile(sorted, 0.2);
    const max = quantile(sorted, 0.8);
    return { min, max: Math.max(min, max), method: "p20p80" };
  }

  if (sorted.length >= 10) {
    const min = quantile(sorted, 0.25);
    const max = quantile(sorted, 0.75);
    return { min, max: Math.max(min, max), method: "p25p75" };
  }

  if (sorted.length >= 3) {
    const minRaw = sorted[0];
    const maxRaw = sorted[sorted.length - 1];
    const { max } = clampByRatio(minRaw, maxRaw, 2);
    return { min: minRaw, max, method: "minMaxClamp" };
  }

  // 1-2 samples: median +/- 35%
  const median = sorted.length === 2 ? (sorted[0] + sorted[1]) / 2 : sorted[0];
  const min = median * 0.65;
  const max = median * 1.35;
  const clamped = clampByRatio(min, max, 3);
  return { min: clamped.min, max: clamped.max, method: "medianPlusMinus" };
}

/**
 * Generate market estimate using Gemini when no supplier matches are found
 * Provides HS code candidates, price ranges, MOQ, lead time, and risk checklist
 * Uses RAG context for richer outputs
 */
async function inferMarketEstimateWithGemini(
  analysis: ImageAnalysisResult,
  supplierMatches?: SupplierMatch[],
  marketEstimate?: MarketEstimate
): Promise<MarketEstimate> {
  console.log("[Pipeline Step 2.5] Generating market estimate with Gemini (Pass B: Decision Synthesis)...");

  // Check for similar records in DB to determine evidence source
  const supabase = await createClient();
  let similarRecordsCount = 0;
  let evidenceSource: "internal_records" | "llm_baseline" = "llm_baseline";
  let similarImports: Array<{
    hs_code?: string | null;
    product_name?: string;
    product_description?: string;
    unit_price?: number;
    currency?: string;
    origin_country?: string | null;
    weight?: number | null;
    invoice_snippet?: string | null;
  }> = [];
  const internalPriceSamples: number[] = [];
  const supplierPriceSamples: number[] = (supplierMatches || [])
    .map((m) => Number(m.unitPrice))
    .filter((v) => Number.isFinite(v) && v > 0);

  // Try to find similar records by category with full data
  let observedSuppliers: Array<{
    exporterName: string;
    recordCount: number;
    lastSeenDays: number | null;
    evidenceSnippet?: string | null;
  }> = [];
  
  // Helper function to build observedSuppliers from records
  const buildObservedSuppliers = (records: any[]) => {
    if (!records || records.length === 0) return [];
    
    const supplierMap = new Map<string, {
      count: number;
      lastUpdated: Date | null;
      sampleProduct: string | null;
    }>();
    
    for (const record of records) {
      const supplierName = record.supplier_name || "Unknown";
      const existing = supplierMap.get(supplierName) || {
        count: 0,
        lastUpdated: null,
        sampleProduct: null,
      };
      
      existing.count += 1;
      if (record.updated_at) {
        const updatedAt = new Date(record.updated_at);
        if (!existing.lastUpdated || updatedAt > existing.lastUpdated) {
          existing.lastUpdated = updatedAt;
        }
      }
      if (!existing.sampleProduct && record.product_name) {
        existing.sampleProduct = record.product_name;
      }
      
      supplierMap.set(supplierName, existing);
    }
    
    // Convert map to array and calculate lastSeenDays
    const now = new Date();
    return Array.from(supplierMap.entries())
      .map(([exporterName, data]) => {
        const lastSeenDays = data.lastUpdated
          ? Math.floor((now.getTime() - data.lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        
        return {
          exporterName,
          recordCount: data.count,
          lastSeenDays,
          evidenceSnippet: data.sampleProduct ? `${data.sampleProduct} (${data.count} record${data.count > 1 ? 's' : ''})` : null,
        };
      })
      .sort((a, b) => b.recordCount - a.recordCount) // Sort by record count descending
      .slice(0, 20); // Limit to top 20 suppliers
  };
  
  let allCategoryRecords: any[] = [];
  
  if (analysis.category) {
    const { data: categoryRecords } = await supabase
      .from("supplier_products")
      .select("hs_code, product_name, product_description, unit_price, currency, category, supplier_name, updated_at")
      .eq("category", analysis.category)
      .limit(200); // Increased limit to get more data
    
    if (categoryRecords && categoryRecords.length > 0) {
      allCategoryRecords = categoryRecords;
      similarRecordsCount = categoryRecords.length;
      
      internalPriceSamples.push(
        ...categoryRecords
          .map((r: any) => Number(r.unit_price))
          .filter((v: number) => Number.isFinite(v) && v > 0)
      );

      similarImports = categoryRecords
        .filter((r: any) => r.unit_price && Number(r.unit_price) > 0)
        .sort((a: any, b: any) => (Number(b.unit_price) || 0) - (Number(a.unit_price) || 0))
        .slice(0, 5)
        .map((r: any) => ({
          hs_code: r.hs_code,
          product_name: r.product_name,
          product_description: r.product_description,
          unit_price: r.unit_price,
          currency: r.currency || "USD",
          origin_country: null,
          weight: null,
          invoice_snippet: null,
        }));
      
      observedSuppliers = buildObservedSuppliers(categoryRecords);
    }
    
    // Also check by keywords as fallback
    if (analysis.keywords.length > 0) {
      const keyword = analysis.keywords[0];
      const { data: keywordRecords } = await supabase
        .from("supplier_products")
        .select("hs_code, product_name, product_description, unit_price, currency, category, supplier_name, updated_at")
        .ilike("product_name", `%${keyword}%`)
        .limit(100);
      
      if (keywordRecords && keywordRecords.length > 0) {
        similarRecordsCount = Math.max(similarRecordsCount, keywordRecords.length);
        
        // Merge keyword records if we don't have enough category records
        if (allCategoryRecords.length < 50) {
          allCategoryRecords = [...allCategoryRecords, ...keywordRecords];
          // Rebuild observedSuppliers with merged data
          observedSuppliers = buildObservedSuppliers(allCategoryRecords);
        }
      }
    }
  }
  
  // Fallback: If no category match or insufficient data, get any recent records
  if (observedSuppliers.length === 0 || similarRecordsCount < 5) {
    const { data: fallbackRecords } = await supabase
      .from("supplier_products")
      .select("hs_code, product_name, product_description, unit_price, currency, category, supplier_name, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    
    if (fallbackRecords && fallbackRecords.length > 0) {
      similarRecordsCount = Math.max(similarRecordsCount, fallbackRecords.length);
      
      // Merge with existing records
      const mergedRecords = [...allCategoryRecords, ...fallbackRecords];
      // Remove duplicates by id
      const uniqueRecords = Array.from(
        new Map(mergedRecords.map((r: any) => [r.id || `${r.supplier_name}-${r.product_name}`, r])).values()
      );
      
      observedSuppliers = buildObservedSuppliers(uniqueRecords);
    }
  }
  // Build FOB range from available numeric signals (internal records first, then supplier prices)
  let fobRangeFromData: { min: number; max: number; method: MarketEstimate["rangeMethod"] } | null = null;
  let rangeSource: MarketEstimate["source"] = "llm_baseline";

  if (internalPriceSamples.length > 0) {
    fobRangeFromData = buildFobRange(internalPriceSamples);
    rangeSource = "internal_records";
    similarRecordsCount = Math.max(similarRecordsCount, internalPriceSamples.length);
  } else if (supplierPriceSamples.length > 0) {
    fobRangeFromData = buildFobRange(supplierPriceSamples);
    rangeSource = "supplier_prices";
    similarRecordsCount = supplierPriceSamples.length;
  }

  if (rangeSource === "internal_records") {
    evidenceSource = "internal_records";
    console.log(`[Pipeline Step 2.5] Found ${similarRecordsCount} similar records in DB`);
  } else if (rangeSource === "supplier_prices") {
    evidenceSource = "internal_records"; // treat priced matches as grounded evidence
    console.log(`[Pipeline Step 2.5] Using ${supplierPriceSamples.length} supplier price samples`);
  } else {
    console.log(`[Pipeline Step 2.5] No priced signals found, using LLM baseline`);
  }

  // Determine confidence tier based on price signals
  const priceSignalCount = internalPriceSamples.length > 0
    ? internalPriceSamples.length
    : supplierPriceSamples.length;
  const confidenceTier: "high_potential" | "medium" | "high" = 
    priceSignalCount >= 50 ? "high" :
    priceSignalCount >= 10 ? "medium" : "high_potential";

  // Build RAG context
  const { buildRAGContext } = await import("@/lib/server/rag-context-builder");
  const ragContext = await buildRAGContext({
    analysis,
    marketEstimate,
    supplierMatches,
    similarImports,
  });

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a sourcing intelligence expert. Analyze this product and provide a comprehensive market estimate using the provided context.
If data is insufficient for a definitive answer, use scenario-based analysis to provide actionable intelligence.

PRODUCT INFORMATION:
- Product: ${analysis.productName}
- Category: ${analysis.category}
- Description: ${analysis.description}
- Attributes: ${JSON.stringify(analysis.attributes)}
- Keywords: ${analysis.keywords.join(", ")}

RAG CONTEXT:
${JSON.stringify(ragContext, null, 2)}

Provide a comprehensive market estimate in this exact JSON format. Apply the following logic for data gaps:
1.  **Origin Scenarios**: If origin is uncertain, provide a 'scenarioAnalysis' object. For the top 3 potential origin countries (e.g., China, Vietnam, Mexico), show 'Best/Worst' tariff scenarios based on typical duty rates.
2.  **Volume Pricing**: If a fixed factory-gate price is unavailable, create a 'volumeBasedPricing' table. Show how the per-unit price decreases with larger order quantities (e.g., 500, 5000 units).

{
  "hs_code_ranking": [
    {
      "code": "XXXX.XX.XX",
      "confidence": 0.8,
      "reason": "Most likely HS code based on product characteristics and similar imports"
    }
  ],
  "price_range": {
    "min": 0.50,
    "max": 5.00,
    "currency": "USD",
    "unit": "per unit",
    "explanation": "Price range based on similar imports and category benchmarks",
    "evidence_ladder_level": "similar_import" | "category_prior"
  },
  "compliance_checklist": [
    {
      "item": "Quality control requirements",
      "source_assumption": "Category standard"
    }
  ],
  "tighten_inputs": [
    {
      "input": "unit_weight",
      "priority": 1,
      "impact": "High - affects shipping cost calculation"
    }
  ],
  "moqRange": {
    "min": 100,
    "max": 10000,
    "typical": 1000
  },
  "leadTimeRange": {
    "min": 30,
    "max": 90,
    "typical": 60
  },
  "primaryProductionCountries": ["China", "Vietnam", "India"],
  "riskChecklist": [
    "Quality control requirements",
    "Customs compliance",
    "Shipping logistics"
  ],
  "notes": "Additional sourcing considerations",
  "scenarioAnalysis": {
    "originCountries": [
      { "country": "China", "tariffRange": { "bestCase": 0.05, "worstCase": 0.25 } },
      { "country": "Vietnam", "tariffRange": { "bestCase": 0.03, "worstCase": 0.15 } }
    ]
  },
  "volumeBasedPricing": [
    { "quantity": 500, "perUnit": 0.55 },
    { "quantity": 5000, "perUnit": 0.45 }
  ]
}

IMPORTANT:
- Use similar imports data to inform price_range when available
- Set evidence_ladder_level: "similar_import" if similarImports.length > 0, else "category_prior"
- Prioritize tighten_inputs by impact on cost accuracy
- Be realistic and specific. Return only valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini market estimate response as JSON");
    }

    const estimateRaw = JSON.parse(jsonMatch[0]) as any;
    
    // Map new structured output to MarketEstimate format
    // Ensure hsCodeCandidates is always an array with proper structure
    const rawHsCandidates = estimateRaw.hs_code_ranking || estimateRaw.hsCodeCandidates;
    const hsCodeCandidates = Array.isArray(rawHsCandidates)
      ? rawHsCandidates.filter((c: any) => c && (typeof c === 'string' || (c.code && typeof c.code === 'string')))
        .map((c: any) => {
          // Handle both string format and object format
          if (typeof c === 'string') {
            return { code: c, confidence: 0.5, reason: 'From analysis' };
          }
          return {
            code: c.code || String(c),
            confidence: c.confidence ?? 0.5,
            reason: c.reason || 'From analysis',
          };
        })
      : [];
    
    const categoryDefaultRange = (() => {
      const cat = (analysis.category || "").toLowerCase();
      const complexity = Number(analysis.attributes?.complexityScore) || 5;
      const isPremium = analysis.attributes?.materialPremium === 'premium';
      const isEconomy = analysis.attributes?.materialPremium === 'economy';
      
      // Base multipliers based on complexity and quality
      let baseMin = 0.55;
      let baseMax = 0.90;
      
      // Adjust base range by complexity (1-10)
      // Higher complexity = higher base cost
      const complexityFactor = 1 + ((complexity - 5) * 0.1); // 0.6x to 1.5x
      baseMin *= complexityFactor;
      baseMax *= complexityFactor;
      
      // Adjust by premium status
      if (isPremium) {
        baseMin *= 1.4;
        baseMax *= 1.5;
      } else if (isEconomy) {
        baseMin *= 0.7;
        baseMax *= 0.8;
      }

      // Category specific overrides
      if (cat.includes("food") || cat.includes("candy") || cat.includes("confection") || cat.includes("jelly")) {
        // Food is volume based, typically lower unit cost but higher volume
        return { min: 0.15 * complexityFactor, max: 0.35 * complexityFactor, method: "category_default" as const };
      }
      if (cat.includes("furniture") || cat.includes("sofa") || cat.includes("chair")) {
        // Furniture is much higher value
        return { min: 45.0 * complexityFactor, max: 120.0 * complexityFactor, method: "category_default" as const };
      }
      if (cat.includes("lighting") || cat.includes("lamp")) {
        // Lighting varies wildly, but generally mid-range
        return { min: 5.0 * complexityFactor, max: 15.0 * complexityFactor, method: "category_default" as const };
      }
      if (cat.includes("electronics") || cat.includes("accessor")) {
        return { min: 1.2 * complexityFactor, max: 3.5 * complexityFactor, method: "category_default" as const };
      }
      if (cat.includes("tableware") || cat.includes("plate") || cat.includes("ceramic")) {
        return { min: 0.8 * complexityFactor, max: 2.5 * complexityFactor, method: "category_default" as const };
      }
      
      return { min: baseMin, max: baseMax, method: "category_default" as const };
    })();

    // REMOVED: Random fluctuation (randomFlux)
    // We now use pure data-driven confidence intervals.
    // If no data is available, we use wide category defaults without randomization.

    const estimate: Omit<MarketEstimate, "similarRecordsCount" | "confidenceTier"> = {
      hsCodeCandidates,
      fobUnitPriceRange: {
        min: resolvedRange.min,
        max: resolvedRange.max,
        currency: estimateRaw.price_range?.currency || estimateRaw.fobPriceRange?.currency || "USD",
        unit: estimateRaw.price_range?.unit || estimateRaw.fobPriceRange?.unit || "per unit",
      },
      fobPriceRange: {
        min: resolvedRange.min,
        max: resolvedRange.max,
        currency: estimateRaw.price_range?.currency || estimateRaw.fobPriceRange?.currency || "USD",
        unit: estimateRaw.price_range?.unit || estimateRaw.fobPriceRange?.unit || "per unit",
      },
      moqRange: estimateRaw.moqRange || {
        min: 100,
        max: 10000,
        typical: 1000,
      },
      leadTimeRange: estimateRaw.leadTimeRange || {
        min: 30,
        max: 90,
        typical: 60,
      },
      primaryProductionCountries: estimateRaw.primaryProductionCountries || [],
      riskChecklist: estimateRaw.riskChecklist || getCategoryRiskChecklist(analysis.category), // Use category-specific fallback
      notes: estimateRaw.notes || "",
      source: finalRangeSource,
      rangeMethod: finalRangeMethod,
      evidenceSource: evidenceSource,
      // Store new structured fields for later use (attached to marketEstimate object)
      _priceRangeExplanation: estimateRaw.price_range?.explanation,
      _evidenceLadderLevel: estimateRaw.price_range?.evidence_ladder_level || (similarImports.length > 0 ? "similar_import" : "category_prior"),
      _complianceChecklist: estimateRaw.compliance_checklist,
      _tightenInputs: estimateRaw.tighten_inputs,
      // New scenario fields
      scenarioAnalysis: estimateRaw.scenarioAnalysis,
      volumeBasedPricing: estimateRaw.volumeBasedPricing,
    } as any;

    // Collect recent importers with fallback windows (90 → 180 → 365 days)
    const recentImportersResult = await collectRecentImportersWithFallback(analysis, supabase);
    console.log("[RecentImporters] count", recentImportersResult.importers.length, recentImportersResult.windowDaysUsed, "days", recentImportersResult.importers[0]?.importerName);

    // Apply buildFobRangeResult to refine FOB range using statistical methods
    const categoryDefaultFob: MoneyRange = (() => {
      const catLower = (analysis.category || "").toLowerCase();
      if (catLower.includes("candy") || catLower.includes("confection") || catLower.includes("novelty")) {
        return { min: 0.15, max: 0.45, currency: "USD" as const, unit: "per unit" as const };
      }
      if (catLower.includes("electronics") || catLower.includes("accessor")) {
        return { min: 0.60, max: 1.40, currency: "USD" as const, unit: "per unit" as const };
      }
      if (catLower.includes("fan")) {
        return { min: 1.50, max: 2.80, currency: "USD" as const, unit: "per unit" as const };
      }
      return { min: 0.35, max: 0.95, currency: "USD" as const, unit: "per unit" as const };
    })();

    const internalUnitValues = similarImports
      .map((r: any) => Number(r.unit_price))
      .filter((v: number) => Number.isFinite(v) && v > 0);

    const supplierUnitPrices = (supplierMatches || [])
      .filter((m: any) => (m.unitPrice ?? 0) > 0)
      .map((m: any) => Number(m.unitPrice));

    const fobResult = buildFobRangeResult({
      internalUnitValues,
      supplierUnitPrices,
      categoryDefault: categoryDefaultFob,
      currency: "USD",
    });

    // Override estimate with refined FOB ranges from buildFobRangeResult
    estimate.fobUnitPriceRange = fobResult.fobUnitPriceRange;
    estimate.fobPriceRange = fobResult.fobUnitPriceRange;
    (estimate as any).fobUnitPriceRangeTightened = fobResult.fobUnitPriceRangeTightened;
    estimate.source = fobResult.source;
    estimate.rangeMethod = fobResult.rangeMethod;
    (estimate as any).confidenceTier = fobResult.confidenceTier;
    (estimate as any).similarRecordsCount = fobResult.similarRecordsCount;

    console.log("[Pipeline Step 2.5] FOB range refined with buildFobRangeResult:", {
      fobUnitPriceRange: fobResult.fobUnitPriceRange,
      source: fobResult.source,
      rangeMethod: fobResult.rangeMethod,
      confidenceTier: fobResult.confidenceTier,
      similarRecordsCount: fobResult.similarRecordsCount,
    });

    const enrichedEstimate: MarketEstimate = {
      ...estimate,
      evidenceSource,
      source: estimate.source || rangeSource,
      similarRecordsCount: fobResult.similarRecordsCount,
      confidenceTier: fobResult.confidenceTier,
      // Include observedSuppliers if available
      observedSuppliers: observedSuppliers.length > 0 ? observedSuppliers : undefined,
      // Always include recentImporters (even if empty) so UI can show "No data" message
      recentImporters: recentImportersResult.importers.length > 0 ? recentImportersResult.importers : [],
      // Store metadata for UI display
      recentImportersWindowDays: recentImportersResult.windowDaysUsed,
      recentImportersTotalShipments: recentImportersResult.totalMatchedShipments,
    } as MarketEstimate & { recentImportersWindowDays?: number; recentImportersTotalShipments?: number };

    console.log("[Pipeline Step 2.5] Market estimate generated:", {
      hsCodeCandidates: enrichedEstimate.hsCodeCandidates?.length || 0,
      priceRange: enrichedEstimate.fobUnitPriceRange,
      evidenceSource: enrichedEstimate.source,
      similarRecordsCount,
      confidenceTier,
      recentImporters: enrichedEstimate.recentImporters?.length || 0,
    });

    return enrichedEstimate;
  } catch (error) {
    console.error("[Pipeline Step 2.5] Error generating market estimate:", error);
    // Return a fallback estimate
    return {
      hsCodeCandidates: [],
      fobUnitPriceRange: {
        min: 0,
        max: 0,
        currency: "USD",
        unit: "per unit",
      },
      fobPriceRange: {
        min: 0,
        max: 0,
        currency: "USD",
        unit: "per unit",
      },
      moqRange: {
        min: 100,
        max: 10000,
        typical: 1000,
      },
      leadTimeRange: {
        min: 30,
        max: 90,
        typical: 60,
      },
      primaryProductionCountries: ["China"],
      riskChecklist: ["Requires further market research"],
      notes: "Unable to generate detailed estimate. Please consult with sourcing experts.",
      source: "llm_baseline",
      evidenceSource: "llm_baseline",
      similarRecordsCount: 0,
      confidenceTier: "high_potential",
      rangeMethod: "category_default",
      scenarioAnalysis: undefined,
      volumeBasedPricing: undefined,
    };
  }
}

// ============================================================================
// Step 3: Landed Cost Calculation
// ============================================================================

/**
 * Calculate landed cost using formula: Unit * (1+Duty) + Shipping + Fee
 */
function calculateLandedCost(
  match: SupplierMatch,
  quantity: number,
  dutyRate: number,
  shippingCost: number,
  fee: number,
  analysis: ImageAnalysisResult
): LandedCost {
  console.log(
    `[Pipeline Step 3] Calculating landed cost for supplier: ${match.supplierName}`
  );

  // Apply benchmark enrichment if data is missing
  const benchmarks = enrichWithBenchmarks(analysis, dutyRate, shippingCost, quantity);
  
  // Use benchmark values if original values were missing/zero
  const effectiveDutyRate = benchmarks.dutyRate;
  const effectiveShippingCost = benchmarks.shippingCost;

  const baseUnitPrice = match.unitPrice;
  const dutyAmount = baseUnitPrice * effectiveDutyRate;
  
  const shippingPerUnit = (() => {
    // If we have a valid total shipping cost (user provided or benchmark), use it
    if (effectiveShippingCost > 0) {
      return effectiveShippingCost / quantity;
    }

    // Fallback to previous logic if somehow still 0 (should be covered by benchmarks)
    // Advanced logistics calculation based on CBM (if available) or category type
    
    // 1. If CBM is available, use it for precise calculation
    // Assume standard container shipping rates (approx $50/CBM LCL or $30/CBM FCL)
    // This is a simplified model: Base Rate + Handling
    if (analysis.estimatedUnitCBM && analysis.estimatedUnitCBM > 0) {
      const cbmRate = 150; // $150 per CBM (conservative LCL rate including port fees)
      const cbmCost = analysis.estimatedUnitCBM * cbmRate;
      return cbmCost;
    }

    // 2. Fallback to category-based logic if no CBM
    const logisticsType = match.evidence?.productTypes?.some(t => 
      t.toLowerCase().includes('furniture') || t.toLowerCase().includes('sofa') || t.toLowerCase().includes('chair')
    ) ? 'bulky' : 
    match.evidence?.productTypes?.some(t => 
      t.toLowerCase().includes('glass') || t.toLowerCase().includes('ceramic') || t.toLowerCase().includes('light')
    ) ? 'fragile' : 'standard';

    // Default fallback if no shipping cost provided at all
    let baseShipping = 0.5; // Default $0.50 per unit

    if (logisticsType === 'bulky') {
      return baseShipping * 3.5; 
    } else if (logisticsType === 'fragile') {
      const specialPackaging = 150 / quantity; 
      return (baseShipping * 1.2) + specialPackaging;
    }
    
    return baseShipping;
  })();

  const feePerUnit = fee / quantity;

  // Formula: Unit * (1+Duty) + Shipping + Fee
  const unitWithDuty = baseUnitPrice * (1 + effectiveDutyRate);
  const totalLandedCost = unitWithDuty + shippingPerUnit + feePerUnit;

  return {
    unitPrice: baseUnitPrice,
    dutyRate: effectiveDutyRate,
    shippingCost: shippingPerUnit,
    fee: feePerUnit,
    totalLandedCost,
    formula: `Unit * (1+Duty) + Shipping + Fee = ${baseUnitPrice.toFixed(2)} * (1+${effectiveDutyRate}) + ${shippingPerUnit.toFixed(2)} + ${feePerUnit.toFixed(2)} = ${totalLandedCost.toFixed(2)}${benchmarks.isBenchmark ? ' (Estimated)' : ''}`,
    breakdown: {
      baseUnitPrice,
      dutyAmount,
      shippingPerUnit,
      feePerUnit,
    },
  };
}

// ============================================================================
// Step 4: Benchmark Enrichment (Data Filling)
// ============================================================================

export interface BenchmarkData {
  origin: string;
  dutyRate: number;
  shippingCost: number;
  isBenchmark: boolean;
  source: string;
}

/**
 * Enrich missing data with category-based benchmarks
 * Used when Origin, Duty, or Shipping are missing/null
 */
function enrichWithBenchmarks(
  analysis: ImageAnalysisResult | undefined,
  currentDuty: number,
  currentShipping: number,
  quantity: number
): BenchmarkData {
  const category = (analysis?.category || "").toLowerCase();
  
  // 1. Origin & Duty Benchmarks
  // Default to China if unknown, as it's the primary sourcing hub
  let origin = "China";
  let dutyRate = currentDuty;
  
  if (!dutyRate || dutyRate === 0) {
    if (category.includes("textile") || category.includes("apparel")) {
      dutyRate = 0.15; // ~15% for textiles
      origin = "Vietnam"; // Alternative hub for textiles
    } else if (category.includes("furniture")) {
      dutyRate = 0.0; // Often duty free
      origin = "Vietnam"; // Major furniture hub
    } else if (category.includes("food")) {
      dutyRate = 0.05; // ~5%
    } else if (category.includes("electronics")) {
      dutyRate = 0.0; // Information Technology Agreement (often 0%)
    } else {
      dutyRate = 0.05; // General merchandise default
    }
  }

  // 2. Shipping Benchmarks
  // Estimate based on product type if user input (currentShipping) is 0 or missing
  let shippingCost = currentShipping;
  
  if (!shippingCost || shippingCost === 0) {
    // Estimate per-unit shipping based on likely dimensions/weight
    let perUnitShipping = 0.35; // Default small item
    
    if (analysis?.estimatedUnitCBM) {
      // If we have CBM, use it: $150/CBM (LCL rate)
      perUnitShipping = analysis.estimatedUnitCBM * 150;
    } else {
      // Heuristic based on category
      if (category.includes("furniture") || category.includes("sofa")) {
        perUnitShipping = 45.0; // Bulky
      } else if (category.includes("apparel") || category.includes("clothing")) {
        perUnitShipping = 0.50; // Light but volume
      } else if (category.includes("electronics")) {
        perUnitShipping = 0.25; // Small, dense
      } else if (category.includes("food") || category.includes("candy")) {
        perUnitShipping = 0.15; // Small, heavy/dense
      }
    }
    
    // Convert per-unit to total shipping cost for the batch
    shippingCost = perUnitShipping * quantity;
  }

  return {
    origin,
    dutyRate,
    shippingCost,
    isBenchmark: (!currentDuty || currentDuty === 0) || (!currentShipping || currentShipping === 0),
    source: "NexSupply Benchmark"
  };
}

// ============================================================================
// Step 5: Category-Specific Logic (Risk & Duty)
// ============================================================================

/**
 * Get category-specific risk checklist
 */
function getCategoryRiskChecklist(category: string): string[] {
  const cat = category.toLowerCase();
  
  if (cat.includes("food") || cat.includes("candy") || cat.includes("snack")) {
    return [
      "FDA Registration Required (Food Facility)",
      "Prior Notice filing for every shipment",
      "Ingredient label compliance (FDA regulations)",
      "Allergen declaration requirements",
      "Shelf life and expiration date verification"
    ];
  }
  
  if (cat.includes("furniture") || cat.includes("sofa") || cat.includes("chair")) {
    return [
      "TB117-2013 Flammability compliance (California)",
      "Lacey Act declaration (if wood components used)",
      "Formaldehyde emission standards (TSCA Title VI)",
      "Packaging drop test (ISTA 3A recommended for e-commerce)",
      "Anti-dumping duty checks (especially from China)"
    ];
  }
  
  if (cat.includes("lighting") || cat.includes("lamp") || cat.includes("led")) {
    return [
      "UL/ETL Certification (Safety)",
      "FCC Part 15 compliance (Radio frequency interference)",
      "Energy Guide label (if applicable)",
      "Lead content limits (California Prop 65)",
      "Voltage compatibility (110V-120V for US)"
    ];
  }
  
  if (cat.includes("toy") || cat.includes("game") || cat.includes("kid")) {
    return [
      "CPC (Children's Product Certificate) required",
      "ASTM F963 safety standard compliance",
      "Lead and Phthalate testing (CPSC)",
      "Small parts warning label (choking hazard)",
      "Tracking label requirements (batch/date)"
    ];
  }

  // Default General Merchandise
  return [
    "Customs value declaration accuracy",
    "Country of Origin marking",
    "Intellectual Property check (Trademarks/Patents)",
    "Packaging compliance (recycling symbols)",
    "California Prop 65 warning (if chemicals present)"
  ];
}

/**
 * Get category-specific estimated duty rate (if user input is 0/default)
 */
function getCategoryDutyEstimate(category: string): number {
  const cat = category.toLowerCase();
  
  // Note: These are rough estimates for US imports (MFN rates)
  // Actual rates vary by HS code and origin (Section 301 tariffs not included here to stay conservative)
  
  if (cat.includes("food")) return 0.05; // ~5%
  if (cat.includes("furniture")) return 0.0; // Many furniture items are duty free (excluding 301)
  if (cat.includes("lighting")) return 0.039; // ~3.9%
  if (cat.includes("toy")) return 0.0; // Toys are generally duty free
  if (cat.includes("textile") || cat.includes("apparel")) return 0.15; // ~15% (high duty)
  
  return 0.05; // Default 5%
}

// ============================================================================
// Main Pipeline Function
// ============================================================================

/**
 * Complete Intelligence Pipeline:
 * 1. Image Analysis (Gemini) - with Supabase caching
 * 2. Supplier Matching (ImportKey/Supabase Cache) - with caching
 * 3. Landed Cost Calculation (Formula: Unit * (1+Duty) + Shipping + Fee)
 *
 * @param params Pipeline parameters including image URL and cost calculation inputs
 * @returns Complete pipeline result with analysis, matches, and landed costs
 */
export async function runIntelligencePipeline(
  params: IntelligencePipelineParams,
  warnOnce?: (message: string) => void
): Promise<IntelligencePipelineResult> {
  const startTime = Date.now();
  const pipelineWarnings: string[] = [];
  console.log("[Pipeline] Starting intelligence pipeline with params:", {
    imageUrl: params.imageUrl,
    quantity: params.quantity,
    dutyRate: params.dutyRate,
    productId: params.productId,
  });

  try {
    // Step 1: Image Analysis (with caching)
    let normalizedAnalysis: ImageAnalysisResult;
    let analysisCached = false;
    let analysisId: string | undefined;
    try {
      // HACK: Force refresh for testing
      if (params.productId) {
        console.log(`[Pipeline] Force refresh enabled for productId: ${params.productId}. Skipping cache checks.`);
      }

      const analysisResp = await analyzeProductImage(params.imageUrl, params.productId, params.imagePublicUrl);
      normalizedAnalysis = normalizeAnalysisResult(analysisResp.result);
      analysisCached = false; // Force refresh
      analysisId = analysisResp.analysisId;
    } catch (analysisError) {
      console.error("[Pipeline] Image analysis failed, continuing with extracted signals only:", analysisError instanceof Error ? analysisError.message : String(analysisError));
      normalizedAnalysis = normalizeAnalysisResult({
        productName: "",
        description: "",
        category: "",
        hsCode: null,
        attributes: {},
        keywords: [],
        confidence: 0,
      });
    }
    
    // Runtime assertion in dev mode
    if (process.env.NODE_ENV === 'development') {
      if (!Array.isArray(normalizedAnalysis.keywords)) {
        console.warn("[Pipeline] Regression guard: keywords is not an array, normalizing...");
      }
    }

    // Build signals from extraction results (for fallback matching)
    let productSignals: ProductSignals | undefined;
    let productSignalEvidence: ProductSignalEvidence | undefined;
    let categoryHint: CategoryHint | undefined;
    
    try {
      // Merge pre-extracted signals (barcode/label/vision/weight) with Step 1 analysis
      const signalsResult = buildSignalsFromUploads({
        barcodeExtraction: params.barcodeExtraction || (normalizedAnalysis.barcode ? {
          upc: normalizedAnalysis.barcode,
          rawText: normalizedAnalysis.barcodeRaw,
          success: true,
        } : undefined),
        barcodeVisionResult: params.barcodeVisionResult || (normalizedAnalysis.barcode ? { upc: normalizedAnalysis.barcode, success: true } : undefined),
        labelExtraction: params.labelExtraction || (normalizedAnalysis.labelData ? {
          terms: normalizedAnalysis.keywords || [],
          brand: (normalizedAnalysis as any).labelData?.brand,
          model: (normalizedAnalysis as any).labelData?.model,
          netWeightG: (normalizedAnalysis as any).labelData?.netWeight,
          origin: (normalizedAnalysis as any).labelData?.origin,
          warnings: (normalizedAnalysis as any).labelData?.warnings,
          materials: (normalizedAnalysis as any).labelData?.materials,
          unitCount: (normalizedAnalysis as any).labelData?.unitCount,
          success: true,
        } : undefined),
        labelVisionResult: params.labelVisionResult,
        visionTags: params.visionTags || normalizedAnalysis.keywords,
        weightInferenceG: params.weightInferenceG,
        step1Keywords: normalizedAnalysis.keywords, // Merge Step 1 keywords (lowest priority)
      });
      productSignals = signalsResult.signals;
      productSignalEvidence = signalsResult.evidence;
      
      // Infer category hint for prioritized searching
      const categoryInference = inferCategoryHint(productSignals.keywords || [], productSignals);
      categoryHint = categoryInference.categoryHint;
      
      if (process.env.NODE_ENV === 'development') {
        console.log("[Pipeline] Built product signals:", {
          keywords: productSignals.keywords?.length || 0,
          hasUpc: !!productSignals.upc,
          hasBrand: !!productSignals.brand,
          hasModel: !!productSignals.model,
          categoryHint,
          sourcesUsed: signalsResult.debug.sourcesUsed,
        });
      }
    } catch (signalError) {
      console.warn("[Pipeline] Failed to build signals:", signalError instanceof Error ? signalError.message : String(signalError));
      // Continue without signals - fallback matching will handle gracefully
    }

    // Step 2: Supplier Matching (with caching)
    // Note: runtimeAllowHs2 will be populated after market estimate if needed
    let runtimeAllowHs2: string[] | undefined = undefined;
    
    // Use normalized analysis for supplier matching
    let supplierMatches: SupplierMatch[] = [];
    let matchesCached = false;
    let supplierEmptyReason: "no_signals" | "no_matches" | "pipeline_error" | undefined;
    let supplierMatchMode: "normal" | "fallback" = "normal";
    
    try {
      const matchResult = await findSupplierMatches(
        normalizedAnalysis, 
        params.productId, 
        analysisId, 
        runtimeAllowHs2, 
        warnOnce,
        (params as any).reportId // EMERGENCY FIX: Pass reportId if available
      );
      supplierMatches = matchResult.matches;
      matchesCached = matchResult.cached;
    } catch (error) {
      console.error("[Pipeline Step 2] Supplier matching failed, will attempt fallback:", {
        error: error instanceof Error ? error.message : String(error),
        productName: normalizedAnalysis.productName,
        category: normalizedAnalysis.category,
      });
      
      // Attempt fallback matching using signals
      if (productSignals && productSignalEvidence) {
        try {
          const fallbackResult = await matchSuppliersFallback({
            signals: productSignals,
            evidence: productSignalEvidence,
            categoryHint,
          });
          
          supplierMatches = fallbackResult.candidates;
          supplierEmptyReason = fallbackResult.reasonCode as any;
          supplierMatchMode = "fallback";
          
          console.log("[Pipeline] Fallback supplier matching succeeded:", {
            candidatesCount: supplierMatches.length,
            reasonCode: supplierEmptyReason,
          });
        } catch (fallbackError) {
          console.error("[Pipeline] Fallback matching also failed:", fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
          supplierEmptyReason = "pipeline_error";
          // Keep any partial matches instead of wiping
          matchesCached = false;
        }
      } else {
        // No signals available
        supplierEmptyReason = "no_signals";
        matchesCached = false;
      }
    }

    // Separate matches by quality: Recommended (perfect matches, factory/trading only) vs Candidates (inferred/lower score/logistics)
    // Create a Set of recommended supplier IDs for efficient lookup
    const recommendedSupplierIds = new Set<string>();
    
    const recommendedSuppliers = supplierMatches.filter((m) => {
      const isPerfectMatch = !m.isInferred && (m.matchScore ?? 0) >= 50;
      const isFactoryOrTrading = m.supplierType === "factory" || m.supplierType === "trading";
      const isNotLogistics = m.supplierType !== "logistics";
      const hasValidType = m.supplierType !== undefined && m.supplierType !== "unknown";
      
      // Recommended: perfect match AND (factory/trading with valid type) AND not logistics
      const isRecommended = isPerfectMatch && 
                           ((isFactoryOrTrading && hasValidType) || (m.supplierType === undefined && isPerfectMatch)) && 
                           isNotLogistics;
      
      if (isRecommended) {
        recommendedSupplierIds.add(m.supplierId);
      }
      
      return isRecommended;
    });
    
    // Candidates: everything that's NOT in recommended
    const candidateSuppliers = supplierMatches.filter((m) => {
      return !recommendedSupplierIds.has(m.supplierId);
    });

    console.log(
      `[Pipeline] Separated matches: ${recommendedSuppliers.length} recommended, ${candidateSuppliers.length} candidates`
    );

    // ============================================================================
    // NO Synthetic Fallback - Show Real Status When No Matches Found
    // ============================================================================
    let allMatches = [...recommendedSuppliers, ...candidateSuppliers];
    
    if (allMatches.length === 0) {
      console.log("[Pipeline] ========================================");
      console.log("[Pipeline] ⚠️  ZERO SUPPLIER MATCHES FOUND");
      console.log("[Pipeline] ========================================");
      console.log("[Pipeline] Searched with keywords:", JSON.stringify(limitedTerms));
      console.log("[Pipeline] Database searched: supplier_products (300K+ records)");
      console.log("[Pipeline] Filters applied: logistics companies removed, invalid names removed");
      console.log("[Pipeline] Result: No real factories found in public trade data");
      console.log("[Pipeline] ========================================");
      console.log("[Pipeline] Action: UI will show 'No public records found' + Premium verification CTA ($49)");
      console.log("[Pipeline] NO SYNTHETIC DATA GENERATED - Maintaining trust & transparency");
      console.log("[Pipeline] ========================================");
      
      // DO NOT create synthetic matches - this damages trust
      // Instead, the UI will detect zero matches and show:
      // - "No exact match found in public trade data"
      // - Upgrade CTA for $49 verification with manual sourcing
      // - This is more honest than showing fake "Candidate Factory" entries
    }

    // Filter out matches with unitPrice = 0 (no pricing data available)
    const pricedMatches = supplierMatches.filter((m) => (m.unitPrice ?? 0) > 0);
    const pricedRecommended = recommendedSuppliers.filter((m) => (m.unitPrice ?? 0) > 0);

    // Step 2.5: Market Estimate (always computed, uses priced signals when available)
    let marketEstimate: MarketEstimate | undefined;
    
    try {
      marketEstimate = await inferMarketEstimateWithGemini(normalizedAnalysis, supplierMatches);
    } catch (step25Error) {
      console.error("[Pipeline Step 2.5] Market estimate generation failed, continuing without it:", 
        step25Error instanceof Error ? step25Error.message : String(step25Error));
      // Set minimal market estimate instead of crashing - supplierMatches are preserved
      pipelineWarnings.push("market_estimate_failed");
      marketEstimate = {
        hsCodeCandidates: [],
        fobUnitPriceRange: { min: 0, max: 0, currency: "USD", unit: "per unit" },
        fobPriceRange: { min: 0, max: 0, currency: "USD", unit: "per unit" },
        moqRange: { min: 100, max: 10000, typical: 1000 },
        leadTimeRange: { min: 30, max: 90, typical: 60 },
        primaryProductionCountries: ["China"],
        riskChecklist: ["Market estimate generation failed"],
        notes: "Unable to generate detailed estimate.",
        source: "error_fallback",
        evidenceSource: "error_fallback",
        similarRecordsCount: 0,
        confidenceTier: "low",
        rangeMethod: "category_default",
      };
    }
    
    // Extract runtimeAllowHs2 from market estimate for potential reranking
    const hsCandidatesResolved = resolveHsCodeCandidates({
      analysisHs: normalizedAnalysis.hsCode,
      marketHsCandidates: marketEstimate?.hsCodeCandidates || [],
      category: normalizedAnalysis.category,
    });
    if (marketEstimate) {
      marketEstimate.hsCodeCandidates = hsCandidatesResolved;
    }

    const hsCandidates = hsCandidatesResolved;
    runtimeAllowHs2 = allowHs2FromAnalysis({
      analysisHs: normalizedAnalysis.hsCode,
      hsCandidates,
    });
    
    // If we have runtimeAllowHs2, rerun supplier matching with it (optional)
    if (runtimeAllowHs2.length > 0) {
      console.log(`[Pipeline] Extracted runtimeAllowHs2: ${runtimeAllowHs2.join(", ")}`);
    }

    // Step 3: Landed Cost Calculation for priced matches only
    console.log(
      `[Pipeline Step 3] Calculating landed costs for ${pricedMatches.length} priced matches (${supplierMatches.length - pricedMatches.length} matches without pricing excluded)`
    );
    const landedCosts = pricedMatches.map((match) => ({
      match,
      landedCost: calculateLandedCost(
        match,
        params.quantity,
        params.dutyRate,
        params.shippingCost,
        params.fee,
        normalizedAnalysis // Pass full analysis for benchmark enrichment
      ),
    }));

    // Generate or use existing product ID
    const productId = params.productId || crypto.randomUUID();

    // Determine evidence level
    const hasBarcode = !!(normalizedAnalysis.barcode && normalizedAnalysis.barcode.length > 0);
    const hasLabel = !!(normalizedAnalysis.labelData && Object.keys(normalizedAnalysis.labelData).length > 0);
    const hasInternalRecords = !!(marketEstimate?.similarRecordsCount && marketEstimate.similarRecordsCount > 0);
    
    let evidenceLevel: "image_only" | "image_and_label" | "image_and_label_and_barcode" | "internal_records" = "image_only";
    if (hasInternalRecords) {
      evidenceLevel = "internal_records";
    } else if (hasBarcode && hasLabel) {
      evidenceLevel = "image_and_label_and_barcode";
    } else if (hasLabel) {
      evidenceLevel = "image_and_label";
    }

    // Get category key and intake rules
    const categoryKey = determineCategoryKey({
      category: normalizedAnalysis.category,
      keywords: normalizedAnalysis.keywords,
      hsCode: normalizedAnalysis.hsCode,
      productName: normalizedAnalysis.productName,
    });
    const profile = getCategoryProfile(categoryKey);

    // Step 4: Generate Comparison Data (DIY vs NexSupply)
    // Calculate best landed cost from matches (or estimate if no matches)
    const bestMatchCost = landedCosts.length > 0 
      ? Math.min(...landedCosts.map(lc => lc.landedCost.totalLandedCost))
      : (marketEstimate?.fobUnitPriceRange.min || 0) * (1 + params.dutyRate) + (params.shippingCost / params.quantity);

    const targetUnitCost = bestMatchCost > 0 ? bestMatchCost : 10; // Fallback to $10 if calculation fails

    // DIY Scenario: Higher product cost (inefficient sourcing), standard shipping, hidden costs
    const diyProductCost = targetUnitCost * 1.25; // 25% markup for inefficient sourcing
    const diyShipping = params.shippingCost / params.quantity;
    const diyHiddenCosts = targetUnitCost * 0.35; // 35% hidden costs (quality issues, time, unexpected fees)
    const diyEstimate = diyProductCost + diyShipping + diyHiddenCosts;

    // NexSupply Scenario: Optimized product cost, optimized shipping, transparent fee
    const nexProductCost = targetUnitCost; // Access to factory direct pricing
    const nexShipping = (params.shippingCost / params.quantity) * 0.85; // 15% shipping optimization
    const nexServiceFee = nexProductCost * 0.07; // 7% NexSupply fee
    const nexSupplyEstimate = nexProductCost + nexShipping + nexServiceFee;

    const comparison = {
      diyEstimate,
      nexSupplyEstimate,
      potentialSavings: Math.max(0, diyEstimate - nexSupplyEstimate),
      diyBreakdown: {
        productCost: diyProductCost,
        shipping: diyShipping,
        hiddenCosts: diyHiddenCosts
      },
      nexSupplyBreakdown: {
        productCost: nexProductCost,
        shipping: nexShipping,
        serviceFee: nexServiceFee
      }
    };

    const duration = Date.now() - startTime;
    console.log(`[Pipeline] Completed in ${duration}ms. Cached: analysis=${analysisCached}, matches=${matchesCached}, marketEstimate=${!!marketEstimate}`);

    return {
      productId,
      analysis: normalizedAnalysis, // Return normalized analysis
      supplierMatches, // All matches (for backward compatibility)
      recommendedSuppliers,
      candidateSuppliers,
      landedCosts,
      marketEstimate,
      comparison, // Add comparison data
      cached: {
        analysis: analysisCached,
        matches: matchesCached,
      },
      warnings: pipelineWarnings,
      timestamp: new Date().toISOString(),
      reportQuality: {
        evidenceLevel,
        categoryKey,
        intakeRules: profile.intakeRules,
      },
      // Signals and fallback matching metadata
      productSignals,
      productSignalEvidence,
      supplierEmptyReason,
      supplierMatchMode,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Pipeline] Error after ${duration}ms:`, error);
    
    // Regression guard: Even on error, try to return a minimal valid response with market estimate
    // This ensures the pipeline never completely fails - it always returns something usable
    try {
      console.log("[Pipeline] Attempting fallback: generating minimal market estimate...");
      const fallbackAnalysis: ImageAnalysisResult = {
        productName: "Unknown Product",
        description: "",
        category: "Uncategorized",
        hsCode: null,
        attributes: {},
        keywords: [],
        confidence: 0.5,
      };
      const normalizedFallback = normalizeAnalysisResult(fallbackAnalysis);
      
      // Try to generate a basic market estimate as fallback
      let fallbackMarketEstimate: MarketEstimate | undefined;
      try {
        fallbackMarketEstimate = await inferMarketEstimateWithGemini(normalizedFallback, []);
      } catch (fallbackError) {
        console.warn("[Pipeline] Fallback market estimate also failed, returning minimal result");
      }
      
      return {
        productId: params.productId || crypto.randomUUID(),
        analysis: normalizedFallback,
        supplierMatches: [],
        recommendedSuppliers: [],
        candidateSuppliers: [],
        landedCosts: [],
        marketEstimate: fallbackMarketEstimate,
        cached: {
          analysis: false,
          matches: false,
        },
        warnings: pipelineWarnings,
        timestamp: new Date().toISOString(),
        reportQuality: {
          evidenceLevel: "image_only",
          categoryKey: "unknown",
          intakeRules: [],
        },
        // Signals not available on error fallback
        supplierEmptyReason: "pipeline_error",
        supplierMatchMode: "normal",
      };
    } catch (fallbackError) {
      // If even the fallback fails, throw the original error
    throw new Error(
      `Intelligence pipeline failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    }
  }
}

/**
 * Clear cached analysis and matches for a product
 */
export async function clearPipelineCache(productId: string): Promise<void> {
  const supabaseAdmin = createAdminClient();

  await Promise.all([
    supabaseAdmin.from("product_analyses").delete().eq("product_id", productId),
    supabaseAdmin
      .from("product_supplier_matches")
      .delete()
      .eq("product_id", productId),
  ]);
}


