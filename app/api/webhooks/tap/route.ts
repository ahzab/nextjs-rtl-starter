import { after, NextResponse } from "next/server";

import { confirmCharge, failCharge } from "@/lib/payments";
import { FAILED_STATUSES, hashMatches } from "@/lib/webhook";

// Tap posts here when a charge settles, including the ones whose customer
// closed the tab before the redirect. Tap can't reach localhost: test through
// a tunnel with APP_URL set (t8).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.id !== "string" || !body.id.startsWith("chg_")) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!hashMatches(request.headers.get("hashstring"), body, process.env.TAP_SECRET_KEY)) {
    console.warn(
      "[webhook]",
      body.id,
      process.env.TAP_SECRET_KEY ? "hashstring mismatch" : "TAP_SECRET_KEY is not set, so no post can verify",
    );
    return NextResponse.json({ error: "invalid_hash" }, { status: 403 });
  }

  // Answer first, work after: Tap retries twice and then marks the post
  // ERROR, so a slow call to Tap here must not look like a dead endpoint.
  // Only the charge id is taken from the body. The hash doesn't cover
  // `reference.order`, so both paths read the charge back from Tap.
  const chargeId = body.id;
  const status = typeof body.status === "string" ? body.status : "";
  after(async () => {
    try {
      if (status === "CAPTURED") {
        const result = await confirmCharge(chargeId);
        console.info("[webhook]", chargeId, result.ok ? "paid" : `rejected: ${result.reason}`);
      } else if (FAILED_STATUSES.has(status)) {
        const order = await failCharge(chargeId);
        console.info("[webhook]", chargeId, status, order ? `order ${order.id} ${order.status}` : "no order");
      } else {
        console.info("[webhook]", chargeId, "ignored status", status);
      }
    } catch (err) {
      console.error("[webhook]", chargeId, "failed", err instanceof Error ? err.message : err);
    }
  });

  return NextResponse.json({ received: true });
}
