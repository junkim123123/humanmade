import { NextResponse } from "next/server";
import { sampleReport } from "@/lib/report/sample-report";
import { getSupplierMatches } from "@/lib/report/normalizeReport";
import { DEMO_SUPPLIER_MATCHES } from "@/lib/report/demoSuppliers";

export async function GET() {
  // Normalize supplier matches to ensure consistent format
  const normalized = getSupplierMatches(sampleReport);
  
  // Use demo suppliers as fallback if no matches found
  // Optional: Check env kill switch (default: enabled)
  const useDemoFactories = process.env.NEXT_PUBLIC_DEMO_FACTORIES !== "0";
  
  const reportWithMatches = { ...sampleReport };
  
  if (useDemoFactories && (!Array.isArray(normalized) || normalized.length === 0)) {
    (reportWithMatches as any)._supplierMatches = DEMO_SUPPLIER_MATCHES;
  } else {
    (reportWithMatches as any)._supplierMatches = normalized;
  }
  
  // Mark as sample report for potential future use
  (reportWithMatches as any)._isSampleReport = true;
  
  return NextResponse.json({ success: true, report: reportWithMatches });
}
