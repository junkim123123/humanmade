import { notFound } from "next/navigation";
import ReportV2Client from "./ReportV2Client";

export const dynamic = "force-dynamic";

async function getReport(reportId: string) {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || "http://localhost:3000";
    
    const res = await fetch(`${baseUrl}/api/reports/${reportId}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      console.error("[Report V2 Page] Report not found (404):", reportId);
      return null;
    }

    if (!res.ok) {
      console.error("[Report V2 Page] API error:", res.status, res.statusText);
      return null;
    }

    const json = await res.json().catch((err) => {
      console.error("[Report V2 Page] JSON parse error:", err);
      return null;
    });
    
    if (!json?.success) {
      console.error("[Report V2 Page] API returned success=false:", json?.error);
      return null;
    }
    
    if (!json?.report) {
      console.error("[Report V2 Page] API returned no report data");
      return null;
    }

    return json.report;
  } catch (error) {
    console.error("[Report V2 Page] Error fetching report:", error);
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: { reportId: string };
}) {
  const { reportId } = await params;
  
  if (!reportId) {
    notFound();
  }

  const report = await getReport(reportId);
  
  if (!report) {
    notFound();
  }

  return <ReportV2Client key={reportId} reportId={reportId} report={report} />;
}

