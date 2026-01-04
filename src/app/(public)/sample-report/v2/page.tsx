import ReportV2Client from "@/app/reports/[reportId]/v2/ReportV2Client";
import { sampleReport } from "@/lib/report/sample-report";

export const dynamic = 'force-dynamic';

export default async function SampleReportV2Page() {
  const report = sampleReport;

  // Debug: Log supplier matches
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sample Report V2 Page] Report data:', {
      id: report.id,
      productName: report.productName,
      hasSupplierMatches: !!(report as any)._supplierMatches,
      supplierMatchesCount: (report as any)._supplierMatches?.length || 0,
      firstSupplier: (report as any)._supplierMatches?.[0] ? {
        id: (report as any)._supplierMatches[0].id,
        supplierName: (report as any)._supplierMatches[0].supplierName,
      } : null,
    });
  }

  return (
    <div>
      <div className="bg-yellow-100 text-yellow-800 text-center p-2 text-sm">
        Sample Report
      </div>
      <ReportV2Client reportId={report.id} report={report} />
    </div>
  );
}

