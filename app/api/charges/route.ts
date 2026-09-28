import { NextResponse } from "next/server";

import { hasLocale } from "@/lib/i18n";
import { toTapAmount } from "@/lib/money";
import { attachCharge, canPay, getOrder } from "@/lib/orders";
import { createCharge, TapError } from "@/lib/tap";

// Sample customer for the demo. A real app passes the signed-in customer; Tap
// needs a first name plus an email or phone on every charge.
const SAMPLE_CUSTOMER = { first_name: "Saja", email: "saja@example.com" };

// Where Tap sends the customer back and posts the webhook. APP_URL overrides
// the request's own origin, which is what you want behind a tunnel (t8).
function baseUrl(request: Request): string {
  return (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { orderId?: unknown; token?: unknown; lang?: unknown } | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const token = typeof body?.token === "string" ? body.token : "";
  const lang = typeof body?.lang === "string" && hasLocale(body.lang) ? body.lang : "ar";

  if (!token.startsWith("tok_")) return NextResponse.json({ error: "invalid_token" }, { status: 400 });

  // The amount always comes from the order on the server, never from the browser.
  const order = getOrder(orderId);
  if (!order) return NextResponse.json({ error: "no_order" }, { status: 404 });
  if (!canPay(order)) return NextResponse.json({ error: "not_pending" }, { status: 409 });

  const base = baseUrl(request);
  try {
    const charge = await createCharge({
      amount: toTapAmount(order.amount, order.currency),
      currency: order.currency,
      description: order.description,
      orderId: order.id,
      customer: SAMPLE_CUSTOMER,
      token,
      redirectUrl: `${base}/${lang}/checkout/result`,
      postUrl: `${base}/api/webhooks/tap`,
      lang,
    });
    attachCharge(order.id, charge.id);
    console.info("[charges] created", charge.id, "for order", order.id, charge.status);
    // With 3-D Secure on, Tap returns a page to send the customer to. If a
    // charge ever completes without one, go straight to the result page.
    const url = charge.transaction?.url ?? `${base}/${lang}/checkout/result?tap_id=${encodeURIComponent(charge.id)}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[charges] create failed", err instanceof TapError ? err.message : err);
    return NextResponse.json({ error: "tap_error" }, { status: 502 });
  }
}
