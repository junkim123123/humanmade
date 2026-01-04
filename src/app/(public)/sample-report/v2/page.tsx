import { sampleReport } from "@/lib/report/sample-report";
import { normalizeReport, getSupplierMatches } from "@/lib/report/normalizeReport";
import { DEMO_SUPPLIER_MATCHES } from "@/lib/report/demoSuppliers";
import ReportV2Renderer from "@/components/report-v2/ReportV2Renderer";

export const dynamic = 'force-dynamic';

export default async function SampleReportV2Page() {
  // Start with sample report
  const report = sampleReport;
  
  // Normalize the report
  const normalized = normalizeReport(report);
  
  // Get supplier matches
  const matches = getSupplierMatches(normalized);
  
  // If matches are empty, use demo suppliers (sample report always shows factories)
  if (matches.length === 0) {
    (normalized as any)._supplierMatches = DEMO_SUPPLIER_MATCHES;
  } else {
    (normalized as any)._supplierMatches = matches;
  }
  
  // Mark as sample report
  (normalized as any)._isSampleReport = true;

  return <ReportV2Renderer report={normalized} />;
}

