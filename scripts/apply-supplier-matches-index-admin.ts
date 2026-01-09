/**
 * Apply supplier matches cache unique index migration using Admin client
 * Run with: npx tsx scripts/apply-supplier-matches-index-admin.ts
 */

import { createAdminClient } from "@/utils/supabase/admin";

async function applyMigration() {
  try {
    console.log("🔧 Applying supplier matches cache unique index migration...\n");

    const supabaseAdmin = createAdminClient();

    // Supabase JS client doesn't support raw SQL execution
    // We need to use a workaround: create a function that executes SQL
    // Or use REST API directly
    
    // Try using Supabase REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    // Supabase doesn't provide direct SQL execution via REST API
    // We need to use pg client or Supabase Dashboard
    
    console.log("❌ Supabase JS client doesn't support raw SQL execution");
    console.log("\n📝 Please apply manually via one of these methods:\n");
    
    console.log("Method 1: Supabase Dashboard (Easiest)");
    console.log("  1. Open Supabase Dashboard > SQL Editor");
    console.log("  2. Copy and execute the following SQL:\n");
    
    const sql = `
-- Create unique index for product_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
  ON public.product_supplier_matches (product_id, supplier_id)
  WHERE product_id IS NOT NULL AND supplier_id IS NOT NULL;

-- Create unique index for analysis_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_analysis_supplier_uq
  ON public.product_supplier_matches (analysis_id, supplier_id)
  WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;

COMMENT ON INDEX product_supplier_matches_product_supplier_uq IS 'Unique index for upsert conflict resolution when product_id is present';
COMMENT ON INDEX product_supplier_matches_analysis_supplier_uq IS 'Unique index for upsert conflict resolution when analysis_id is present';
    `.trim();
    
    console.log(sql);
    console.log("\nMethod 2: Supabase CLI");
    console.log("  supabase db push");
    console.log("  (Requires migration file in supabase/migrations/ folder)");
    
    console.log("\nMethod 3: Set DATABASE_URL and run script");
    console.log("  export DATABASE_URL='postgresql://...'");
    console.log("  npx tsx scripts/apply-supplier-matches-index.ts");

  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

applyMigration();

