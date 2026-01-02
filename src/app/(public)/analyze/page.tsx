import { AnalyzePage } from "@/components/analyze/AnalyzePage";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function PublicAnalyzePage() {
  const supabase = createClient(cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    redirect("/app/analyze");
  }

  return <AnalyzePage mode="public" />;
}
