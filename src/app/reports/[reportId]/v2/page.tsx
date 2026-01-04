import { notFound } from "next/navigation";
import ReportV2Page from "@/components/report/ReportV2Page";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { sampleReport } from "@/lib/report/sample-report";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GetReportResult =
  | { report: any; error?: undefined }
  | { report?: undefined; error: "NOT_FOUND" | "FORBIDDEN" };

async function getReport(reportId: string): Promise<GetReportResult> {
  try {
    // Validate reportId before making request
    if (!reportId || typeof reportId !== "string" || reportId.trim() === "") {
      console.error("[Report V2 Page] Invalid reportId:", reportId);
      return { error: "NOT_FOUND" };
    }
    
    const cleanReportId = reportId.trim();
    
    // Handle sample report
    if (cleanReportId === "sample-report") {
      return { report: sampleReport };
    }
    
    // Read report directly from DB using admin client
    const admin = getSupabaseAdmin();
    
    console.log(`[Report V2 Page] Reading report from DB:`, {
      reportId: cleanReportId,
    });
    
    // Try reading with retries (for eventual consistency)
    let reportData = null;
    let readError = null;
    const maxAttempts = 3;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const { data, error } = await admin
        .from("reports")
        .select("*")
        .eq("id", cleanReportId)
        .maybeSingle();
      
      reportData = data;
      readError = error;
      
      if (data && !error) {
        console.log(`[Report V2 Page] Report found on attempt ${attempt + 1}`);
        break;
      }
      
      if (attempt < maxAttempts - 1) {
        const delay = 500 * (attempt + 1); // 500ms, 1000ms, 1500ms
        console.log(`[Report V2 Page] Report not found, retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (readError) {
      console.error("[Report V2 Page] DB read error:", {
        message: readError.message,
        code: readError.code,
        reportId: cleanReportId,
      });
      return { error: "NOT_FOUND" };
    }
    
    if (!reportData) {
      console.error("[Report V2 Page] Report not found in DB:", cleanReportId);
      return { error: "NOT_FOUND" };
    }
    
    // Get current user for ownership check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Enforce access rules
    // If report.user_id is null, allow anyone
    // If report.user_id exists, require authenticated user and must match
    const reportDataAny = reportData as any;
    if (reportDataAny.user_id !== null && reportDataAny.user_id !== undefined) {
      // Report has an owner - require authentication and ownership
      if (!user) {
        console.log("[Report V2 Page] Report requires auth but user not logged in:", cleanReportId);
        return { error: "FORBIDDEN" as const };
      }
      
      if (user.id !== reportDataAny.user_id) {
        console.log("[Report V2 Page] User mismatch:", {
          reportUserId: reportDataAny.user_id,
          requestUserId: user.id,
          reportId: cleanReportId,
        });
        return { error: "FORBIDDEN" as const };
      }
    }
    
    console.log("[Report V2 Page] Report access granted:", {
      reportId: cleanReportId,
      productName: reportDataAny.product_name,
      status: reportDataAny.status,
      userId: reportDataAny.user_id,
    });

    return { report: reportDataAny };
  } catch (error) {
    console.error("[Report V2 Page] Error reading report:", error);
    return { error: "NOT_FOUND" };
  }
}

// Forbidden UI component
function ForbiddenUI() {
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
  
  // Validate reportId format (UUID format or sample-report)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isSampleReport = reportId === "sample-report";
  
  if (!isSampleReport && !uuidRegex.test(reportId)) {
    console.error("[Report V2 Page] Invalid reportId format:", reportId);
    notFound();
  }

  console.log("[Report V2 Page] Reading report from DB:", {
    reportId,
    isValidFormat: isSampleReport || uuidRegex.test(reportId),
    timestamp: new Date().toISOString(),
  });
  
  const cleanReportId = reportId.trim();
  const result = await getReport(cleanReportId);
  
  if (result.error === "NOT_FOUND") {
    console.error("[Report V2 Page] Report not found:", cleanReportId);
    notFound();
  }
  
  if (result.error === "FORBIDDEN") {
    console.error("[Report V2 Page] Access forbidden:", cleanReportId);
    return <ForbiddenUI />;
  }

  // At this point, TypeScript knows result.report exists and result.error is undefined
  const report = result.report;

  console.log("[Report V2 Page] Successfully loaded report:", {
    reportId: cleanReportId,
    productName: report?.product_name || report?.productName,
    status: report?.status,
    schemaVersion: report?.schemaVersion || report?.schema_version,
  });

  return <ReportV2Page key={cleanReportId} reportId={cleanReportId} report={report} />;
}

