/**
 * Local Simulators for Report V2
 * Deterministic calculations that make weak data feel real
 * No API calls - all computations are local
 */

/**
 * Create a stable hash from reportId
 */
function stableHash(reportId: string): number {
  let hash = 0;
  for (let i = 0; i < reportId.length; i++) {
    const char = reportId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Category default weights (in grams)
 */
const CATEGORY_WEIGHTS: Record<string, number> = {
  candy: 50,
  snack: 30,
  toy: 100,
  novelty: 80,
  combo: 60,
  food: 100,
  beverage: 250,
  beauty: 150,
  home: 200,
  electronics: 300,
  apparel: 150,
  default: 100,
};

/**
 * Resolve unit weight with deterministic jitter
 */
export function resolveUnitWeight(report: any): {
  weightGrams: number;
  weightRangeGrams: { min: number; max: number };
  weightSource: "user" | "label" | "vision" | "category_default";
} {
  const reportId = report.id || report.reportId || "unknown";
  const inputStatus = report.inputStatus || report.data?.inputStatus || report._proof?.inputStatus || report.extras?.inputStatus || {};
  const category = (report.category || report.baseline?.category || "default").toLowerCase();
  
  // Priority 1: User provided weight
  if (inputStatus.weightGrams && inputStatus.weightDefaultUsed === false) {
    const weight = Number(inputStatus.weightGrams);
    if (weight > 0) {
      return {
        weightGrams: weight,
        weightRangeGrams: {
          min: Math.round(weight * 0.82),
          max: Math.round(weight * 1.18),
        },
        weightSource: "user",
      };
    }
  }
  
  // Priority 2: Label extracted net weight
  if (inputStatus.labelExtractedWeight || inputStatus.netWeight) {
    const weight = Number(inputStatus.labelExtractedWeight || inputStatus.netWeight);
    if (weight > 0) {
      return {
        weightGrams: weight,
        weightRangeGrams: {
          min: Math.round(weight * 0.82),
          max: Math.round(weight * 1.18),
        },
        weightSource: "label",
      };
    }
  }
  
  // Priority 3: Vision inferred weight
  if (inputStatus.visionInferredWeight) {
    const weight = Number(inputStatus.visionInferredWeight);
    if (weight > 0) {
      return {
        weightGrams: weight,
        weightRangeGrams: {
          min: Math.round(weight * 0.82),
          max: Math.round(weight * 1.18),
        },
        weightSource: "vision",
      };
    }
  }
  
  // Priority 4: Category default with deterministic jitter
  // Find matching category
  let baseWeight = CATEGORY_WEIGHTS.default;
  for (const [key, value] of Object.entries(CATEGORY_WEIGHTS)) {
    if (category.includes(key)) {
      baseWeight = value;
      break;
    }
  }
  
  // Generate deterministic jitter from reportId
  const hash = stableHash(reportId);
  const jitter = ((hash % 17) / 100) - 0.08; // Range: -0.08 to 0.08
  const weightGrams = Math.round(baseWeight * (1 + jitter));
  
  return {
    weightGrams,
    weightRangeGrams: {
      min: Math.round(weightGrams * 0.82),
      max: Math.round(weightGrams * 1.18),
    },
    weightSource: "category_default",
  };
}

/**
 * Generate Draft HS candidates when label is missing
 */
export function generateDraftHsCandidates(report: any): Array<{
  code: string;
  confidence: number;
  rationale: string;
  evidenceSnippet: string | null;
  status: "DRAFT";
}> {
  const productName = report.productName || report.product_name || "";
  const category = (report.category || report.baseline?.category || "").toLowerCase();
  
  // Simple keyword-based HS code suggestions
  const candidates: Array<{ code: string; rationale: string }> = [];
  
  // Food/candy/snack
  if (category.includes("food") || category.includes("candy") || category.includes("snack") || category.includes("confectionery")) {
    candidates.push({
      code: "1704.90",
      rationale: "Sugar confectionery (including white chocolate), not containing cocoa",
    });
    candidates.push({
      code: "1901.90",
      rationale: "Food preparations of goods",
    });
  }
  
  // Toy/novelty
  if (category.includes("toy") || category.includes("novelty")) {
    candidates.push({
      code: "9503.00",
      rationale: "Other toys; reduced-size models",
    });
    candidates.push({
      code: "9504.90",
      rationale: "Articles for funfair, table or parlour games",
    });
  }
  
  // Beauty/cosmetics
  if (category.includes("beauty") || category.includes("cosmetic")) {
    candidates.push({
      code: "3304.99",
      rationale: "Beauty or make-up preparations",
    });
    candidates.push({
      code: "3307.90",
      rationale: "Pre-shave, shaving or after-shave preparations",
    });
  }
  
  // Electronics
  if (category.includes("electronic")) {
    candidates.push({
      code: "8543.70",
      rationale: "Other electrical machines and apparatus",
    });
    candidates.push({
      code: "8517.62",
      rationale: "Other apparatus for transmission or reception",
    });
  }
  
  // Default fallback
  if (candidates.length === 0) {
    candidates.push({
      code: "9999.99",
      rationale: "Classification pending label review",
    });
  }
  
  // Return at most 2 candidates with Draft status
  return candidates.slice(0, 2).map(c => ({
    code: c.code,
    confidence: 0.4, // Low confidence for Draft
    rationale: c.rationale,
    evidenceSnippet: null,
    status: "DRAFT" as const,
  }));
}

/**
 * Compute origin impact on landed cost and margin
 */
export function computeOriginImpact(
  report: any,
  selectedOrigin: string
): {
  selectedOrigin: string;
  selectedDutyRate: number;
  landedCostImpact: number;
  marginImpactPct: number | null;
} {
  // Get baseline duty rate (midpoint of range if available, else 0.09)
  const dutyRange = report._dutyRange || report.baseline?.riskFlags?.tariff?.dutyRate || null;
  let baselineRate = 0.09;
  if (dutyRange) {
    if (typeof dutyRange === "number") {
      baselineRate = dutyRange;
    } else {
      const min = dutyRange.min || 0;
      const max = dutyRange.max || 0.09;
      baselineRate = (min + max) / 2;
    }
  }
  
  // Origin duty rate model
  let selectedDutyRate = baselineRate;
  if (selectedOrigin === "CN") {
    selectedDutyRate = baselineRate;
  } else if (selectedOrigin === "VN") {
    selectedDutyRate = Math.max(0, baselineRate - 0.02);
  } else if (selectedOrigin === "TH") {
    selectedDutyRate = Math.max(0, baselineRate - 0.01);
  } else {
    // Default: same as baseline
    selectedDutyRate = baselineRate;
  }
  
  // Get duty base per unit
  // Prefer factory mid price, else derived from landed cost midpoint times 0.6
  let dutyBasePerUnit = 0;
  const costRange = report.baseline?.costRange || {};
  const midCost = costRange.standard?.totalLandedCost || 0;
  
  // Try to get factory price from supplier matches
  const supplierMatches = report._supplierMatches || [];
  if (supplierMatches.length > 0) {
    const firstMatch = supplierMatches[0];
    const factoryPrice = firstMatch._intel?.unitPrice || firstMatch.unitPrice;
    if (factoryPrice && factoryPrice > 0) {
      dutyBasePerUnit = factoryPrice;
    }
  }
  
  // Fallback to derived from landed cost
  if (dutyBasePerUnit === 0 && midCost > 0) {
    dutyBasePerUnit = midCost * 0.6; // Assume 60% is FOB price
  }
  
  // Compute delta
  const deltaLandedPerUnit = dutyBasePerUnit * (selectedDutyRate - baselineRate);
  
  // Compute margin impact if sell price exists
  const sellPrice = report.targetSellPrice || report._priceUnit || null;
  let marginImpactPct: number | null = null;
  if (sellPrice && sellPrice > 0) {
    marginImpactPct = (-deltaLandedPerUnit / sellPrice) * 100;
  }
  
  return {
    selectedOrigin,
    selectedDutyRate: selectedDutyRate * 100, // Convert to percentage
    landedCostImpact: deltaLandedPerUnit,
    marginImpactPct,
  };
}

/**
 * Get top 3 origin countries from supplier matches
 */
export function getTopOriginCountries(report: any, defaultOrigins: string[] = ["CN", "VN", "TH"]): string[] {
  const supplierMatches = report._supplierMatches || [];
  const originCounts: Record<string, number> = {};
  
  supplierMatches.forEach((match: any) => {
    const country = match._profile?.country || match.country;
    if (country) {
      originCounts[country] = (originCounts[country] || 0) + 1;
    }
  });
  
  // Sort by count and get top 3
  const sorted = Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([country]) => country);
  
  // Fill with defaults if needed
  const result = [...sorted];
  for (const defaultOrigin of defaultOrigins) {
    if (result.length < 3 && !result.includes(defaultOrigin)) {
      result.push(defaultOrigin);
    }
  }
  
  return result.slice(0, 3);
}

