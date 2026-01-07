// @ts-nocheck
import type { IntelligencePipelineResult } from "@/lib/intelligence-pipeline";
import type { Report } from "@/lib/report/types";
import { REPORT_SCHEMA_VERSION } from "@/lib/report/types";
import { inferCostInputs } from "@/lib/cost-inference";

/**
 * Build Report from Intelligence Pipeline Result
 * MVP version - focuses on what we know vs what we don't know
 */
export function buildReportFromPipeline(input: {
  reportId: string;
  inputKey: string;
  pipeline: IntelligencePipelineResult;
}): Report {
  const p = input.pipeline;
  const analysis = p.analysis;
  const market = p.marketEstimate;

  const productName = analysis?.productName ?? "Unknown product";
  const category = analysis?.category ?? "unknown";

  // Determine confidence tier - 항상 문자열로 변환하여 DB 제약 조건 준수
  let confidenceTier: "low" | "medium" | "high";
  
  if (market?.confidenceTier) {
    // market.confidenceTier가 이미 문자열인지 확인
    const tier = market.confidenceTier;
    if (typeof tier === "string" && (tier === "low" || tier === "medium" || tier === "high")) {
      confidenceTier = tier;
    } else {
      // 숫자나 다른 값이면 기본값으로
      confidenceTier = "medium";
    }
  } else {
    // analysis.confidence를 기반으로 계산 (0-1 범위 가정)
    const conf = typeof analysis?.confidence === "number" ? analysis.confidence : 0;
    // 0-1 범위를 클램핑
    const clampedConf = Math.min(Math.max(conf, 0), 1);
    confidenceTier = clampedConf >= 0.8 ? "high" : clampedConf >= 0.6 ? "medium" : "low";
  }

  // Extract price range from marketEstimate (prefer new fobUnitPriceRange)
  // Priority: landedCosts > fobUnitPriceRange > fobPriceRange > priceRange
  const priceRange = market?.fobUnitPriceRange ?? market?.fobPriceRange ?? market?.priceRange ?? null;
  const priceUnit = priceRange?.unit ?? market?.fobUnitPriceRange?.unit ?? market?.fobPriceRange?.unit ?? "per unit";

  const hsCandidatesCount = market?.hsCodeCandidates?.length ?? 0;
  const similarCount = market?.similarRecordsCount ?? 0;
  const hasLandedCosts = (p.landedCosts?.length ?? 0) > 0;

  // Calculate delivered cost range from landed costs if available
  let deliveredCostRange: { min: number; max: number } | null = null;
  if (hasLandedCosts) {
    const allLandedCosts = p.landedCosts.map((lc) => lc.landedCost.totalLandedCost);
    deliveredCostRange = {
      min: Math.min(...allLandedCosts),
      max: Math.max(...allLandedCosts),
    };
  }

  // Calculate FOB range from landed costs if available (highest priority)
  let fobRange: { min: number; max: number; unit?: string } | null = null;
  if (hasLandedCosts) {
    const allUnitPrices = p.landedCosts.map((lc) => lc.landedCost.unitPrice);
    fobRange = {
      min: Math.min(...allUnitPrices),
      max: Math.max(...allUnitPrices),
      unit: priceUnit,
    };
  } else if (priceRange) {
    fobRange = {
      min: priceRange.min,
      max: priceRange.max,
      unit: priceRange.unit ?? priceUnit,
    };
  }

  // Infer cost model inputs using category priors and available data
  const inferredInputs = inferCostInputs({
    analysis,
    marketEstimate: market,
    userInputs: {}, // No user inputs at initial report creation
  });

  // Calculate cost components using inferred values
  const unitsPerCase = 1;
  const unitPrice = fobRange?.min ?? 0;
  const unitPriceConservative = fobRange?.max ?? 0;
  const shippingRange = inferredInputs.shippingPerUnit.range || {
    p10: inferredInputs.shippingPerUnit.value * 0.85,
    p50: inferredInputs.shippingPerUnit.value,
    p90: inferredInputs.shippingPerUnit.value * 1.2,
  };
  const dutyRateRange = inferredInputs.dutyRate.range || {
    p10: inferredInputs.dutyRate.value * 0.9,
    p50: inferredInputs.dutyRate.value,
    p90: inferredInputs.dutyRate.value * 1.15,
  };
  const feesRange = inferredInputs.feesPerUnit.range || {
    p10: inferredInputs.feesPerUnit.value,
    p50: inferredInputs.feesPerUnit.value,
    p90: inferredInputs.feesPerUnit.value,
  };

  const dutyPerUnit = unitPrice * dutyRateRange.p50;
  const dutyPerUnitConservative = unitPriceConservative * dutyRateRange.p90;
  const shippingPerUnit = shippingRange.p50;
  const shippingPerUnitConservative = shippingRange.p90;
  const feesPerUnit = feesRange.p50;

  const totalRange = {
    p10: unitPrice + shippingRange.p10 + unitPrice * dutyRateRange.p10 + feesRange.p10,
    p50: unitPrice + shippingRange.p50 + dutyPerUnit + feesRange.p50,
    p90: unitPriceConservative + shippingPerUnitConservative + dutyPerUnitConservative + feesRange.p90,
  };

  const standardTotal = totalRange.p50;
  const conservativeTotal = totalRange.p90;

  // Determine risk scores
  const tariffRisk = hsCandidatesCount > 1 ? 65 : hsCandidatesCount === 0 ? 70 : 30;
  const complianceRisk = 40; // Default - can be enhanced later
  const supplyRisk = similarCount === 0 ? 50 : 30;

  // Build whyWide reasons
  const whyWide: string[] = [];
  if (hsCandidatesCount > 1) {
    whyWide.push("Multiple HS code candidates");
  }
  if (similarCount === 0) {
    whyWide.push("No similar import records found");
  }
  if (!hasLandedCosts) {
    whyWide.push("No priced supplier matches");
  }

  // Build next actions
  const nextActions: Array<{ title: string; description: string; estimatedTime: string }> = [];
  if (hsCandidatesCount > 1) {
    nextActions.push({
      title: "Confirm HS Code",
      description: "Verify HS code classification to ensure accurate duty calculation",
      estimatedTime: "24 hours",
    });
  }
  if (similarCount === 0) {
    nextActions.push({
      title: "Collect Additional Inputs",
      description: "Provide UPC, packaging photo, or materials to improve matching",
      estimatedTime: "5 minutes",
    });
  }

  const report: Report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    id: input.reportId,
    productName,
    summary: analysis?.description || `${productName} - ${category}`,
    category,
    confidence: confidenceTier,
    categoryConfidence: analysis?.confidence,

    signals: {
      hasImportEvidence: similarCount > 0,
      hasInternalSimilarRecords: similarCount > 0,
      hasSupplierCandidates: (p.supplierMatches?.length ?? 0) > 0,
      verificationStatus: "none",
    },

    baseline: {
      costRange: {
        standard: {
          unitPrice,
          shippingPerUnit,
          dutyPerUnit,
          feePerUnit: feesPerUnit,
          totalLandedCost: standardTotal,
          range: {
            shippingPerUnit: shippingRange,
            dutyPerUnit: {
              p10: unitPrice * dutyRateRange.p10,
              p50: dutyPerUnit,
              p90: dutyPerUnitConservative,
            },
            feePerUnit: feesRange,
            totalLandedCost: totalRange,
          },
        },
        conservative: {
          unitPrice: unitPriceConservative,
          shippingPerUnit: shippingPerUnitConservative,
          dutyPerUnit: dutyPerUnitConservative,
          feePerUnit: feesPerUnit,
          totalLandedCost: conservativeTotal,
        },
        range: {
          shippingPerUnit: shippingRange,
          dutyPerUnit: {
            p10: unitPrice * dutyRateRange.p10,
            p50: dutyPerUnit,
            p90: dutyPerUnitConservative,
          },
          feePerUnit: feesRange,
          totalLandedCost: totalRange,
          billableWeightKg: inferredInputs.billableWeightKg.range,
        },
      },
      riskScores: {
        tariff: tariffRisk,
        compliance: complianceRisk,
        supply: supplyRisk,
        total: Math.round((tariffRisk + complianceRisk + supplyRisk) / 3),
      },
      riskFlags: {
        tariff: {
          hsCodeRange: market?.hsCodeCandidates?.map((c) => c.code) || analysis?.hsCode ? [analysis.hsCode] : [],
          adCvdPossible: false, // TODO: Check AD/CVD database
          originSensitive: false, // TODO: Check origin sensitivity
        },
        compliance: {
          requiredCertifications: [], // TODO: Determine from category
          labelingRisks: [], // TODO: Determine from category
          recallHints: [], // TODO: Check recall database
        },
        supply: {
          moqRange: market?.moqRange || { min: 100, max: 5000, typical: 1000 },
          leadTimeRange: market?.leadTimeRange || { min: 30, max: 90, typical: 60 },
          qcChecks: [], // TODO: Determine from category
        },
      },
      evidence: {
        types: similarCount > 0 ? ["similar_records", "category_based"] : ["category_based"],
        assumptions: {
          packaging: "Standard packaging assumed",
          weight: inferredInputs.unitWeightG.explanation,
          volume: inferredInputs.unitVolumeM3.explanation,
          incoterms: "FOB",
          shippingMode: inferredInputs.shippingMode.value,
          unitsPerCase: `Assuming ${unitsPerCase} unit shipment (no repack)`,
        },
        inferredInputs: {
          shippingMode: inferredInputs.shippingMode,
          unitWeightG: inferredInputs.unitWeightG,
          unitVolumeM3: inferredInputs.unitVolumeM3,
          cartonPack: inferredInputs.cartonPack,
          billableWeightKg: inferredInputs.billableWeightKg,
          dutyRate: inferredInputs.dutyRate,
          feesPerUnit: inferredInputs.feesPerUnit,
          shippingPerUnit: inferredInputs.shippingPerUnit,
          unitsPerCase,
        },
        items: market?.observedSuppliers?.map((supplier, index) => ({
          id: `supplier-${index}-${supplier.exporterName}`,
          source: "internal_db" as const,
          title: supplier.exporterName,
          summary: supplier.evidenceSnippet || `${supplier.exporterName} found in ${supplier.recordCount} similar import record${supplier.recordCount > 1 ? 's' : ''}`,
          strength: (supplier.recordCount >= 10 ? "high" : supplier.recordCount >= 5 ? "medium" : "low") as "low" | "medium" | "high",
          observed: {
            lastSeenDate: supplier.lastSeenDays !== null ? new Date(Date.now() - supplier.lastSeenDays * 24 * 60 * 60 * 1000).toISOString() : null,
            likelyOrigins: [], // Not available from supplier_products
            typicalLotRange: {
              min: null,
              max: null,
              unit: "units" as const,
            },
            matchedBy: ["category"] as ("hs" | "keywords" | "category")[],
          },
        })) || [],
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastResult: null,
        lastErrorCode: null,
      },
      // Store metadata for UI display
      _priceUnit: fobRange?.unit ?? priceUnit,
      _similarRecordsCount: similarCount,
      _hsCandidatesCount: hsCandidatesCount,
      _hasLandedCosts: hasLandedCosts,
      // Store marketEstimate metadata for transparency
      _marketEstimate: market ? {
        priceRange: market.fobUnitPriceRange || market.fobPriceRange || market.priceRange,
        unit: market.fobUnitPriceRange?.unit || market.fobPriceRange?.unit || market.priceRange?.unit || "per unit",
        hsCandidates: market.hsCodeCandidates,
        evidenceSource: market.evidenceSource,
        source: market.source,
        rangeMethod: market.rangeMethod,
        confidenceTier: market.confidenceTier,
      } : null,
      // Store similar records sample (first 3)
      _similarRecordsSample: market?.observedSuppliers?.slice(0, 3) || [],
      // Store removal reasons if available in pipeline result
      _removalReasons: (p as any)._removalReasons || null,
    },

    verification: {
      status: "not_requested",
    },

    nextActions: nextActions.length > 0 ? nextActions : [
      {
        title: "Review cost breakdown",
        description: "Verify assumptions and proceed with supplier outreach",
        estimatedTime: "5 minutes",
      },
    ],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return report;
}

