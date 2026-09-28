import { NextResponse } from "next/server";

import { hasLocale } from "@/lib/i18n";
import { enabledMethods, saudiMobile, SOURCE_IDS, takesCurrency } from "@/lib/methods";
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

type Source = { id: string; phone?: { country_code: string; number: string } };

// What the browser may send: a token from the card field or the Apple Pay
// button, or the name of a method our server charges directly.
function sourceFor(body: Record<string, unknown> | null, currency: string): Source | { error: string } {
  const method = body?.method ?? "card";
  if (method === "card" || method === "applepay") {
    if (method === "applepay" && !enabledMethods().includes("applepay")) return { error: "method_off" };
    const token = typeof body?.token === "string" ? body.token : "";
    return token.startsWith("tok_") ? { id: token } : { error: "invalid_token" };
  }
  if (method !== "knet" && method !== "stcpay") return { error: "invalid_method" };
  if (!enabledMethods().includes(method)) return { error: "method_off" };
  if (!takesCurrency(method, currency)) return { error: "wrong_currency" };
  if (method === "knet") return { id: SOURCE_IDS.knet };
  const number = saudiMobile(typeof body?.phone === "string" ? body.phone : "");
  if (!number) return { error: "invalid_phone" };
  return { id: SOURCE_IDS.stcpay, phone: { country_code: "966", number } };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const lang = typeof body?.lang === "string" && hasLocale(body.lang) ? body.lang : "ar";

  // The amount always comes from the order on the server, never from the browser.
  const order = getOrder(orderId);
  if (!order) return NextResponse.json({ error: "no_order" }, { status: 404 });
  if (!canPay(order)) return NextResponse.json({ error: "not_pending" }, { status: 409 });

  const source = sourceFor(body, order.currency);
  if ("error" in source) return NextResponse.json(source, { status: 400 });

  const base = baseUrl(request);
  const resultUrl = (id: string) => `${base}/${lang}/checkout/result?tap_id=${encodeURIComponent(id)}`;
  try {
    const charge = await createCharge({
      amount: toTapAmount(order.amount, order.currency),
      currency: order.currency,
      description: order.description,
      orderId: order.id,
      customer: SAMPLE_CUSTOMER,
      source,
      redirectUrl: `${base}/${lang}/checkout/result`,
      postUrl: `${base}/api/webhooks/tap`,
      lang,
    });
    attachCharge(order.id, charge.id);
    console.info("[charges] created", charge.id, "for order", order.id, source.id, charge.status);
    // STC Pay texts a code instead of opening a page: the browser asks for it
    // and sends it to /api/charges/<id>/otp. Tap's docs don't say which of the
    // two waiting statuses it uses here, so either counts.
    if (source.id === SOURCE_IDS.stcpay && !charge.transaction?.url && ["INITIATED", "IN_PROGRESS"].includes(charge.status)) {
      return NextResponse.json({ otp: true, chargeId: charge.id });
    }
    // Cards (3-D Secure) and KNET return a page to send the customer to. If a
    // charge ever completes without one, go straight to the result page.
    return NextResponse.json({ url: charge.transaction?.url ?? resultUrl(charge.id) });
  } catch (err) {
    console.error("[charges] create failed", err instanceof TapError ? err.message : err);
    if (err instanceof TapError && err.methodNotEnabled) {
      return NextResponse.json({ error: "method_not_enabled" }, { status: 409 });
    }
    return NextResponse.json({ error: "tap_error" }, { status: 502 });
  }
}
