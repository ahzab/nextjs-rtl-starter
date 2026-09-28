import { afterEach, describe, expect, it, vi } from "vitest";

import { apiPath, appUrl } from "../lib/app-url";
import { attachCharge, createOrder, getOrder, markPaid } from "../lib/orders";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// A stand-in for Upstash's REST API: one POST per command, JSON array body.
function fakeRedis() {
  const data = new Map<string, string>();
  const calls: unknown[][] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const args = JSON.parse(String(init.body)) as string[];
      calls.push(args);
      const [cmd, key, value] = args;
      if (cmd === "SET") data.set(key, value);
      const result = cmd === "GET" ? (data.get(key) ?? null) : "OK";
      return new Response(JSON.stringify({ result }), { status: 200 });
    }),
  );
  return { data, calls };
}

describe("order store on Redis", () => {
  it("keeps an order across calls, with a one-day expiry", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    const { data, calls } = fakeRedis();

    const o = await createOrder({ description: "Test", amount: 1000, currency: "SAR" });
    await attachCharge(o.id, "chg_1");
    await markPaid(o.id, "chg_1");

    expect(await getOrder(o.id)).toMatchObject({ status: "paid", chargeId: "chg_1" });
    expect(data.has(`order:${o.id}`)).toBe(true);
    expect(calls.find((c) => c[0] === "SET")).toEqual(expect.arrayContaining(["EX", 86400]));
  });

  it("accepts Vercel's KV_REST_API_ names too", async () => {
    vi.stubEnv("KV_REST_API_URL", "https://redis.example");
    vi.stubEnv("KV_REST_API_TOKEN", "t");
    const { calls } = fakeRedis();
    await createOrder({ description: "Test", amount: 1000, currency: "SAR" });
    expect(calls).toHaveLength(1);
  });

  it("fails loudly when Redis refuses, rather than losing the order", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 401 })));
    await expect(createOrder({ description: "Test", amount: 1000, currency: "SAR" })).rejects.toThrow("401");
  });
});

describe("path prefix", () => {
  it("leaves paths alone when there is no prefix", () => {
    expect(apiPath("/api/charges")).toBe("/api/charges");
    expect(appUrl(new Request("http://localhost:3000/api/charges"))).toBe("http://localhost:3000");
  });

  it("prefers APP_URL, which carries its own prefix", () => {
    vi.stubEnv("APP_URL", "https://example.com/demo/");
    expect(appUrl(new Request("https://internal.vercel.app/demo/api/charges"))).toBe("https://example.com/demo");
  });
});
