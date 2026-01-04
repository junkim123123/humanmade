/**
 * Deterministic Verdict Template Selection
 * Picks one of 100 prewritten templates based on report signals, category, and data quality
 * Uses reportId hash for consistent output per report
 */

import { VERDICT_TEMPLATES, VerdictTemplate } from "./verdict-templates";

// Template buckets organized by tone and use case
const GO_BASIC = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const HOLD_BASIC = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40];
const NO_COMPLIANCE = [41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
const GO_WEAK_DATA_ADVANTAGE = [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 100];
const HOLD_MISSING_INPUTS = [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 91, 92, 93, 94, 95, 96];
const NO_ECONOMICS = [71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 97, 98, 99];

interface PickVerdictTemplateParams {
  reportId: string;
  category: string;
  decision: "GO" | "HOLD" | "NO";
  dataQuality: {
    hasBarcode: boolean;
    hasLabel: boolean;
    labelReadable: boolean;
    hasWeight: boolean;
    hasBoxSize: boolean;
    supplierMatches: number;
    exactMatches: number;
    marginEstimate: number | null;
    complianceTriggerSuspected: boolean;
  };
}

/**
 * Create a stable hash from reportId
 */
function hashReportId(reportId: string): number {
  let hash = 0;
  for (let i = 0; i < reportId.length; i++) {
    const char = reportId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Determine decision based on rules
 */
function determineDecision(params: PickVerdictTemplateParams): "GO" | "HOLD" | "NO" {
  const { dataQuality } = params;
  
  // NO: Compliance trigger suspected and label missing or unreadable
  if (dataQuality.complianceTriggerSuspected && (!dataQuality.hasLabel || !dataQuality.labelReadable)) {
    return "NO";
  }
  
  // NO: Margin estimate is negative or near zero
  if (dataQuality.marginEstimate !== null && dataQuality.marginEstimate <= 0) {
    return "NO";
  }
  
  // HOLD: Barcode and label missing or unreadable
  if (!dataQuality.hasBarcode && (!dataQuality.hasLabel || !dataQuality.labelReadable)) {
    return "HOLD";
  }
  
  // HOLD: Weight default and box default and supplier matches empty
  if (!dataQuality.hasWeight && !dataQuality.hasBoxSize && dataQuality.supplierMatches === 0) {
    return "HOLD";
  }
  
  // GO: Otherwise
  return "GO";
}

/**
 * Select appropriate bucket based on decision, tone rules, and category
 */
function selectBucket(
  decision: "GO" | "HOLD" | "NO",
  category: string,
  dataQuality: PickVerdictTemplateParams["dataQuality"]
): number[] {
  const categoryLower = category.toLowerCase();
  const evidenceLevel = dataQuality.exactMatches >= 3 ? "high" : 
                       dataQuality.exactMatches >= 1 ? "medium" : "low";
  
  // Tone rules
  if (decision === "GO" && evidenceLevel === "low") {
    return GO_WEAK_DATA_ADVANTAGE;
  }
  
  if (decision === "HOLD" && evidenceLevel === "low") {
    return HOLD_MISSING_INPUTS;
  }
  
  // Category weighting
  if (decision === "GO") {
    // Food/candy/snack prefer food-oriented IDs
    if (categoryLower.includes("food") || categoryLower.includes("candy") || categoryLower.includes("snack")) {
      // Prefer early GO basic templates (food-focused)
      return GO_BASIC;
    }
    // Toy/novelty/accessory prefer supplier competition IDs
    if (categoryLower.includes("toy") || categoryLower.includes("novelty") || categoryLower.includes("accessory")) {
      // Prefer templates that mention supplier competition (around 10, 18, 55, 60, 88)
      return GO_BASIC.filter(id => [10, 18, 55, 60, 88].includes(id) || GO_WEAK_DATA_ADVANTAGE.includes(id));
    }
    // Combo prefer conservative IDs and HS ambiguity IDs
    if (categoryLower.includes("combo") || categoryLower.includes("hybrid")) {
      // Prefer templates that mention HS/classification (around 4, 17, 52, 83, 93)
      return GO_BASIC.filter(id => [4, 17, 52, 83, 93].includes(id) || GO_WEAK_DATA_ADVANTAGE.includes(id));
    }
    return GO_BASIC;
  }
  
  if (decision === "HOLD") {
    // Food/candy/snack prefer food-oriented HOLD templates
    if (categoryLower.includes("food") || categoryLower.includes("candy") || categoryLower.includes("snack")) {
      return HOLD_BASIC;
    }
    // Combo prefer HS ambiguity HOLD templates
    if (categoryLower.includes("combo") || categoryLower.includes("hybrid")) {
      // Prefer templates that mention HS/classification ambiguity (around 22, 27, 35, 67, 93)
      return HOLD_BASIC.filter(id => [22, 27, 35, 67, 93].includes(id) || HOLD_MISSING_INPUTS.includes(id));
    }
    return HOLD_BASIC;
  }
  
  // NO decision
  // Check if compliance-related
  if (dataQuality.complianceTriggerSuspected) {
    return NO_COMPLIANCE;
  }
  
  // Otherwise economics-related
  return NO_ECONOMICS;
}

/**
 * Pick template deterministically from bucket using reportId hash
 */
function pickFromBucket(bucket: number[], reportId: string): VerdictTemplate {
  const hash = hashReportId(reportId);
  const index = hash % bucket.length;
  const templateId = bucket[index];
  
  const template = VERDICT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    // Fallback to first template in bucket
    const fallbackId = bucket[0];
    return VERDICT_TEMPLATES.find(t => t.id === fallbackId) || VERDICT_TEMPLATES[0];
  }
  
  return template;
}

/**
 * Main function: Pick verdict template deterministically
 */
export function pickVerdictTemplate(params: PickVerdictTemplateParams): {
  templateId: number;
  text: string;
  decision: "GO" | "HOLD" | "NO";
} {
  // Determine decision based on rules
  const decision = determineDecision(params);
  
  // Select appropriate bucket
  const bucket = selectBucket(decision, params.category, params.dataQuality);
  
  // Pick template deterministically from bucket
  const template = pickFromBucket(bucket, params.reportId);
  
  return {
    templateId: template.id,
    text: template.statement,
    decision: template.decision,
  };
}

