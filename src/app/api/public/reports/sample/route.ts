import { NextResponse } from "next/server";
import { sampleReport } from "@/lib/report/sample-report";
import { getSupplierMatches } from "@/lib/report/normalizeReport";

export async function GET() {
  // Normalize supplier matches to ensure consistent format
  const normalizedMatches = getSupplierMatches(sampleReport);
  
  // Attach normalized matches to report so components can use them
  const reportWithNormalizedMatches = {
    ...sampleReport,
    _supplierMatches: normalizedMatches,
  };
  
  return NextResponse.json({ success: true, report: reportWithNormalizedMatches });
}
