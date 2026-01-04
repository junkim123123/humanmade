import { notFound } from "next/navigation";
import ReportV2Client from "./ReportV2Client";

export const dynamic = "force-dynamic";

async function getReport(reportId: string, retryCount = 0): Promise<any> {
  const maxRetries = 8; // More retries
  const retryDelay = 2000; // 2 seconds - give DB more time
  
  try {
    // Use absolute URL for server-side fetch
    // Try multiple methods to get the base URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      // Fallback: try to construct from request headers if available
      baseUrl = "http://localhost:3000";
    }
    
    // Validate reportId before making request
    if (!reportId || typeof reportId !== 'string' || reportId.trim() === '') {
      console.error("[Report V2 Page] Invalid reportId in getReport:", reportId);
      return null;
    }
    
    const cleanReportId = reportId.trim();
    const apiUrl = `${baseUrl}/api/reports/${cleanReportId}`;
    
    console.log(`[Report V2 Page] Fetching report from: ${apiUrl}`, {
      reportId: cleanReportId,
      baseUrl,
      retryCount,
    });
    
    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 404) {
      // If report not found and we haven't exhausted retries, wait and retry
      if (retryCount < maxRetries) {
        console.log(`[Report V2 Page] Report not found (404), retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return getReport(reportId, retryCount + 1);
      }
      console.error("[Report V2 Page] Report not found after retries (404):", reportId);
      return null;
    }

    if (!res.ok) {
      // For server errors, retry
      if (retryCount < maxRetries && res.status >= 500) {
        console.log(`[Report V2 Page] API error (${res.status}), retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return getReport(reportId, retryCount + 1);
      }
      console.error("[Report V2 Page] API error:", res.status, res.statusText);
      return null;
    }

    const json = await res.json().catch((err) => {
      console.error("[Report V2 Page] JSON parse error:", err);
      return null;
    });
    
    if (!json?.success) {
      // If success=false but not 404, it might be a temporary issue
      if (retryCount < maxRetries && json?.error !== "NOT_FOUND") {
        console.log(`[Report V2 Page] API returned success=false (${json?.error}), retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return getReport(reportId, retryCount + 1);
      }
      console.error("[Report V2 Page] API returned success=false:", json?.error);
      return null;
    }
    
    if (!json?.report) {
      console.error("[Report V2 Page] API returned no report data");
      return null;
    }

    return json.report;
  } catch (error) {
    // Retry on network errors
    if (retryCount < maxRetries) {
      console.log(`[Report V2 Page] Network error, retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
      return getReport(reportId, retryCount + 1);
    }
    console.error("[Report V2 Page] Error fetching report:", error);
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ reportId: string }> | { reportId: string };
}) {
  // Handle both Promise and direct params (Next.js 13+ compatibility)
  const resolvedParams = params instanceof Promise ? await params : params;
  const reportId = resolvedParams.reportId;
  
  if (!reportId) {
    console.error("[Report V2 Page] No reportId provided in params:", resolvedParams);
    notFound();
  }
  
  // Validate reportId format (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isSampleReport = reportId === "sample-report";
  
  if (!isSampleReport && !uuidRegex.test(reportId)) {
    console.error("[Report V2 Page] Invalid reportId format:", reportId);
    notFound();
  }

  console.log("[Report V2 Page] Attempting to fetch report:", {
    reportId,
    isValidFormat: isSampleReport || uuidRegex.test(reportId),
    timestamp: new Date().toISOString(),
  });
  
  const report = await getReport(reportId);
  
  if (!report) {
    console.error("[Report V2 Page] Failed to fetch report after all retries:", reportId);
    // Log additional diagnostic info
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || "http://localhost:3000";
    console.error("[Report V2 Page] Diagnostic info:", {
      reportId,
      baseUrl: baseUrl ? `${baseUrl}/api/reports/${reportId}` : "unknown",
      timestamp: new Date().toISOString(),
    });
    notFound();
  }

  console.log("[Report V2 Page] Successfully fetched report:", {
    reportId,
    productName: (report as any)?.productName,
    status: (report as any)?.status,
  });

  return <ReportV2Client key={reportId} reportId={reportId} report={report} />;
}

