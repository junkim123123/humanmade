import ReportV2Client from "@/app/reports/[reportId]/v2/ReportV2Client";

async function getSampleReport() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || "http://localhost:3000";
    
    const res = await fetch(`${baseUrl}/api/public/reports/sample`, {
      cache: "no-store",
    });

    if (res.status !== 200) return null;

    const json = await res.json().catch(() => null);
    if (!json?.success || !json?.report) return null;

    return json.report;
  } catch (error) {
    console.error("[Sample Report Page] Error fetching sample report:", error);
    return null;
  }
}

export default async function SampleReportPage() {
  const report = await getSampleReport();

  if (!report) {
    return <div>Failed to load sample report.</div>;
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
