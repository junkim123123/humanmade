import { REPORT_SCHEMA_VERSION, type Report } from "./types";

export const sampleReport: Report = {
  schemaVersion: REPORT_SCHEMA_VERSION,
  id: "sample-report",
  productName: "Fruit Gummies Variety Pack (12 count)",
  summary: "Retail-ready fruit gummies with multi-flavor pack, priced for club channel buyers. Shows how we present cost, risk, and evidence without requiring signup.",
  category: "confectionery",
  confidence: "medium",
  evidenceLevel: "similar_import",
  estimateQuality: "trade_backed",
  signals: {
    hasImportEvidence: true,
    hasInternalSimilarRecords: true,
    hasSupplierCandidates: true,
    verificationStatus: "none",
  },
  baseline: {
    costRange: {
      conservative: {
        unitPrice: 1.35,
        shippingPerUnit: 0.6,
        dutyPerUnit: 0.16,
        feePerUnit: 0.06,
        totalLandedCost: 2.17,
      },
      standard: {
        unitPrice: 1.15,
        shippingPerUnit: 0.45,
        dutyPerUnit: 0.12,
        feePerUnit: 0.05,
        totalLandedCost: 1.77,
      },
      range: {
        shippingPerUnit: { p10: 0.38, p50: 0.45, p90: 0.68 },
        dutyPerUnit: { p10: 0.1, p50: 0.12, p90: 0.16 },
        feePerUnit: { p10: 0.04, p50: 0.05, p90: 0.07 },
        totalLandedCost: { p10: 1.62, p50: 1.77, p90: 2.32 },
        billableWeightKg: { p10: 0.12, p50: 0.14, p90: 0.18 },
      },
    },
    riskScores: {
      tariff: 38,
      compliance: 52,
      supply: 36,
      total: 42,
    },
    riskFlags: {
      tariff: {
        hsCodeRange: ["1704.90", "1901.90"],
        adCvdPossible: false,
        originSensitive: true,
      },
      compliance: {
        requiredCertifications: ["FDA Food Facility Registration"],
        labelingRisks: ["Allergen statement (gelatin)", "Nutrition facts layout"],
        recallHints: ["Seal integrity for multi-pack"],
      },
      supply: {
        moqRange: { min: 500, max: 5000, typical: 2000 },
        leadTimeRange: { min: 28, max: 55, typical: 40 },
        qcChecks: ["Verify inner bag seal", "Drop test outer cartons", "Humidity control during fill"],
      },
    },
    evidence: {
      types: ["similar_records", "category_based"],
      assumptions: {
        packaging: "12 units per inner, 6 inners per carton; retail pouch with euro hole",
        weight: "0.14kg per unit (with packaging)",
        volume: "0.0012 m³ per carton",
        incoterms: "FOB Shanghai",
        shippingMode: "Air Express",
        unitsPerCase: "72 units"
      },
      inferredInputs: {
        shippingMode: {
          value: "air",
          source: "from_category",
          confidence: 0.72,
          explanation: "Lightweight snack with shelf-life sensitivity",
        },
        unitWeightG: {
          value: 140,
          source: "from_category",
          confidence: 0.68,
          explanation: "Includes retail pouch and master carton",
        },
        unitVolumeM3: {
          value: 0.002,
          source: "from_category",
          confidence: 0.62,
          explanation: "Compact retail packaging",
        },
        dutyRate: {
          value: 0.09,
          source: "from_category",
          confidence: 0.7,
          explanation: "HS 1704 candy baseline with sugar content",
        },
        feesPerUnit: {
          value: 0.05,
          source: "assumed",
          confidence: 0.5,
          explanation: "Payment and handling fees for small lots",
        },
        shippingPerUnit: {
          value: 0.48,
          source: "from_category",
          confidence: 0.55,
          explanation: "Air parcel quotation from East China to US West coast",
        },
        unitsPerCase: 72,
      },
      items: [],
      lastAttemptAt: null,
      lastSuccessAt: "2024-02-15T12:00:00.000Z",
      lastResult: "found",
      lastErrorCode: null,
    },
  },
  verification: {
    status: "not_requested",
  },
  nextActions: [
    {
      title: "Confirm HS code with label photo",
      description: "Upload packaging photo so we can lock duty at the right rate (1704 vs. 1901).",
      estimatedTime: "24 hours",
    },
    {
      title: "Request landed quotes",
      description: "We can source 3 factories and confirm MOQ/lead time with customs-ready paperwork.",
      estimatedTime: "2-3 days",
    },
    {
      title: "Set logistics lane",
      description: "Pick air vs. ocean and carton pack to tighten landed cost and timeline.",
      estimatedTime: "Same day",
    },
  ],
  verifiedQuotes: {
    suppliers: [],
    updatedAt: "2024-02-15T12:00:00.000Z",
  },
  createdAt: "2024-02-10T10:00:00.000Z",
  updatedAt: "2024-02-15T12:00:00.000Z"
};
