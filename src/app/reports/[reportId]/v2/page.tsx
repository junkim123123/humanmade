import { notFound } from "next/navigation";
import ReportV2Renderer from "@/components/report-v2/ReportV2Renderer";
import { createClient } from "@/utils/supabase/server";
import { hydrateReportForV2 } from "@/lib/report/hydrateReportForV2";

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
  
  // Validate reportId format (UUID format only - sample-report is handled by sample-report/v2 route)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const cleanReportId = reportId.trim();
  
  if (!uuidRegex.test(cleanReportId)) {
    console.error("[Report V2 Page] Invalid reportId format (must be UUID):", cleanReportId);
    notFound();
  }
  
  // Get current user for access control
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const viewerUserId = user?.id || null;
  
  // Hydrate report with supplier matches and normalized fields
  const result = await hydrateReportForV2(cleanReportId, viewerUserId);
  
  // Handle errors
  if (!result.ok) {
    if (result.errorCode === "NOT_FOUND") {
      console.error("[Report V2 Page] Report not found:", cleanReportId);
      notFound();
    }
    if (result.errorCode === "FORBIDDEN") {
      console.log("[Report V2 Page] Access forbidden:", cleanReportId);
      return <ForbiddenUI />;
    }
    // Should not reach here, but TypeScript needs this
    notFound();
  }
  
  // Report access granted - render with shared renderer
  return <ReportV2Renderer report={result.report} />;
}

