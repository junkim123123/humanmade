"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function signOut() {
  const supabase = createClient(cookies());
  
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/");
}
