import { notFound } from "next/navigation";
import ReportV2Page from "@/components/report/ReportV2Page";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { sampleReport } from "@/lib/report/sample-report";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// V2 SSR Badge component
function V2SSRBadge({ reportId, schemaVersion }: { reportId: string; schemaVersion?: number | string }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium shadow-sm">
        <span>V2 SSR</span>
        <span className="text-blue-600">•</span>
        <span className="font-mono text-[10px]">{reportId.slice(0, 8)}...</span>
        {schemaVersion && (
          <>
            <span className="text-blue-600">•</span>
            <span>v{schemaVersion}</span>
          </>
        )}
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

  const cleanReportId = reportId.trim();
  
  // Handle sample report
  if (isSampleReport) {
    const report = sampleReport as any;
    const schemaVersion = report?.schemaVersion || report?.schema_version;
    return (
      <>
        <V2SSRBadge reportId={cleanReportId} schemaVersion={schemaVersion} />
        <ReportV2Page key={cleanReportId} reportId={cleanReportId} report={report} />
      </>
    );
  }
  
  // Read report directly from DB using admin client
  const admin = getSupabaseAdmin();
  
  const { data: reportData, error: readError } = await admin
    .from("reports")
    .select("*")
    .eq("id", cleanReportId)
    .single();
  
  // Handle not found explicitly
  if (readError || !reportData) {
    console.error("[Report V2 Page] Report not found:", {
      reportId: cleanReportId,
      error: readError?.message,
    });
    notFound();
  }
  
  // Get current user for ownership check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Enforce access rules
  const reportDataAny = reportData as any;
  
  // If report.user_id is null, allow anyone
  // If report.user_id exists, require authenticated user and must match
  if (reportDataAny.user_id !== null && reportDataAny.user_id !== undefined) {
    // Report has an owner - require authentication and ownership
    if (!user) {
      console.log("[Report V2 Page] Report requires auth but user not logged in:", cleanReportId);
      return <ForbiddenUI />;
    }
    
    if (user.id !== reportDataAny.user_id) {
      console.log("[Report V2 Page] User mismatch:", {
        reportUserId: reportDataAny.user_id,
        requestUserId: user.id,
        reportId: cleanReportId,
      });
      return <ForbiddenUI />;
    }
  }
  
  // Report access granted - render with V2 SSR badge
  const schemaVersion = reportDataAny.schemaVersion || reportDataAny.schema_version;
  
  return (
    <>
      <V2SSRBadge reportId={cleanReportId} schemaVersion={schemaVersion} />
      <ReportV2Page key={cleanReportId} reportId={cleanReportId} report={reportDataAny} />
    </>
  );
}

