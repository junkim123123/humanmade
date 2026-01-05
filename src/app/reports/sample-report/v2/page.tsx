import ReportV2Renderer from "@/components/report-v2/ReportV2Renderer";
import { createDefaultDraftInference } from "@/lib/draft-inference-builder";
import { normalizeReport } from "@/lib/report/normalizeReport";

// Simulate a sample report object with a productName
const sampleReportData = {
  id: "sample-report",
  productName: "Fruit Gummies Variety Pack (12 count)",
  category: "Confectionery",
  pipeline_result: {
    scenarios: [],
  },
  baseline: {},
  signals: {},
  inputStatus: {
    labelPhotoUploaded: false,
    labelOcrStatus: "FAILED",
    labelTextPresent: false,
  },
  _decisionSummary: {
    _verdict: {
      decision: "GO",
    },
  },
};

export default function Page() {
  // Create default draft inference
  const draftInference = createDefaultDraftInference(sampleReportData.category);

  // Attach draft inference to the report data
  const reportWithDraft = {
    ...sampleReportData,
    pipeline_result: {
      ...sampleReportData.pipeline_result,
      draftInference,
    },
  };

  // Normalize the report to ensure all fields are consistent
  const normalizedReport = normalizeReport(reportWithDraft);

  return <ReportV2Renderer report={normalizedReport} />;
}
