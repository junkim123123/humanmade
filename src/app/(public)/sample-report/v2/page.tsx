import ReportV2Client from "@/app/reports/[reportId]/v2/ReportV2Client";
import { sampleReport } from "@/lib/report/sample-report";
import { getSupplierMatches } from "@/lib/report/normalizeReport";
import { DEMO_SUPPLIER_MATCHES } from "@/lib/report/demoSuppliers";

export const dynamic = 'force-dynamic';

export default async function SampleReportV2Page() {
  const report = sampleReport;
  
  // Normalize supplier matches to ensure consistent format
  const normalized = getSupplierMatches(report);
  
  // Use demo suppliers as fallback if no matches found
  // Optional: Check env kill switch (default: enabled)
  const useDemoFactories = process.env.NEXT_PUBLIC_DEMO_FACTORIES !== "0";
  
  if (useDemoFactories && (!Array.isArray(normalized) || normalized.length === 0)) {
    (report as any)._supplierMatches = DEMO_SUPPLIER_MATCHES;
  } else {
    (report as any)._supplierMatches = normalized;
  }
  
  // Mark as sample report for potential future use
  (report as any)._isSampleReport = true;

  return (
    <div>
      <div className="bg-yellow-100 text-yellow-800 text-center p-2 text-sm">
        Sample Report
      </div>
      <ReportV2Client reportId={report.id} report={report} />
    </div>
  );
}

