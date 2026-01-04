import ReportV2Client from "@/app/reports/[reportId]/v2/ReportV2Client";
import { sampleReport } from "@/lib/report/sample-report";
import { getSupplierMatches } from "@/lib/report/normalizeReport";

export const dynamic = 'force-dynamic';

export default async function SampleReportV2Page() {
  const report = sampleReport;
  
  // Normalize supplier matches to ensure consistent format
  const normalizedMatches = getSupplierMatches(report);
  
  // Attach normalized matches to report so components can use them
  const reportWithNormalizedMatches = {
    ...report,
    _supplierMatches: normalizedMatches,
  };

  return (
    <div>
      <div className="bg-yellow-100 text-yellow-800 text-center p-2 text-sm">
        Sample Report
      </div>
      <ReportV2Client reportId={report.id} report={reportWithNormalizedMatches} />
    </div>
  );
}

