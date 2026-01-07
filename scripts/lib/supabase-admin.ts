// scripts/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";

export function createScriptAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Make sure it's in your .env file.");
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
