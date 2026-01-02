import type { Report } from "./types";
import { resolveCategoryProfile } from "../category-profile-resolver";
import { normalizeEvidence } from "./evidence";

export type DataQualityProfile = "food" | "accessory_toy" | "other";
export type DataQualityTier = "low" | "medium" | "high";

export interface DataQualitySignal {
  id: string;
  label: string;
  points: number;
  present: boolean;
}

export interface MissingSignal {
  id: string;
  label: string;
  impact: "high" | "medium" | "low";
}

export interface DataQualityResult {
  profile: DataQualityProfile;
  score: number;
  tier: DataQualityTier;
  reason: string;
  helperText: string;
  missingSignals: MissingSignal[];
  presentSignals: DataQualitySignal[];
  strength: "low" | "medium" | "high";
}

const listify = (items: string[]): string => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const mapImpact = (points: number): "high" | "medium" | "low" => {
  if (points >= 25) return "high";
  if (points >= 15) return "medium";
  return "low";
};

const resolveProfile = (report: Report): DataQualityProfile => {
  const reportAny = report as any;
  const category = report.category || reportAny.baseline?.category || reportAny.pipeline_result?.category || "";
  const profile = resolveCategoryProfile(category);
  if (profile.familyLabel === "Food") return "food";
  if (profile.familyLabel === "Toys") return "accessory_toy";
  return "other";
};

const collectFoodSignals = (reportAny: any, evidence: ReturnType<typeof normalizeEvidence>): DataQualitySignal[] => {
  const hasBarcode = evidence.barcode.detected;

  const hasUnitWeightFromUpload = Boolean(
    evidence.weight.grams &&
      evidence.weight.source &&
      evidence.weight.source !== "DEFAULT" &&
      evidence.weight.source !== "VISION_INFERENCE"
  );

  const hasOrigin = Boolean(evidence.origin.countryCode);
  const hasLabelTerms = Boolean(evidence.label.extracted);

  return [
    { id: "barcode", label: "UPC", points: 30, present: hasBarcode },
    { id: "unit_weight", label: "Net weight", points: 30, present: hasUnitWeightFromUpload },
    { id: "origin", label: "Origin", points: 20, present: hasOrigin },
    { id: "label_terms", label: "Label terms", points: 20, present: hasLabelTerms },
  ];
};

const collectAccessorySignals = (reportAny: any, evidence: ReturnType<typeof normalizeEvidence>): DataQualitySignal[] => {
  const inputStatus = reportAny._proof?.inputStatus || reportAny.inputStatus || {};
  const hasUnitWeightFromUpload = Boolean(
    evidence.weight.grams &&
      evidence.weight.source &&
      evidence.weight.source !== "DEFAULT" &&
      evidence.weight.source !== "VISION_INFERENCE"
  );

  const hasCasePack = !!(inputStatus.unitsPerCase && inputStatus.unitsPerCase > 0);
  const hasMaterial = Boolean(evidence.label.terms?.length);
  const hasDimensions = Boolean(reportAny.pipeline_result?.analysis?.labelData?.dimensions || reportAny.pipeline_result?.analysis?.labelData?.size || reportAny.pipeline_result?.analysis?.labelData?.length || reportAny.pipeline_result?.analysis?.labelData?.width || reportAny.pipeline_result?.analysis?.labelData?.height);
  const hasBrandOrModel = Boolean(
    reportAny._draft?.labelDraft?.brandDraft?.value ||
      reportAny.pipeline_result?.analysis?.labelData?.brand ||
      reportAny.pipeline_result?.analysis?.labelData?.model ||
      reportAny.brand
  );

  return [
    { id: "unit_weight", label: "Unit weight", points: 30, present: hasUnitWeightFromUpload },
    { id: "case_pack", label: "Units per case", points: 25, present: hasCasePack },
    { id: "material", label: "Material", points: 25, present: hasMaterial },
    { id: "dimensions", label: "Dimensions", points: 20, present: hasDimensions },
    { id: "brand_model", label: "Brand or model", points: 10, present: hasBrandOrModel },
  ];
};

const collectSignals = (profile: DataQualityProfile, reportAny: any, evidence: ReturnType<typeof normalizeEvidence>): DataQualitySignal[] => {
  if (profile === "food") return collectFoodSignals(reportAny, evidence);
  if (profile === "accessory_toy") return collectAccessorySignals(reportAny, evidence);
  // Default: use accessory toy rubric to avoid making up label-driven asks for non-food
  return collectAccessorySignals(reportAny, evidence);
};

const buildHelperText = (profile: DataQualityProfile, missing: MissingSignal[]): string => {
  if (missing.length === 0) {
    return profile === "food"
      ? "Key food signals confirmed from recent extractions."
      : "Key product signals confirmed from recent extractions.";
  }

  const labels = missing.map((m) => m.label.toLowerCase());
  return `Data quality improves when we confirm ${listify(labels)}`;
};

export function computeDataQuality(report: Report): DataQualityResult {
  const profile = resolveProfile(report);
  const reportAny = report as any;
  const evidence = normalizeEvidence(reportAny);
  const signals = collectSignals(profile, reportAny, evidence);

  const presentSignals = signals.filter((s) => s.present);
  const missingSignals: MissingSignal[] = signals
    .filter((s) => !s.present)
    .sort((a, b) => b.points - a.points)
    .map((s) => ({ id: s.id, label: s.label, impact: mapImpact(s.points) }));

  const score = presentSignals.reduce((sum, s) => sum + s.points, 0);
  const tier: DataQualityTier = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  const reason = presentSignals.length > 0
    ? `${presentSignals[0].label} confirmed`
    : "Some signals missing";

  const helperText = buildHelperText(profile, missingSignals.slice(0, 3));

  return {
    profile,
    score,
    tier,
    reason,
    helperText,
    missingSignals: missingSignals.slice(0, 3),
    presentSignals,
    strength: tier,
  };
}