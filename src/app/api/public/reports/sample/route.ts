import { NextResponse } from "next/server";
import { sampleReport } from "@/lib/report/sample-report";

export async function GET() {
  return NextResponse.json({ success: true, report: sampleReport });
}
