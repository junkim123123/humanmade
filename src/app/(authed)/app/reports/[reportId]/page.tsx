import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// App report detail route always redirects to V2
export default async function AppReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }> | { reportId: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const reportId = resolvedParams.reportId;
  
  if (!reportId) {
    redirect("/app/reports");
  }

  // Redirect to V2 report route
  redirect(`/reports/${reportId}/v2`);
}
