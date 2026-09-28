import { createHmac } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Charge } from "../lib/tap";

// The route runs its work in after(). Collect the callbacks so each test can
// check the response went out first, then run the work itself.
const pending: Array<() => Promise<void> | void> = [];
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (fn: () => Promise<void> | void) => pending.push(fn),
}));
vi.mock("server-only", () => ({}));

// Tap's side: the charge the webhook reads back with the secret key.
const charges = new Map<string, Charge>();
const retrieveCharge = vi.fn(async (id: string) => {
  const charge = charges.get(id);
  if (!charge) throw new Error(`unexpected charge ${id}`);
  return charge;
});
vi.mock("../lib/tap", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/tap")>()),
  retrieveCharge: (id: string) => retrieveCharge(id),
}));

const { POST } = await import("../app/api/webhooks/tap/route");
const { attachCharge, createOrder, getOrder } = await import("../lib/orders");

const KEY = "sk_test_route";
process.env.TAP_SECRET_KEY = KEY;

function tapCharge(id: string, orderId: string, status: string, amount = 10.5): Charge {
  return {
    id,
    status: status as Charge["status"],
    amount,
    currency: "SAR",
    live_mode: false,
    reference: { order: orderId, gateway: "gw1", payment: "pay1" },
  };
}

function send(charge: Charge, hash?: string) {
  const body = { ...charge, transaction: { created: "1695987825425" } };
  const signed =
    `x_id${charge.id}x_amount${charge.amount.toFixed(2)}x_currency${charge.currency}` +
    `x_gateway_reference${charge.reference!.gateway}x_payment_reference${charge.reference!.payment}` +
    `x_status${charge.status}x_created1695987825425`;
  return POST(
    new Request("http://localhost/api/webhooks/tap", {
      method: "POST",
      headers: { "content-type": "application/json", hashstring: hash ?? createHmac("sha256", KEY).update(signed).digest("hex") },
      body: JSON.stringify(body),
    }),
  );
}

async function drain() {
  while (pending.length) await pending.shift()!();
}

async function order(chargeId: string) {
  const o = await createOrder({ description: "Test", amount: 1050, currency: "SAR" });
  await attachCharge(o.id, chargeId);
  return o;
}

beforeEach(() => {
  pending.length = 0;
  charges.clear();
  retrieveCharge.mockClear();
});

describe("POST /api/webhooks/tap", () => {
  it("rejects a bad hash with 403 and does no work", async () => {
    const o = await order("chg_bad");
    charges.set("chg_bad", tapCharge("chg_bad", o.id, "CAPTURED"));
    const res = await send(charges.get("chg_bad")!, "0".repeat(64));
    expect(res.status).toBe(403);
    expect(pending).toHaveLength(0);
    expect((await getOrder(o.id))!.status).toBe("pending");
  });

  it("rejects a body that isn't a charge with 400", async () => {
    const res = await POST(new Request("http://localhost/api/webhooks/tap", { method: "POST", body: "nope" }));
    expect(res.status).toBe(400);
  });

  it("answers 200 before touching Tap, then marks a captured order paid", async () => {
    const o = await order("chg_paid");
    charges.set("chg_paid", tapCharge("chg_paid", o.id, "CAPTURED"));
    const res = await send(charges.get("chg_paid")!);
    expect(res.status).toBe(200);
    expect(retrieveCharge).not.toHaveBeenCalled();
    await drain();
    expect(retrieveCharge).toHaveBeenCalledWith("chg_paid");
    expect((await getOrder(o.id))!.status).toBe("paid");
  });

  it("changes nothing when the same capture is posted twice", async () => {
    const o = await order("chg_twice");
    charges.set("chg_twice", tapCharge("chg_twice", o.id, "CAPTURED"));
    await send(charges.get("chg_twice")!);
    await drain();
    const first = { ...(await getOrder(o.id))! };
    await send(charges.get("chg_twice")!);
    await drain();
    expect(await getOrder(o.id)).toEqual(first);
  });

  it("doesn't mark paid when Tap's own record disagrees with the post", async () => {
    const o = await order("chg_short");
    charges.set("chg_short", tapCharge("chg_short", o.id, "CAPTURED", 1));
    await send(charges.get("chg_short")!);
    await drain();
    expect((await getOrder(o.id))!.status).toBe("pending");
  });

  for (const status of ["DECLINED", "FAILED", "CANCELLED"]) {
    it(`marks a pending order failed on ${status}`, async () => {
      const id = `chg_${status.toLowerCase()}`;
      const o = await order(id);
      charges.set(id, tapCharge(id, o.id, status));
      expect((await send(charges.get(id)!)).status).toBe(200);
      await drain();
      expect((await getOrder(o.id))!.status).toBe("failed");
    });
  }

  it("changes nothing when the same failure is posted twice", async () => {
    const o = await order("chg_fail2");
    charges.set("chg_fail2", tapCharge("chg_fail2", o.id, "DECLINED"));
    await send(charges.get("chg_fail2")!);
    await drain();
    const first = { ...(await getOrder(o.id))! };
    await send(charges.get("chg_fail2")!);
    await drain();
    expect(await getOrder(o.id)).toEqual(first);
  });

  it("never fails a paid order", async () => {
    const o = await order("chg_late");
    charges.set("chg_late", tapCharge("chg_late", o.id, "CAPTURED"));
    await send(charges.get("chg_late")!);
    await drain();
    charges.set("chg_late", tapCharge("chg_late", o.id, "DECLINED"));
    await send(charges.get("chg_late")!);
    await drain();
    expect((await getOrder(o.id))!.status).toBe("paid");
  });

  it("ignores a failure for an earlier charge once the customer retried", async () => {
    const o = await order("chg_first");
    await attachCharge(o.id, "chg_second");
    charges.set("chg_first", tapCharge("chg_first", o.id, "DECLINED"));
    await send(charges.get("chg_first")!);
    await drain();
    expect((await getOrder(o.id))!.status).toBe("pending");
  });

  it("lets a failed order be retried with a new charge", async () => {
    const o = await order("chg_retry1");
    charges.set("chg_retry1", tapCharge("chg_retry1", o.id, "DECLINED"));
    await send(charges.get("chg_retry1")!);
    await drain();
    expect((await getOrder(o.id))!.status).toBe("failed");
    await attachCharge(o.id, "chg_retry2");
    expect(await getOrder(o.id)).toMatchObject({ status: "pending", chargeId: "chg_retry2" });
  });

  it("trusts Tap's status over the post's", async () => {
    const o = await order("chg_liar");
    charges.set("chg_liar", tapCharge("chg_liar", o.id, "DECLINED"));
    // A correctly signed CAPTURED post, while Tap's record says DECLINED.
    await send({ ...charges.get("chg_liar")!, status: "CAPTURED" });
    await drain();
    expect((await getOrder(o.id))!.status).toBe("pending");
  });
});
