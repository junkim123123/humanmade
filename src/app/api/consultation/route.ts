import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contactInfo = String(body?.contactInfo || "").trim();
    const source = String(body?.source || "zoom_booking_section");

    if (!contactInfo) {
      return NextResponse.json({ success: false, error: "Missing contact info." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;
    const { error } = await supabase
      .from("consultation_requests")
      .insert([{ contact_info: contactInfo, source }]);

    if (error) {
      console.error("[consultation] insert failed", error);
      return NextResponse.json({ success: false, error: "Failed to save request." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[consultation] request failed", err);
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
}
