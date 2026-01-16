import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const PENDING_REQUEST_WINDOW_HOURS = 6;

type ManualTopupPayload = {
  creditsRequested?: number;
  notes?: string;
};

const FALLBACK_WA_ME_PHONE = "13146577892";

async function sendWhatsAppNotification(message: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;

  if (!phoneNumberId || !accessToken || !adminPhone) {
    return {
      sent: false,
      error: "WhatsApp env vars not configured",
      fallbackUrl: `https://wa.me/${FALLBACK_WA_ME_PHONE}?text=${encodeURIComponent(message)}`,
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: adminPhone,
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Manual Topup] WhatsApp send failed:", response.status, errorText);
      return {
        sent: false,
        error: errorText,
        fallbackUrl: `https://wa.me/${FALLBACK_WA_ME_PHONE}?text=${encodeURIComponent(message)}`,
      };
    }

    return { sent: true };
  } catch (error) {
    console.error("[Manual Topup] WhatsApp send error:", error);
    return {
      sent: false,
      error: "Request failed",
      fallbackUrl: `https://wa.me/${FALLBACK_WA_ME_PHONE}?text=${encodeURIComponent(message)}`,
    };
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as ManualTopupPayload;
    const creditsRequested = Math.max(1, Math.floor(body.creditsRequested || 1));
    const notes = body.notes?.trim() || null;

    const { data: existingRequest, error: existingError } = await supabase
      .from("credit_topup_requests")
      .select("id, created_at, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("[Manual Topup] Failed to check existing request:", existingError);
    }

    if (existingRequest?.created_at) {
      const createdAt = new Date(existingRequest.created_at);
      const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSince < PENDING_REQUEST_WINDOW_HOURS) {
        return NextResponse.json({
          success: true,
          alreadyPending: true,
          message: "Your request is already pending. Manual top-up takes 3–6 hours.",
        });
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from("credit_topup_requests")
      .insert({
        user_id: user.id,
        user_email: user.email || null,
        credits_requested: creditsRequested,
        notes,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[Manual Topup] Insert failed:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to submit request" },
        { status: 500 }
      );
    }

    const message = [
      "New manual credit request",
      `Email: ${user.email || "unknown"}`,
      `User ID: ${user.id}`,
      `Credits: ${creditsRequested}`,
      `Request ID: ${inserted?.id || "n/a"}`,
    ].join("\n");

    const whatsappResult = await sendWhatsAppNotification(message);
    if (!whatsappResult.sent) {
      console.warn("[Manual Topup] WhatsApp notification not sent:", whatsappResult.error);
    }

    return NextResponse.json({
      success: true,
      whatsappSent: whatsappResult.sent,
      fallbackUrl: whatsappResult.fallbackUrl || null,
      message: "Request received. Manual top-up takes 3–6 hours.",
    });
  } catch (error) {
    console.error("[Manual Topup] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
