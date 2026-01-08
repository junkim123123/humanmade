import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Default route now redirects to V2
export default async function Page({ 
  params 
}: { 
  params: Promise<{ reportId: string }> 
}) {
  const { reportId } = await params;
  
  if (!reportId) {
    redirect("/reports");
  }

  // Redirect to V2
  redirect(`/reports/${reportId}/v2`);
}
