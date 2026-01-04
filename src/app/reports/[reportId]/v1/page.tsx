import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// V1 route redirects to V2
export default async function Page({ 
  params 
}: { 
  params: Promise<{ reportId: string }> | { reportId: string }
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const { reportId } = resolvedParams;
  
  if (!reportId) {
    redirect("/reports");
  }

  // Redirect to V2
  redirect(`/reports/${reportId}/v2`);
}

