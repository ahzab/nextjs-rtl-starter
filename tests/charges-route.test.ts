import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateCharge } from "../lib/tap";

vi.mock("server-only", () => ({}));

// Tap's side: record what our server asked for, answer with a scripted charge.
const created: CreateCharge[] = [];
let answer: () => unknown = () => ({ id: "chg_1", status: "INITIATED", transaction: { url: "https://tap.example/pay" } });
vi.mock("../lib/tap", async (importOriginal) => {
  const real = await importOriginal<typeof import("../lib/tap")>();
  return {
    ...real,
    createCharge: async (input: CreateCharge) => {
      created.push(input);
      return answer();
    },
  };
});

const { POST } = await import("../app/api/charges/route");
const { TapError } = await import("../lib/tap");
const { createOrder, getOrder } = await import("../lib/orders");

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/charges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lang: "en", ...body }),
    }),
  );
}

const order = (currency = "SAR") => createOrder({ description: "Test", amount: currency === "KWD" ? 10000 : 1000, currency });

beforeEach(() => {
  created.length = 0;
  answer = () => ({ id: "chg_1", status: "INITIATED", transaction: { url: "https://tap.example/pay" } });
  vi.stubEnv("NEXT_PUBLIC_TAP_APPLE_PAY", "1");
  vi.stubEnv("NEXT_PUBLIC_TAP_STC_PAY", "1");
  vi.stubEnv("NEXT_PUBLIC_TAP_KNET", "1");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/charges", () => {
  it("still charges a card token", async () => {
    const res = await post({ orderId: (await order()).id, token: "tok_abc" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://tap.example/pay" });
    expect(created[0].source).toEqual({ id: "tok_abc" });
  });

  it("charges an Apple Pay token like a card, only with the flag on", async () => {
    expect((await post({ orderId: (await order()).id, method: "applepay", token: "tok_ap" })).status).toBe(200);
    expect(created[0].source).toEqual({ id: "tok_ap" });
    vi.stubEnv("NEXT_PUBLIC_TAP_APPLE_PAY", "");
    const res = await post({ orderId: (await order()).id, method: "applepay", token: "tok_ap" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "method_off" });
  });

  it("sends KNET as Tap's KNET source on a KWD order and redirects to Tap's page", async () => {
    const o = await order("KWD");
    const res = await post({ orderId: o.id, method: "knet" });
    expect(await res.json()).toEqual({ url: "https://tap.example/pay" });
    expect(created[0]).toMatchObject({ source: { id: "src_kw.knet" }, amount: 10, currency: "KWD" });
    expect((await getOrder(o.id))!.chargeId).toBe("chg_1");
  });

  it("refuses KNET on a SAR order before calling Tap", async () => {
    const res = await post({ orderId: (await order("SAR")).id, method: "knet" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "wrong_currency" });
    expect(created).toHaveLength(0);
  });

  it("refuses a method whose flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_TAP_KNET", "0");
    const res = await post({ orderId: (await order("KWD")).id, method: "knet" });
    expect(await res.json()).toEqual({ error: "method_off" });
    expect(created).toHaveLength(0);
  });

  it("refuses a method it doesn't know", async () => {
    const res = await post({ orderId: (await order()).id, method: "bitcoin" });
    expect(await res.json()).toEqual({ error: "invalid_method" });
  });

  it("sends STC Pay with the number split from its country code and asks for the code", async () => {
    answer = () => ({ id: "chg_stc", status: "INITIATED" });
    const res = await post({ orderId: (await order()).id, method: "stcpay", phone: "0548220713" });
    expect(await res.json()).toEqual({ otp: true, chargeId: "chg_stc" });
    expect(created[0].source).toEqual({ id: "src_sa.stcpay", phone: { country_code: "966", number: "548220713" } });
  });

  it("follows Tap's page for STC Pay when Tap returns one", async () => {
    const res = await post({ orderId: (await order()).id, method: "stcpay", phone: "548220713" });
    expect(await res.json()).toEqual({ url: "https://tap.example/pay" });
  });

  it("refuses an STC Pay number that isn't a Saudi mobile", async () => {
    const res = await post({ orderId: (await order()).id, method: "stcpay", phone: "0112345678" });
    expect(await res.json()).toEqual({ error: "invalid_phone" });
    expect(created).toHaveLength(0);
  });

  it("says when Tap hasn't turned the method on for this account (1243)", async () => {
    answer = () => {
      throw new TapError(400, "1243", "Tap 400: Requested payment method not enabled");
    };
    const res = await post({ orderId: (await order()).id, method: "stcpay", phone: "0548220713" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "method_not_enabled" });
  });

  it("keeps other Tap failures generic", async () => {
    answer = () => {
      throw new TapError(500, undefined, "Tap 500");
    };
    const res = await post({ orderId: (await order()).id, token: "tok_abc" });
    expect(res.status).toBe(502);
  });
});
