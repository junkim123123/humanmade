import ReportV2Client from "@/app/reports/[reportId]/v2/ReportV2Client";
import { sampleReport } from "@/lib/report/sample-report";
import { DEMO_SUPPLIER_MATCHES } from "@/lib/report/demoSuppliers";

export const dynamic = 'force-dynamic';

export default async function SampleReportV2Page() {
  const report = sampleReport;
  
  // Force inject demo matches unconditionally for sample report
  (report as any)._isSampleReport = true;
  (report as any)._supplierMatches = DEMO_SUPPLIER_MATCHES;

  return (
    <div>
      <div className="bg-yellow-100 text-yellow-800 text-center p-2 text-sm">
        Sample Report
      </div>
      <ReportV2Client reportId={report.id} report={report} />
    </div>
  );
}

