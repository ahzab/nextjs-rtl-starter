import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sent: Array<[string, string]> = [];
let fails = false;
vi.mock("../lib/tap", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/tap")>();
  return {
    ...real,
    submitStcPayOtp: async (id: string, otp: string) => {
      if (fails) throw new real.TapError(400, "2001", "Tap 400: invalid otp");
      sent.push([id, otp]);
      return { id, status: "CAPTURED" };
    },
  };
});

const { POST } = await import("../app/api/charges/[id]/otp/route");
const { attachCharge, createOrder, markPaid } = await import("../lib/orders");

function send(id: string, body: Record<string, unknown>) {
  return POST(
    new Request(`http://localhost/api/charges/${id}/otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lang: "ar", ...body }),
    }),
    { params: Promise.resolve({ id }) },
  );
}

async function pendingOrder(chargeId: string) {
  const o = await createOrder({ description: "Test", amount: 1000, currency: "SAR" });
  await attachCharge(o.id, chargeId);
  return o;
}

beforeEach(() => {
  sent.length = 0;
  fails = false;
});

describe("POST /api/charges/[id]/otp", () => {
  it("sends the code on the order's charge and points to the result page", async () => {
    const o = await pendingOrder("chg_stc1");
    const res = await send("chg_stc1", { orderId: o.id, otp: "123456" });
    expect(await res.json()).toEqual({ url: "http://localhost/ar/checkout/result?tap_id=chg_stc1" });
    expect(sent).toEqual([["chg_stc1", "123456"]]);
  });

  it("refuses a code that isn't 4 to 8 digits", async () => {
    const o = await pendingOrder("chg_stc2");
    for (const otp of ["", "12", "12345a", "123456789"]) {
      expect((await send("chg_stc2", { orderId: o.id, otp })).status).toBe(400);
    }
    expect(sent).toHaveLength(0);
  });

  it("refuses a charge that isn't the order's latest, or an order already paid", async () => {
    const o = await pendingOrder("chg_stc3");
    expect((await send("chg_other", { orderId: o.id, otp: "123456" })).status).toBe(404);
    await markPaid(o.id, "chg_stc3");
    expect((await send("chg_stc3", { orderId: o.id, otp: "123456" })).status).toBe(404);
    expect(sent).toHaveLength(0);
  });

  it("reports a code Tap rejects", async () => {
    const o = await pendingOrder("chg_stc4");
    fails = true;
    const res = await send("chg_stc4", { orderId: o.id, otp: "000000" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "otp_failed" });
  });
});
