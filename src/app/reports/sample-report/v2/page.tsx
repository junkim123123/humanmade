import ReportV2Renderer from "@/components/report-v2/ReportV2Renderer";
import { normalizeReport } from "@/lib/report/normalizeReport";

const sampleReportData = {
  id: "sample-report",
  productName: "Fruit Gummies Variety Pack (12 count)",
  category: "Confectionery",
  isSample: true,
  baseline: {
    shelf_price: 14.99,
    costRange: {
      standard: {
        unitPrice: 1.15,
        shippingPerUnit: 0.45,
        dutyPerUnit: 0.12,
        feePerUnit: 0.05,
        totalLandedCost: 1.77,
      },
      conservative: {
        unitPrice: 1.35,
        shippingPerUnit: 0.6,
        dutyPerUnit: 0.16,
        feePerUnit: 0.06,
        totalLandedCost: 2.17,
      },
      range: {
        shippingPerUnit: { p10: 0.38, p50: 0.45, p90: 0.68 },
        dutyPerUnit: { p10: 0.1, p50: 0.12, p90: 0.16 },
        feePerUnit: { p10: 0.04, p50: 0.05, p90: 0.07 },
        totalLandedCost: { p10: 1.62, p50: 1.77, p90: 2.32 },
        billableWeightKg: { p10: 0.12, p50: 0.14, p90: 0.18 },
      },
    },
    evidence: {
      inferredInputs: {
        shippingMode: { value: "air", source: "from_customs", confidence: 0.88, explanation: "Lightweight snack with shelf-life sensitivity" },
        unitWeightG: { value: 140, source: "assumed", confidence: 0.92, explanation: "Extracted from label photo OCR" },
        unitVolumeM3: { value: 0.002, source: "from_customs", confidence: 0.85, explanation: "Compact retail packaging" },
        dutyRate: { value: 0.09, source: "from_hs_estimate", confidence: 0.90, explanation: "HS 1704.90 confirmed from customs records" },
        feesPerUnit: { value: 0.05, source: "from_customs", confidence: 0.75, explanation: "Standard handling fees" },
        shippingPerUnit: { value: 0.45, source: "from_customs", confidence: 0.82, explanation: "Air parcel quotation" },
        unitsPerCase: 72,
      },
    },
  },
  pipeline_result: {
    draftInference: {
      unit_cost: 1.18,
      unit_cost_range: [1.15, 1.22],
      hs_code_candidates: [
        { hs_code: "1704.90", confidence: 0.95, description: "Sugar confectionery (including white chocolate), not containing cocoa" },
      ],
      logistics: {
        units_per_shipment: 5000,
        shipping_per_unit: 0.32,
        billable_weight: 1500,
        unit_weight: 0.25,
        box_volume: 0.02,
      },
    },
    supplier_matches: [
      {
        id: "supp_1",
        name: "Gummy Delights Inc.",
        location: "Guangzhou, China",
        unit_price: 1.15,
        moq: 5000,
        tier: "recommended",
        confidence: "high",
        _intel: { product_count: 45, price_coverage_pct: 78, last_seen_days: 45 },
        _profile: { country: "China", role: "Manufacturer", shipment_count_12m: 24 },
        _exampleProducts: [{ product_name: "Fruit Gummies 12-pack", unit_price: 1.15 }],
        flags: { why_lines: ["Customs records: 12 exact matches", "Internal dataset: 45 related items", "Verified manufacturer"] }
      },
      {
        id: "supp_2",
        name: "Sweet Treats Factory",
        location: "Shenzhen, China",
        unit_price: 1.20,
        moq: 3000,
        tier: "recommended",
        confidence: "medium",
        _intel: { product_count: 28, price_coverage_pct: 65, last_seen_days: 62 },
        _profile: { country: "China", role: "Manufacturer", shipment_count_12m: 18 },
        _exampleProducts: [{ product_name: "Sweet Gummies Mix", unit_price: 1.20 }],
        flags: { why_lines: ["Customs records: 8 company matches", "Internal dataset: 28 related items", "Established factory"] }
      },
      {
        id: "supp_3",
        name: "Candy Creations Co.",
        location: "Dongguan, China",
        unit_price: 1.22,
        moq: 10000,
        tier: "candidate",
        confidence: "medium",
        _intel: { product_count: 15, price_coverage_pct: 45, last_seen_days: null },
        _profile: { country: "China", role: "Manufacturer", shipment_count_12m: 5 },
        _exampleProducts: [],
        flags: { why_lines: ["Internal dataset: 15 related items", "Keyword match", "Large scale production"] }
      },
    ],
  },
  signals: {
    has_brand_anchor: true,
    has_front_photo: true,
    has_bottom_photo: true,
    has_scale_photo: true,
    has_origin: true,
    hasImportEvidence: true,
    hasInternalSimilarRecords: true,
    hasSupplierCandidates: true,
  },
  inputStatus: {
    labelPhotoUploaded: true,
    labelOcrStatus: "SUCCESS",
    labelTextPresent: true,
    originConfirmed: true,
    unitWeight: 140,
  },
  _decisionSummary: {
    _verdict: {
      decision: "GO",
      confidence: 0.95,
      summary: "Product point is clear, making marketing easy too. Once factory is secured, execution is possible immediately.",
    },
    _actionPlan48h: {
      today: ["Initiate sample orders with Gummy Delights Inc. and Sweet Treats Factory."],
      tomorrow: ["Begin negotiations for a 5,000 unit pilot order."],
    },
    _sensitivity: {
      scenarios: [
        {
          label: "Volume Scale",
          assumptionChange: "Increase to 20,000 units/mo",
          impactOnLandedCost: { change: -12.5, newCost: 1.55 },
          impactOnMargin: { change: 4.2, newMargin: 0.90 }
        },
        {
          label: "Logistics Optimization",
          assumptionChange: "Switch to direct ocean lane",
          impactOnLandedCost: { change: -8.2, newCost: 1.62 },
          impactOnMargin: { change: 2.8, newMargin: 0.89 }
        }
      ],
    },
  },
  v2: {
    costModel: {
      standard: { unitPrice: 1.15, shippingPerUnit: 0.45, dutyPerUnit: 0.12, feePerUnit: 0.05, totalLandedCost: 1.77 },
      conservative: { unitPrice: 1.35, shippingPerUnit: 0.6, dutyPerUnit: 0.16, feePerUnit: 0.06, totalLandedCost: 2.17 },
    },
    deliveredCostRange: { min: 1.77, max: 2.17 },
    hsCandidates: [
      { code: "1704.90", confidence: 0.95, rationale: "Sugar confectionery", evidenceSnippet: "Sugar confectionery (including white chocolate), not containing cocoa" },
    ],
    evidenceLevel: "exact_import",
    importKeyCompanies: [
      { companyName: "SWEET TREATS IMPORTS LLC", role: "Importer", shipmentsCount: 24, lastSeen: "2024-11-15", originCountry: "China", exampleDescription: "Fruit gummies variety pack 12 count", source: "internal_records" },
      { companyName: "CANDY DISTRIBUTORS INC", role: "Importer", shipmentsCount: 18, lastSeen: "2024-10-22", originCountry: "China", exampleDescription: "Assorted fruit gummies retail pack", source: "internal_records" },
    ],
  },
  _proof: {
    hsCode: "1704.90",
    hsConfidence: 95,
    labelTerms: ["Gelatin", "Sugar", "Natural flavors", "Citric acid", "Natural colors"],
    labelUploaded: true,
    labelOcrStatus: "SUCCESS",
    similarImportsCount: 42,
    leadsCount: 3,
    evidenceLevel: "high",
  },
  firstMatch: { id: "supp_1", name: "Gummy Delights Inc.", location: "Guangzhou, China", unit_price: 1.15, moq: 5000 },
  hasSupplierMatches: true,
  reportKeys: [],
  supplierMatchesLength: 3,
  supplierMatchesType: "array",
};

export default function Page() {
  const normalizedReport = normalizeReport(sampleReportData);
  return <ReportV2Renderer report={normalizedReport} />;
}
