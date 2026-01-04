/**
 * Decision Summary Builder
 * Computes verdict, action plan, and sensitivity analysis from existing pipeline outputs
 * No external AI calls - purely deterministic based on report data
 */

import { pickVerdictTemplate } from "./pickVerdictTemplate";

export interface DecisionSummary {
  _verdict: {
    decision: "GO" | "HOLD" | "NO";
    reasons: string[];
    confidence: number; // 0-100
  };
  _actionPlan48h: {
    today: string[];
    tomorrow: string[];
  };
  _sensitivity: {
    scenarios: Array<{
      label: string;
      assumptionChange: string;
      impactOnLandedCost: {
        change: number; // percentage change
        newCost: number | null; // new landed cost if calculable
      };
      impactOnMargin: {
        change: number | null; // percentage change in margin, null if no retail price
        newMargin: number | null;
      };
    }>;
  };
}

/**
 * Compute decision summary from report data
 */
export function computeDecisionSummary(report: any, pipelineResult: any): DecisionSummary {
  const costRange = report.baseline?.costRange || {};
  const bestEstimate = costRange.standard?.totalLandedCost || 0;
  const minCost = costRange.conservative?.totalLandedCost || bestEstimate;
  const maxCost = costRange.range?.totalLandedCost?.p90 || bestEstimate * 1.2;
  
  // Get supplier matches from various sources
  const allMatches = report._supplierMatches || 
    (report._recommendedMatches ? (report._recommendedMatches || []).concat(report._candidateMatches || []) : []) || 
    [];
  const supplierMatches = allMatches.length;
  const exactMatches = allMatches.filter((m: any) => (m.exact_match_count || 0) > 0).length;
  
  const inputStatus = report.inputStatus || report.data?.inputStatus || {};
  const hasBarcode = inputStatus.barcodePhotoUploaded || inputStatus.barcodeDecoded;
  const hasLabel = inputStatus.labelPhotoUploaded || inputStatus.labelOcrStatus === "SUCCESS";
  const hasWeight = inputStatus.weightGrams || inputStatus.weightDefaultUsed === false;
  const hasOrigin = inputStatus.originConfirmed || inputStatus.originCountry;
  
  const dutyRange = report._dutyRange || report.baseline?.riskFlags?.tariff?.dutyRate || null;
  const dutyMin = typeof dutyRange === "number" ? dutyRange : dutyRange?.min || 0;
  const dutyMax = typeof dutyRange === "number" ? dutyRange : dutyRange?.max || 0;
  
  // Get category from report
  const category = report.category || report.baseline?.category || "unknown";
  const reportId = report.id || report.reportId || "unknown";
  
  // Determine compliance trigger
  const categoryLower = category.toLowerCase();
  const complianceTriggerSuspected = 
    categoryLower.includes("electronics") ||
    categoryLower.includes("battery") ||
    categoryLower.includes("toy") ||
    categoryLower.includes("hybrid") ||
    (report.baseline?.riskFlags?.compliance?.hasRisk === true);
  
  // Calculate margin estimate if possible
  const targetSellPrice = report.targetSellPrice || report._priceUnit || null;
  const marginEstimate = targetSellPrice && bestEstimate > 0 
    ? ((targetSellPrice - bestEstimate) / targetSellPrice) * 100 
    : null;
  
  // Pick verdict template deterministically
  const templateResult = pickVerdictTemplate({
    reportId,
    category,
    decision: "GO", // Will be determined by pickVerdictTemplate
    dataQuality: {
      hasBarcode,
      hasLabel,
      labelReadable: inputStatus.labelOcrStatus === "SUCCESS" || inputStatus.labelOcrStatus === "success",
      hasWeight,
      hasBoxSize: !!(inputStatus.boxSize && !inputStatus.boxSizeDefaultUsed),
      supplierMatches,
      exactMatches,
      marginEstimate,
      complianceTriggerSuspected,
    },
  });
  
  // Compute verdict with template decision
  const verdict = computeVerdict({
    bestEstimate,
    minCost,
    maxCost,
    supplierMatches,
    exactMatches,
    hasBarcode,
    hasLabel,
    hasWeight,
    hasOrigin,
    dutyRange: dutyMax - dutyMin,
    category,
    templateDecision: templateResult.decision,
  });
  
  // Compute action plan
  const actionPlan = computeActionPlan48h({
    supplierMatches,
    exactMatches,
    hasBarcode,
    hasLabel,
    hasWeight,
    hasOrigin,
    verdict: verdict.decision,
  });
  
  // Compute sensitivity scenarios
  const sensitivity = computeSensitivity({
    bestEstimate,
    minCost,
    maxCost,
    dutyMin,
    dutyMax,
    hasOrigin,
    hasLabel,
  });
  
  return {
    _verdict: verdict,
    _actionPlan48h: actionPlan,
    _sensitivity: sensitivity,
  };
}

function computeVerdict(params: {
  bestEstimate: number;
  minCost: number;
  maxCost: number;
  supplierMatches: number;
  exactMatches: number;
  hasBarcode: boolean;
  hasLabel: boolean;
  hasWeight: boolean;
  hasOrigin: boolean;
  dutyRange: number;
  category: string;
  templateDecision: "GO" | "HOLD" | "NO";
}): DecisionSummary["_verdict"] {
  const { bestEstimate, supplierMatches, exactMatches, hasBarcode, hasLabel, hasWeight, hasOrigin, dutyRange, templateDecision } = params;
  
  // Use decision from template picker
  const decision = templateDecision;
  let confidence = 50;
  
  // Confidence logic
  if (bestEstimate <= 0) {
    confidence = 0;
  } else if (supplierMatches === 0) {
    confidence = 30;
  } else if (exactMatches === 0 && supplierMatches > 0) {
    confidence = 40;
  } else if (exactMatches >= 3) {
    confidence = 75;
  } else if (exactMatches >= 1) {
    confidence = 60;
  } else {
    confidence = 40;
  }
  
  // Adjust confidence based on input completeness
  if (hasBarcode && hasLabel && hasWeight && hasOrigin) {
    confidence = Math.min(100, confidence + 20);
  } else {
    const missingCount = [hasBarcode, hasLabel, hasWeight, hasOrigin].filter(Boolean).length;
    if (missingCount < 2) {
      confidence = Math.max(20, confidence - 15);
    }
  }
  
  // Adjust for duty range uncertainty
  if (dutyRange > 5) {
    confidence = Math.max(20, confidence - 10);
  }
  
  // Build reasons from template statement (split into 3 parts if needed)
  // Note: Template text will be stored separately in _verdictText
  // Here we provide fallback reasons
  const reasons: string[] = [];
  if (decision === "GO") {
    if (exactMatches >= 3) {
      reasons.push(`${exactMatches} exact supplier matches found`);
    } else if (exactMatches >= 1) {
      reasons.push(`${exactMatches} exact supplier match found`);
    } else {
      reasons.push("Supplier matches available");
    }
  } else if (decision === "HOLD") {
    if (supplierMatches === 0) {
      reasons.push("No supplier matches found");
    } else if (exactMatches === 0) {
      reasons.push("Only inferred supplier matches available");
    } else {
      reasons.push("Limited supplier evidence");
    }
  } else {
    reasons.push("Risk factors present");
  }
  
  return {
    decision,
    reasons: reasons.slice(0, 3),
    confidence: Math.max(0, Math.min(100, confidence)),
  };
}

function computeActionPlan48h(params: {
  supplierMatches: number;
  exactMatches: number;
  hasBarcode: boolean;
  hasLabel: boolean;
  hasWeight: boolean;
  hasOrigin: boolean;
  verdict: "GO" | "HOLD" | "NO";
}): DecisionSummary["_actionPlan48h"] {
  const { supplierMatches, exactMatches, hasBarcode, hasLabel, hasWeight, hasOrigin, verdict } = params;
  
  const today: string[] = [];
  const tomorrow: string[] = [];
  
  if (verdict === "GO") {
    today.push("Start verification to get 3 real factory options");
    today.push("Review supplier match details and pricing");
    if (!hasLabel) {
      today.push("Upload label photo to confirm origin and ingredients");
    }
    tomorrow.push("Await quotes from supplier outreach");
    tomorrow.push("Compare MOQ and lead time across suppliers");
    tomorrow.push("Prepare purchase order template");
  } else if (verdict === "HOLD") {
    if (supplierMatches === 0) {
      today.push("Upload a clear barcode or label to improve matching");
      today.push("Review product category classification");
    } else {
      today.push("Start verification to expand supplier options");
      today.push("Upload missing photos (barcode, label) for better matches");
    }
    if (!hasLabel) {
      today.push("Upload label photo to unlock stronger verdict");
    }
    tomorrow.push("Review updated supplier matches after photo upload");
    tomorrow.push("Confirm HS code classification with customs");
    if (!hasOrigin) {
      tomorrow.push("Verify country of origin for accurate duty calculation");
    }
  } else {
    // NO verdict
    today.push("Review cost breakdown and identify cost drivers");
    today.push("Consider alternative product specifications");
    today.push("Contact support for cost optimization suggestions");
    tomorrow.push("Re-run analysis with updated inputs");
    tomorrow.push("Explore volume discounts or alternative suppliers");
  }
  
  // Ensure arrays have at most 3 items
  return {
    today: today.slice(0, 3),
    tomorrow: tomorrow.slice(0, 3),
  };
}

function computeSensitivity(params: {
  bestEstimate: number;
  minCost: number;
  maxCost: number;
  dutyMin: number;
  dutyMax: number;
  hasOrigin: boolean;
  hasLabel: boolean;
}): DecisionSummary["_sensitivity"] {
  const { bestEstimate, minCost, maxCost, dutyMin, dutyMax, hasOrigin, hasLabel } = params;
  
  const scenarios: DecisionSummary["_sensitivity"]["scenarios"] = [];
  
  // Scenario 1: Duty rate variation
  if (dutyMax > dutyMin && bestEstimate > 0) {
    const dutyMid = (dutyMin + dutyMax) / 2;
    const dutyImpact = ((dutyMax - dutyMin) / dutyMid) * 100;
    const costAtMaxDuty = bestEstimate * (1 + (dutyMax - dutyMid) / 100);
    
    scenarios.push({
      label: "Duty rate uncertainty",
      assumptionChange: `Duty rate varies from ${dutyMin.toFixed(1)}% to ${dutyMax.toFixed(1)}%`,
      impactOnLandedCost: {
        change: dutyImpact,
        newCost: costAtMaxDuty,
      },
      impactOnMargin: {
        change: null, // No retail price available
        newMargin: null,
      },
    });
  }
  
  // Scenario 2: Supplier price variation
  if (maxCost > minCost && bestEstimate > 0) {
    const priceRangePct = ((maxCost - minCost) / bestEstimate) * 100;
    scenarios.push({
      label: "Supplier price range",
      assumptionChange: `Factory quotes range from $${minCost.toFixed(2)} to $${maxCost.toFixed(2)} per unit`,
      impactOnLandedCost: {
        change: priceRangePct,
        newCost: maxCost,
      },
      impactOnMargin: {
        change: null,
        newMargin: null,
      },
    });
  }
  
  // Scenario 3: Origin confirmation impact
  if (!hasOrigin && bestEstimate > 0) {
    const originImpact = 5; // Assume 5% impact from origin confirmation
    scenarios.push({
      label: "Origin confirmation",
      assumptionChange: "Confirming country of origin narrows duty rate range",
      impactOnLandedCost: {
        change: originImpact,
        newCost: bestEstimate * (1 + originImpact / 100),
      },
      impactOnMargin: {
        change: null,
        newMargin: null,
      },
    });
  }
  
  // Ensure we have exactly 3 scenarios (pad if needed)
  while (scenarios.length < 3) {
    scenarios.push({
      label: "Additional analysis needed",
      assumptionChange: "Upload more photos to unlock sensitivity analysis",
      impactOnLandedCost: {
        change: 0,
        newCost: null,
      },
      impactOnMargin: {
        change: null,
        newMargin: null,
      },
    });
  }
  
  return {
    scenarios: scenarios.slice(0, 3),
  };
}

