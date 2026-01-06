import ReportV2Renderer from "@/components/report-v2/ReportV2Renderer";
import { normalizeReport } from "@/lib/report/normalizeReport";

const sampleReportData = {
  id: "sample-report",
  productName: "Fruit Gummies Variety Pack (12 count)",
  category: "Confectionery",
  isSample: true,
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
      { id: "supp_1", name: "Gummy Delights Inc.", location: "Guangzhou, China", unit_price: 1.15, moq: 5000 },
      { id: "supp_2", name: "Sweet Treats Factory", location: "Shenzhen, China", unit_price: 1.20, moq: 3000 },
      { id: "supp_3", name: "Candy Creations Co.", location: "Dongguan, China", unit_price: 1.22, moq: 10000 },
    ],
  },
  baseline: {
    shelf_price: 14.99,
  },
  signals: {
    has_brand_anchor: true,
    has_front_photo: true,
    has_bottom_photo: true,
    has_scale_photo: true,
    has_origin: true,
  },
  inputStatus: {
    labelPhotoUploaded: true,
    labelOcrStatus: "SUCCESS",
    labelTextPresent: true,
    originConfirmed: true,
  },
  _decisionSummary: {
    _verdict: {
      decision: "GO",
      confidence: 0.95,
      summary: "High confidence. All signals are strong, and multiple verified suppliers have been found. Ready for immediate action.",
    },
    _actionPlan48h: {
      today: ["Initiate sample orders with Gummy Delights Inc. and Sweet Treats Factory."],
      tomorrow: ["Begin negotiations for a 5,000 unit pilot order."],
    },
    _sensitivity: {
      scenarios: [],
    },
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
