import { NextResponse } from "next/server";

import { hasLocale } from "@/lib/i18n";
import { appUrl } from "@/lib/app-url";
import { getOrder } from "@/lib/orders";
import { submitStcPayOtp, TapError } from "@/lib/tap";

// STC Pay's second step: the code the customer got by SMS goes back on the
// charge. Whatever Tap answers, the result page then checks the charge the
// same way it checks a card, so nothing here marks the order paid.
export async function POST(request: Request, { params }: RouteContext<"/api/charges/[id]/otp">) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { orderId?: unknown; otp?: unknown; lang?: unknown } | null;
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
  const lang = typeof body?.lang === "string" && hasLocale(body.lang) ? body.lang : "ar";

  if (!/^\d{4,8}$/.test(otp)) return NextResponse.json({ error: "invalid_otp" }, { status: 400 });
  // Only the order's latest charge, and only while it is waiting for payment.
  const order = await getOrder(typeof body?.orderId === "string" ? body.orderId : "");
  if (!order || order.chargeId !== id || order.status !== "pending") {
    return NextResponse.json({ error: "no_order" }, { status: 404 });
  }

  try {
    const charge = await submitStcPayOtp(id, otp);
    console.info("[charges] otp sent for", id, charge.status);
  } catch (err) {
    console.error("[charges] otp failed", err instanceof TapError ? err.message : err);
    return NextResponse.json({ error: "otp_failed" }, { status: 400 });
  }
  const base = appUrl(request);
  return NextResponse.json({ url: `${base}/${lang}/checkout/result?tap_id=${encodeURIComponent(id)}` });
}
