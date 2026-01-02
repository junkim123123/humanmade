import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createVerificationRequest } from "@/server/actions/orders";

export async function POST(req: NextRequest) {
  try {
    // Read raw body first to avoid json parse crashes on malformed payloads
    let raw = "";
    try {
      raw = await req.text();
    } catch (e) {
      raw = "";
      console.error("[orders/from-report] failed to read body", e);
    }

    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (parseError) {
      body = {};
      console.warn("[orders/from-report] JSON parse failed; continuing with empty body", parseError);
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const reportId = body?.reportId
      ?? body?.report_id
      ?? searchParams.get("reportId")
      ?? searchParams.get("report_id");
    const contactWhatsapp = body?.contactWhatsapp ?? body?.contact_whatsapp ?? null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized", detail: "Sign in required", raw }, { status: 500 });
    }

    if (!reportId) {
      return NextResponse.json({ error: "missing_reportId", detail: "reportId is required", raw }, { status: 500 });
    }

    const result = await createVerificationRequest({ reportId, contactWhatsapp, currentUser: { id: user.id, email: user.email } });

    if (!result.success || !result.orderId) {
      const errorCode = result.error || 'failed_to_start_verification';
      const response: any = { error: errorCode, raw };
      if ('detail' in result && result.detail) response.detail = result.detail;
      return NextResponse.json(response, { status: 500 });
    }

    // Return 200 with minimal payload for CTA redirect
    return NextResponse.json({ orderId: result.orderId }, { status: 200 });
  } catch (error) {
    const message = (error as Error)?.message || 'Unexpected error';
    console.error("[orders/from-report] unexpected", error);
    return NextResponse.json({ error: 'unexpected_error', detail: message, raw: null }, { status: 500 });
  }
}
