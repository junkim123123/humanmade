import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminGrantCredits } from "@/server/actions/credits";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Code is required" },
        { status: 400 }
      );
    }

    // Validate and process code
    const normalizedCode = code.trim().toUpperCase();
    
    if (normalizedCode === "ATMNX") {
      // Grant 1 credit ($45 value)
      const result = await adminGrantCredits(
        user.id,
        1, // 1 credit = $45
        `Redeemed code: ${normalizedCode}`
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: "Code redeemed successfully! $45 credit added to your account.",
          newBalance: result.newBalance,
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to add credit" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid code" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[redeem-code] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

