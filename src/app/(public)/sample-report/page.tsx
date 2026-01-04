import ReportV2Client from "@/app/reports/[reportId]/v2/ReportV2Client";
import { sampleReport } from "@/lib/report/sample-report";

export const dynamic = 'force-dynamic';

export default async function SampleReportPage() {
  const report = sampleReport;

  return (
    <div>
      <div className="bg-yellow-100 text-yellow-800 text-center p-2 text-sm">
        Sample Report
      </div>
      <ReportV2Client reportId={report.id} report={report} />
    </div>
  );
}
