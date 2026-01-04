import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ReportV2Client from "./ReportV2Client";

export const dynamic = "force-dynamic";

async function getReport(reportId: string, headersList: Headers, retryCount = 0): Promise<{ report?: any; error?: "FORBIDDEN" | "NOT_FOUND" }> {
  const maxRetries = 8; // More retries
  const retryDelay = 2000; // 2 seconds - give DB more time
  
  try {
    // Build baseUrl from request headers
    const proto = headersList.get("x-forwarded-proto") || "http";
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;
    
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

    if (res.status === 403) {
      // Auth error - don't retry, return error to show user-friendly message
      console.error("[Report V2 Page] Access forbidden (403):", reportId);
      const json = await res.json().catch(() => ({}));
      return { error: "FORBIDDEN" as const };
    }

    if (res.status === 404) {
      // If report not found and we haven't exhausted retries, wait and retry
      if (retryCount < maxRetries) {
        console.log(`[Report V2 Page] Report not found (404), retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return getReport(reportId, headersList, retryCount + 1);
      }
      console.error("[Report V2 Page] Report not found after retries (404):", reportId);
      return { error: "NOT_FOUND" as const };
    }

    if (!res.ok) {
      // For server errors, retry
      if (retryCount < maxRetries && res.status >= 500) {
        console.log(`[Report V2 Page] API error (${res.status}), retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return getReport(reportId, headersList, retryCount + 1);
      }
      console.error("[Report V2 Page] API error:", res.status, res.statusText);
      return { error: "NOT_FOUND" as const };
    }

    const json = await res.json().catch((err) => {
      console.error("[Report V2 Page] JSON parse error:", err);
      return null;
    });
    
    if (!json?.ok) {
      // Check for auth errors
      if (json?.errorCode === "AUTH_REQUIRED" || json?.errorCode === "FORBIDDEN") {
        console.error("[Report V2 Page] Auth error:", json?.errorCode);
        return { error: "FORBIDDEN" as const };
      }
      
      // If ok=false but not auth error, it might be a temporary issue
      if (retryCount < maxRetries && json?.errorCode !== "NOT_FOUND") {
        console.log(`[Report V2 Page] API returned ok=false (${json?.errorCode}), retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return getReport(reportId, headersList, retryCount + 1);
      }
      console.error("[Report V2 Page] API returned ok=false:", json?.errorCode);
      return { error: "NOT_FOUND" as const };
    }
    
    if (!json?.report) {
      console.error("[Report V2 Page] API returned no report data");
      return { error: "NOT_FOUND" as const };
    }

    return { report: json.report };
  } catch (error) {
    // Retry on network errors
    if (retryCount < maxRetries) {
      console.log(`[Report V2 Page] Network error, retrying... (${retryCount + 1}/${maxRetries}):`, reportId);
      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
      return getReport(reportId, headers, retryCount + 1);
    }
    console.error("[Report V2 Page] Error fetching report:", error);
    return { error: "NOT_FOUND" as const };
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
  
  // Get headers for baseUrl construction
  const headersList = await headers();
  
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
  
  const result = await getReport(reportId, headersList);
  
  if (result.error === "FORBIDDEN") {
    // Show user-friendly message for auth errors
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-600 mb-6">
            This report belongs to another account. Please sign in to view your own reports.
          </p>
          <a
            href="/auth/signin"
            className="inline-block bg-slate-900 text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }
  
  if (result.error === "NOT_FOUND" || !result.report) {
    console.error("[Report V2 Page] Failed to fetch report after all retries:", reportId);
    notFound();
  }

  console.log("[Report V2 Page] Successfully fetched report:", {
    reportId,
    productName: result.report?.productName,
    status: result.report?.status,
  });

  return <ReportV2Client key={reportId} reportId={reportId} report={result.report} />;
}

