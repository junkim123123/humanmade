// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await ctx.params;
  const body = await request.json();
  const admin = getSupabaseAdmin();

  try {
    // Fetch current report to get baseline
    const { data: reportData } = await admin
      .from("reports")
      .select("baseline")
      .eq("id", reportId)
      .single();

    if (!reportData?.baseline) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const { unitWeight, unitsPerCase, countryOfOrigin, shippingMode: rawShippingMode } = body;
    
    // Normalize "sea" to "ocean" (same meaning)
    const shippingMode = rawShippingMode === "sea" ? "ocean" : (rawShippingMode || "ocean");
    
    const unitWeightKg = unitWeight / 1000;

    // Recalculate shipping cost based on weight and mode
    const shippingPerUnitAir = 30 * unitWeightKg; // $30 per kg for air
    const shippingPerUnitOcean = 5 * unitWeightKg; // $5 per kg for ocean (sea)
    const shippingPerUnit = shippingMode === "air" ? shippingPerUnitAir : shippingPerUnitOcean;

    const oldCost = reportData.baseline.costRange.standard.totalLandedCost;
    const newStandardCost = 
      (reportData.baseline.costRange.standard.unitPrice || 0) +
      shippingPerUnit +
      (reportData.baseline.costRange.standard.dutyPerUnit || 0) +
      (reportData.baseline.costRange.standard.feePerUnit || 0);

    // Update report with new calculated values
    const { error: updateError } = await admin
      .from("reports")
      .update({
        baseline: {
          ...reportData.baseline,
          costRange: {
            ...reportData.baseline.costRange,
            standard: {
              ...reportData.baseline.costRange.standard,
              shippingPerUnit,
              totalLandedCost: newStandardCost,
            },
          },
          evidence: {
            ...reportData.baseline.evidence,
            assumptions: {
              ...reportData.baseline.evidence.assumptions,
              weight: `${unitWeight}g (confirmed)`,
            },
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      console.error("[Tighten Inputs] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to recalculate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      costImprovement: {
        before: oldCost,
        after: newStandardCost,
      },
      newCostRange: {
        standard: newStandardCost,
      },
    });
  } catch (error) {
    console.error("[Tighten Inputs] Error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
