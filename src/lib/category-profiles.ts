// @ts-nocheck
import type { ImageAnalysisResult, MarketEstimate } from "./intelligence-pipeline";

// ============================================================================
// Category Profile System
// ============================================================================

/**
 * Normalize HS Code to 2-digit format (HS2) for category-level matching
 * Example: "3926.40.00" -> "39", "3926.40" -> "39"
 */
export function normalizeHs2(hs?: string | null): string | null {
  if (!hs) return null;
  const digits = hs.replace(/\D/g, "");
  if (digits.length < 2) return null;
  return digits.slice(0, 2);
}

/**
 * Normalize HS Code to 6-digit format (HS6) for comparison
 */
export function normalizeHs6(hs?: string | null): string | null {
  if (!hs) return null;
  const digits = hs.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits.slice(0, 6);
}

export type CategoryKey =
  | "toy"
  | "food"
  | "hybrid"
  | "electronics"
  | "apparel"
  | "beauty"
  | "home_kitchen"
  | "furniture"
  | "hardware"
  | "chemical"
  | "packaging"
  | "industrial_parts"
  | "jewelry_accessories"
  | "stationery_office"
  | "pet";

export type IntakeItemKey =
  | "barcode"
  | "back_label"
  | "ingredients"
  | "nutrition"
  | "net_weight"
  | "age_grade"
  | "warnings"
  | "battery_label"
  | "power_spec"
  | "care_label"
  | "in_ci"
  | "sds"
  | "dimensions";

export type IntakeRequirement = "optional" | "recommended" | "critical";

export interface IntakeRule {
  key: IntakeItemKey;
  requirement: IntakeRequirement;
  reason: string;
}

export type CategoryProfile = {
  key: CategoryKey;
  label?: string;

  // HS2 is recommended to be applied only when there is an hsCode in the candidates
  // If hs2 is missing, pass through and rank by other scores only
  allowHs2?: string[];
  denyHs2?: string[];

  // Strong words that cause immediate mismatch/disqualification
  hardMismatchTerms?: string[];

  // Words that only apply a score penalty
  softPenaltyTerms?: string[];

  // Anchor boost phrases (brand phrases, etc.)
  anchorBoostPhrases?: string[];

  scoringWeights?: {
    anchorHit: number;
    hs2Match: number;
    hardMismatchPenalty: number;
    softPenalty: number;
  };

  limits?: {
    maxCandidatesBeforeRerank: number;
    maxFinal: number;
  };

  // Additional intake request policy (optional)
  intakeRules?: IntakeRule[];
};

/**
 * Determine category key from analysis
 * Priority: 1) HS2 hint, 2) Keywords and category text, 3) Default to hybrid
 */
export function determineCategoryKey(input: {
  category?: string;
  keywords?: string[];
  hsCode?: string | null;
  productName?: string;
}): CategoryKey {
  const text = `${input.productName ?? ""} ${input.category ?? ""} ${(input.keywords ?? []).join(" ")}`.toLowerCase();

  // Priority 1: HS2 hint (most reliable)
  const hs2 = (input.hsCode ?? "").replace(/\D/g, "").slice(0, 2);

  if (hs2 === "95") return "toy";
  if (["17","18","19","20","21","22"].includes(hs2)) return "food";
  if (hs2 === "33") return "beauty";
  if (["84","85"].includes(hs2)) return "electronics";
  if (["61","62","63"].includes(hs2)) return "apparel";
  if (hs2 === "94") return "furniture";
  if (["28","29","32","34","38"].includes(hs2)) return "chemical";
  if (["73","74","76","82","83"].includes(hs2)) return "hardware";

  // Priority 2: Keywords and category text
  const hasFood = ["snack","candy","jelly","cookie","biscuit","food","confectionery"].some(w => text.includes(w));
  const hasToy = ["toy","kids","children","play","collectible","figure","novelty"].some(w => text.includes(w));
  const hasBeauty = ["cosmetic","lotion","cream","serum","shampoo","skincare"].some(w => text.includes(w));
  const hasApparel = ["shirt","hoodie","pants","dress","fabric","cotton","polyester"].some(w => text.includes(w));
  const hasElectronics = ["battery","usb","charger","led","electronic","bluetooth"].some(w => text.includes(w));
  const hasChemical = ["detergent","cleaner","disinfectant","solvent","bleach"].some(w => text.includes(w));
  const hasFurniture = ["chair","table","shelf","sofa","cabinet"].some(w => text.includes(w));
  const hasHardware = ["pipe","conduit","valve","fitting","steel","aluminum"].some(w => text.includes(w));

  if (hasFood && hasToy) return "hybrid";
  if (hasFood) return "food";
  if (hasToy) return "toy";
  if (hasBeauty) return "beauty";
  if (hasApparel) return "apparel";
  if (hasElectronics) return "electronics";
  if (hasChemical) return "chemical";
  if (hasFurniture) return "furniture";
  if (hasHardware) return "hardware";

  // Priority 3: Default to home_kitchen
  return "home_kitchen";
}

/**
 * Get category profile for a category key
 */
export function getCategoryProfile(categoryKey: CategoryKey): CategoryProfile {
  return CATEGORY_PROFILES[categoryKey] || CATEGORY_PROFILES.home_kitchen;
}

/**
 * Extract allowHs2 from analysis and market estimate
 * Combines analysis HS code and top HS code candidates
 */
export function allowHs2FromAnalysis(params: {
  analysisHs?: string | null;
  hsCandidates?: Array<{ code: string; confidence: number }>;
}): string[] {
  const out = new Set<string>();

  const hs2a = normalizeHs2(params.analysisHs);
  if (hs2a) out.add(hs2a);

  // Ensure hsCandidates is an array
  const candidates = Array.isArray(params.hsCandidates) ? params.hsCandidates : [];
  const top = candidates
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, 3);

  for (const c of top) {
    const hs2 = normalizeHs2(c.code);
    if (hs2) out.add(hs2);
  }

  return Array.from(out);
}

/**
 * Extract brand phrases from keywords and product name
 * Looks for multi-word phrases, capitalized sequences, and &-containing phrases
 * Excludes single-token high-frequency words like "line", "set", etc.
 */
const ANCHOR_STOPWORDS = new Set([
  "line",
  "friends",
  "mini",
  "set",
  "cover",
  "pipe",
  "tube",
  "wire",
  "cable",
  "valve",
  "fitting",
  "joint",
  "connector",
]);

export function extractBrandPhrases(analysis: ImageAnalysisResult): string[] {
  const phrases: string[] = [];
  const text = `${analysis.productName} ${(analysis.keywords || []).join(" ")}`;
  
  // Extract capitalized sequences (e.g., "LINE FRIENDS", "Ottogi")
  // These are always kept as they're likely brand names
  const capitalizedMatches = text.match(/\b[A-Z][A-Z\s&]+[A-Z]\b/g);
  if (capitalizedMatches) {
    phrases.push(...capitalizedMatches.map((p) => p.trim().replace(/\s+/g, " ")));
  }
  
  // Extract 2+ word phrases from keywords (always keep multi-word)
  const keywords = analysis.keywords || [];
  for (let i = 0; i < keywords.length - 1; i++) {
    const phrase = `${keywords[i]} ${keywords[i + 1]}`.toLowerCase();
    if (phrase.length >= 6) {
      phrases.push(phrase);
    }
  }
  
  // Extract phrases with & (e.g., "Line & Friends")
  const andMatches = text.match(/\b\w+\s*&\s*\w+\b/gi);
  if (andMatches) {
    phrases.push(...andMatches.map((p) => p.trim().toLowerCase()));
  }
  
  // Filter out single-token stopwords
  // Only keep single tokens if they're 4+ chars AND not in stopwords
  const singleTokens = text
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !ANCHOR_STOPWORDS.has(t.toLowerCase()))
    .map((t) => t.toLowerCase());
  
  // Only add single tokens if they're not already part of a phrase
  for (const token of singleTokens) {
    const isPartOfPhrase = phrases.some((p) => p.toLowerCase().includes(token));
    if (!isPartOfPhrase) {
      phrases.push(token);
    }
  }
  
  return Array.from(new Set(phrases)).slice(0, 10);
}

/**
 * Count anchor phrase hits in text
 * Checks for brand phrases and multi-word anchor terms
 * Strong anchors (multi-word phrases) are worth more than single tokens
 */
export function countAnchorHits(
  text: string,
  brandPhrases: string[],
  anchorTerms: string[]
): number {
  const lowerText = text.toLowerCase();
  let hits = 0;

  // Check brand phrases (exact match, case-insensitive)
  // Multi-word phrases are "strong anchors" worth 2 points
  for (const phrase of brandPhrases) {
    const lowerPhrase = phrase.toLowerCase();
    if (lowerText.includes(lowerPhrase)) {
      // Multi-word phrases are worth more
      const wordCount = lowerPhrase.split(/\s+/).length;
      hits += wordCount >= 2 ? 2 : 1;
    }
  }

  // Check anchor terms (single tokens or short phrases)
  // Only count if not already counted as part of a brand phrase
  for (const term of anchorTerms) {
    const lowerTerm = term.toLowerCase();
    // Skip if this term is part of a brand phrase we already counted
    const isPartOfBrandPhrase = brandPhrases.some((p) => 
      p.toLowerCase().includes(lowerTerm) && p.toLowerCase() !== lowerTerm
    );
    if (!isPartOfBrandPhrase && lowerText.includes(lowerTerm)) {
      hits += 1;
    }
  }

  return hits;
}

/**
 * Hybrid signal bonus: detect candy vs toy signals in product text
 * Returns a bonus score (0-10) based on how well the text matches hybrid product patterns
 */
export function hybridSignalBonus(productText: string): number {
  const text = productText.toLowerCase();
  let bonus = 0;

  // Candy-related signals
  const candySignals = [
    "candy", "jelly", "gummy", "sweet", "sugar", "confectionery",
    "bean", "beans", "chocolate", "snack", "treat", "candy toy",
    "edible", "food", "flavor", "taste"
  ];
  
  // Toy-related signals
  const toySignals = [
    "toy", "figure", "collectible", "mini", "capsule", "surprise",
    "character", "play", "kids", "children", "game", "toy candy",
    "plush", "action figure", "collectible figure"
  ];

  const candyMatches = candySignals.filter(signal => text.includes(signal)).length;
  const toyMatches = toySignals.filter(signal => text.includes(signal)).length;

  // Bonus if both candy and toy signals are present (true hybrid)
  if (candyMatches > 0 && toyMatches > 0) {
    bonus = Math.min(10, (candyMatches + toyMatches) * 1.5);
  } else if (candyMatches > 0 || toyMatches > 0) {
    // Partial bonus if only one type of signal
    bonus = Math.min(5, (candyMatches + toyMatches) * 0.8);
  }

  return bonus;
}

/**
 * Rerank candidates with category profile
 * Applies HS2 gates, mismatch filters, and scoring adjustments
 * IMPORTANT: candidateText must be lowercased before calling this function
 */
export function rerankWithProfile(input: {
  baseScore: number;
  supplierName: string;
  productText: string; // Must be lowercase
  supplierHs?: string | null;
  analysisHs?: string | null;
  isLogistics: boolean;
  isGenericManifest: boolean;
  anchorHits: number;
  brandPhraseHits: number;
  profile: CategoryProfile;
  runtimeAllowHs2: string[];
  supplierType?: "factory" | "trading" | "logistics" | "unknown";
  evidenceSnippet?: string | null;
  lastSeenDays?: number | null;
}): { score: number; flags: string[] } {
  let score = input.baseScore;
  const flags: string[] = [];

  // Ensure text is lowercase for matching
  const text = `${input.supplierName} ${input.productText}`.toLowerCase();

  // Get scoring weights (with defaults)
  const weights = input.profile.scoringWeights || {
    anchorHit: 12,
    hs2Match: 8,
    hardMismatchPenalty: 80,
    softPenalty: 12,
  };

  // HS2 gate logic (only if supplier has HS code)
  const supplierHs2 = normalizeHs2(input.supplierHs);
  const analysisHs2 = normalizeHs2(input.analysisHs);
  const analysisHs6 = normalizeHs6(input.analysisHs);
  const supplierHs6 = normalizeHs6(input.supplierHs);
  
  if (supplierHs2) {
    const allowHs2 = new Set([...(input.profile.allowHs2 || []), ...input.runtimeAllowHs2]);
    const denyHs2 = new Set(input.profile.denyHs2 || []);

    if (denyHs2.has(supplierHs2)) {
      score -= weights.hardMismatchPenalty; // Strong penalty for deny
      flags.push("hs2_deny");
    } else if (allowHs2.size > 0 && !allowHs2.has(supplierHs2)) {
      score -= weights.hs2Match * 2; // Penalty for outside allow
      flags.push("hs2_outside_allow");
    } else if (allowHs2.has(supplierHs2)) {
      score += weights.hs2Match;
      flags.push("hs2_allow");
    }
  }

  // HS6 match bonus (if both have HS6)
  if (analysisHs6 && supplierHs6 && analysisHs6 === supplierHs6) {
    score += weights.hs2Match * 1.5; // HS6 is worth more than HS2
    flags.push("hs6_match");
  }

  // Hard mismatch check (immediate disqualification)
  const hardMismatchTerms = input.profile.hardMismatchTerms || [];
  for (const w of hardMismatchTerms) {
    if (w && text.includes(w.toLowerCase())) {
      score = 0; // Hard mismatch = immediate disqualification
      flags.push(`hard_mismatch:${w}`);
      return { score: 0, flags };
    }
  }

  // Soft penalty check
  const softPenaltyTerms = input.profile.softPenaltyTerms || [];
  for (const w of softPenaltyTerms) {
    if (w && text.includes(w.toLowerCase())) {
      score -= weights.softPenalty;
      flags.push(`soft_penalty:${w}`);
      break; // Only apply once
    }
  }

  // Generic manifest penalty
  if (input.isGenericManifest) {
    score -= weights.softPenalty;
    flags.push("generic_manifest");
  }

  // Logistics penalty
  if (input.isLogistics || input.supplierType === "logistics") {
    score -= 25; // Fixed logistics penalty
    flags.push("type_logistics");
  }

  // Anchor hit bonus
  if (input.anchorHits > 0) {
    score += weights.anchorHit * Math.min(3, input.anchorHits);
    flags.push(`anchor_hit:${input.anchorHits}`);
  }

  // Brand phrase hit bonus (stronger than regular anchor)
  if (input.brandPhraseHits > 0) {
    score += weights.anchorHit * 1.5 * Math.min(2, input.brandPhraseHits);
    flags.push(`brand_phrase_hit:${input.brandPhraseHits}`);
  }

  // Hybrid signal bonus: detect candy vs toy signals
  if (input.profile.key === "hybrid") {
    const hybridBonus = hybridSignalBonus(input.productText);
    if (hybridBonus > 0) {
      score += hybridBonus;
      flags.push(`hybrid_signal:${hybridBonus}`);
    }
  }

  // Anchor boost phrases (for hybrid and other categories)
  if (input.profile.anchorBoostPhrases && input.profile.anchorBoostPhrases.length > 0) {
    const fullText = `${input.supplierName} ${input.productText}`.toLowerCase();
    for (const phrase of input.profile.anchorBoostPhrases) {
      if (fullText.includes(phrase.toLowerCase())) {
        score += weights.anchorHit * 2; // Strong boost for brand phrases
        flags.push(`anchor_boost_phrase:${phrase}`);
        break; // Only count once
      }
    }
  }

  return { score: Math.max(0, Math.round(score)), flags };
}

// ============================================================================
// Category Profiles
// ============================================================================

export const CATEGORY_PROFILES: Record<CategoryKey, CategoryProfile> = {
  toy: {
    key: "toy",
    allowHs2: ["95"],
    denyHs2: ["84", "85", "73", "72", "68"],
    hardMismatchTerms: [
      "dough",
      "flour",
      "bakery",
      "fermentation",
      "mixer",
      "oven",
      "machinery",
      "valve",
      "cylinder",
      "gas",
      "compressor",
      "conduit",
      "steel conduit",
      "pipe industry",
      "soffit",
      "chair",
      "gazebo",
    ],
    softPenaltyTerms: ["food", "kitchen machine", "industrial", "equipment"],
    scoringWeights: { anchorHit: 12, hs2Match: 10, hardMismatchPenalty: 80, softPenalty: 15 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
    intakeRules: [
      { key: "barcode", requirement: "recommended", reason: "Helps with re-analysis, caching, and configuration estimation for same product" },
      { key: "age_grade", requirement: "recommended", reason: "Improves accuracy for ASTM F963 and CPSIA branching" },
      { key: "warnings", requirement: "recommended", reason: "Verify small parts, batteries, and age markings" },
    ],
  },

  food: {
    key: "food",
    allowHs2: ["17", "18", "19", "20", "21", "22"],
    denyHs2: ["84", "85", "95"],
    hardMismatchTerms: [
      "toy",
      "figure",
      "collectible",
      "steel conduit",
      "pipe",
      "chair",
    ],
    softPenaltyTerms: ["industrial", "machinery"],
    scoringWeights: { anchorHit: 10, hs2Match: 12, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
    intakeRules: [
      { key: "barcode", requirement: "recommended", reason: "Product identification, same SKU caching, and retail pack verification" },
      { key: "back_label", requirement: "recommended", reason: "Extract ingredients, allergens, origin, and net weight" },
      { key: "ingredients", requirement: "recommended", reason: "Improves HS candidate and customs risk accuracy" },
      { key: "net_weight", requirement: "recommended", reason: "Improves unit price and logistics calculation accuracy" },
    ],
  },

  hybrid: {
    key: "hybrid",
    // Candy plus toy, candy plus dispenser, promo gift with edible item
    allowHs2: [
      "17", "18", "19", "20", "21", "22", // food
      "95", // toys
      "39", // plastics for dispensers or figures
      "48", "49", // paper packaging
    ],
    // Strongly deny industrial machinery and building materials
    denyHs2: [
      "72", "73", "74", "76", // metals
      "84", "85", // machinery and electrical
      "68", "69", // stone ceramic in weird matches
      "94", // furniture
    ],
    // If these appear, kill the candidate even if anchor hits exist
    hardMismatchTerms: [
      "conduit",
      "galvanized",
      "steel conduit",
      "emt",
      "pipe industry",
      "pipe",
      "tube",
      "valve",
      "cylinder",
      "gas",
      "compressed",
      "hvac",
      "line set cover",
      "insulation",
      "soffit",
      "aluminum soffit",
      "chair",
      "gazebo",
      "adirondack",
      "lounge chair",
      "mixer machine",
      "dough mixer",
      "oven",
      "fermentation cabinet",
      "flour divider",
      "rotary oven",
      "bakery",
      "machinery",
      "industrial",
    ],
    // Penalize vague home or decor noise that often leaks in
    softPenaltyTerms: [
      "cover",
      "set cover",
      "siding",
      "soffit",
      "vented",
      "marble",
      "decoration",
      "dinnerware",
      "candle house",
      "furniture",
    ],
    // Brand phrases get a big boost, extracted from the analysis text
    anchorBoostPhrases: [
      "line friends",
      "ottogi",
      "brown",
      "cony",
      "sally",
    ],
    scoringWeights: {
      anchorHit: 12,
      hs2Match: 10,
      hardMismatchPenalty: 110,
      softPenalty: 18,
    },
    limits: {
      maxCandidatesBeforeRerank: 350,
      maxFinal: 12,
    },
    // Intake rules that specifically resolves the 1704 vs 9503 split
    intakeRules: [
      { key: "barcode", requirement: "recommended", reason: "Confirm same SKU cache and configuration units" },
      { key: "back_label", requirement: "recommended", reason: "Verify candy ratio, net weight, and ingredients" },
      { key: "ingredients", requirement: "recommended", reason: "Strengthen food classification signals" },
      { key: "warnings", requirement: "recommended", reason: "Strengthen toy safety marking signals" },
      { key: "age_grade", requirement: "recommended", reason: "Improve accuracy for toy-centric branching" },
    ],
  },

  electronics: {
    key: "electronics",
    allowHs2: ["84", "85"],
    denyHs2: ["17", "18", "19", "20", "21", "22"],
    hardMismatchTerms: [
      "biscuit",
      "snack",
      "candy",
      "cookie",
      "flour",
      "bakery",
    ],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
    intakeRules: [
      { key: "barcode", requirement: "recommended", reason: "Model identification and spec verification" },
      { key: "power_spec", requirement: "recommended", reason: "Verify voltage, wattage, and plug type" },
      { key: "battery_label", requirement: "recommended", reason: "Battery regulation and transportation branching" },
      { key: "warnings", requirement: "optional", reason: "Extract certification statements" },
    ],
  },

  apparel: {
    key: "apparel",
    allowHs2: ["61", "62", "63"],
    hardMismatchTerms: [
      "pipe",
      "conduit",
      "valve",
      "gas",
      "cylinder",
      "candy",
      "biscuit",
    ],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
    intakeRules: [
      { key: "care_label", requirement: "recommended", reason: "Significantly improves HS accuracy via fiber composition" },
      { key: "dimensions", requirement: "optional", reason: "Size specs and packaging calculation" },
      { key: "barcode", requirement: "optional", reason: "Retail SKU matching" },
    ],
  },

  beauty: {
    key: "beauty",
    allowHs2: ["33"],
    denyHs2: ["17", "18", "19", "95"],
    hardMismatchTerms: [
      "pipe",
      "conduit",
      "steel",
      "chair",
      "candy",
    ],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
    intakeRules: [
      { key: "back_label", requirement: "recommended", reason: "Verify warning statements and capacity" },
      { key: "in_ci", requirement: "recommended", reason: "Ingredient regulation branching" },
      { key: "net_weight", requirement: "recommended", reason: "Improves accuracy for ml/g based calculations" },
    ],
  },

  home_kitchen: {
    key: "home_kitchen",
    allowHs2: ["39", "73", "76", "82", "85", "94"],
    hardMismatchTerms: [
      "candy",
      "biscuit",
      "snack",
      "toy figure",
      "collectible",
    ],
    scoringWeights: { anchorHit: 10, hs2Match: 8, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 300, maxFinal: 12 },
    intakeRules: [
      { key: "dimensions", requirement: "recommended", reason: "Directly linked to volume and packaging calculation" },
      { key: "barcode", requirement: "optional", reason: "Retail SKU matching" },
    ],
  },

  furniture: {
    key: "furniture",
    allowHs2: ["94"],
    hardMismatchTerms: [
      "candy",
      "biscuit",
      "toy",
      "gas cylinder",
      "valve",
    ],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
    intakeRules: [
      { key: "dimensions", requirement: "critical", reason: "Freight and packaging calculation is almost everything" },
      { key: "back_label", requirement: "optional", reason: "Verify material" },
    ],
  },

  hardware: {
    key: "hardware",
    allowHs2: ["73", "74", "76", "82", "83", "84"],
    hardMismatchTerms: [
      "candy",
      "biscuit",
      "toy",
      "snack",
      "cosmetic",
    ],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 300, maxFinal: 12 },
    intakeRules: [
      { key: "dimensions", requirement: "recommended", reason: "Specs affect HS branching and unit price" },
      { key: "barcode", requirement: "optional", reason: "Model identification" },
    ],
  },

  chemical: {
    key: "chemical",
    allowHs2: ["28", "29", "32", "34", "38"],
    denyHs2: ["17", "18", "19", "20", "21", "22", "95"],
    hardMismatchTerms: [
      "toy",
      "candy",
      "biscuit",
      "snack",
      "collectible",
    ],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
    intakeRules: [
      { key: "sds", requirement: "recommended", reason: "Key for regulation and transportation branching" },
      { key: "back_label", requirement: "recommended", reason: "Verify hazard labels and ingredients" },
      { key: "net_weight", requirement: "recommended", reason: "Unit price calculation and freight estimation" },
    ],
  },

  // Legacy profiles (for backward compatibility)
  packaging: {
    key: "packaging",
    allowHs2: ["39", "48", "49"],
    denyHs2: ["84", "85", "95"],
    hardMismatchTerms: ["toy", "candy", "snack"],
    scoringWeights: { anchorHit: 10, hs2Match: 8, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
  },

  industrial_parts: {
    key: "industrial_parts",
    allowHs2: ["73", "74", "76", "82", "83", "84"],
    denyHs2: ["17", "18", "19", "20", "21", "22", "95"],
    hardMismatchTerms: ["candy", "snack", "toy", "cosmetic"],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 300, maxFinal: 12 },
  },

  jewelry_accessories: {
    key: "jewelry_accessories",
    allowHs2: ["71"],
    denyHs2: ["17", "18", "19", "20", "21", "22", "95"],
    hardMismatchTerms: ["pipe", "conduit", "valve", "candy", "snack"],
    scoringWeights: { anchorHit: 10, hs2Match: 14, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
  },

  stationery_office: {
    key: "stationery_office",
    allowHs2: ["48", "49"],
    denyHs2: ["17", "18", "19", "20", "21", "22", "95"],
    hardMismatchTerms: ["pipe", "conduit", "valve", "candy", "snack"],
    scoringWeights: { anchorHit: 10, hs2Match: 8, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
  },

  pet: {
    key: "pet",
    allowHs2: ["23"],
    denyHs2: ["17", "18", "19", "20", "21", "22", "95"],
    hardMismatchTerms: ["pipe", "conduit", "valve", "candy", "snack"],
    scoringWeights: { anchorHit: 10, hs2Match: 10, hardMismatchPenalty: 80, softPenalty: 12 },
    limits: { maxCandidatesBeforeRerank: 250, maxFinal: 10 },
  },
};
