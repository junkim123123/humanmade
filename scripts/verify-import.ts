// scripts/verify-import.ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createScriptAdminClient } from "./lib/supabase-admin";

async function verifyImport() {
  console.log("Connecting to Supabase...");
  const supabase = createScriptAdminClient();

  try {
    console.log("Verifying import for MANGO keyword...");
    const { count: mangoCount, error: mangoError } = await supabase
      .from("supplier_products")
      .select("*", { count: "exact", head: true })
      .ilike("product_name", "%MANGO%");

    if (mangoError) {
      console.error("Error fetching MANGO products:", mangoError);
    } else {
      console.log(`Found ${mangoCount} products with the keyword 'MANGO'.`);
    }

    console.log("Verifying import for PUDDING keyword...");
    const { count: puddingCount, error: puddingError } = await supabase
      .from("supplier_products")
      .select("*", { count: "exact", head: true })
      .ilike("product_name", "%PUDDING%");

    if (puddingError) {
      console.error("Error fetching PUDDING products:", puddingError);
    } else {
      console.log(`Found ${puddingCount} products with the keyword 'PUDDING'.`);
    }

    console.log("Verification complete.");
  } catch (error) {
    console.error("An unexpected error occurred:", error);
  }
}

verifyImport();
