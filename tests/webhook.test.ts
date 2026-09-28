import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { FAILED_STATUSES, hashAmount, hashMatches } from "../lib/webhook";

const KEY = "sk_test_XKokBfNWv6FIYuTMg5sLPjhJ";

// A post shaped like Tap's, with the amount as the JSON number Tap sends.
function post(overrides: { amount: number; currency: string; status?: string }) {
  return {
    id: "chg_TS02A5720231433Qq1w0809257",
    object: "charge",
    amount: overrides.amount,
    currency: overrides.currency,
    status: overrides.status ?? "CAPTURED",
    reference: { gateway: "123456789", payment: "0409231433001234", order: "order-1" },
    transaction: { created: "1695987825425" },
  };
}

// Written out by hand from Tap's docs rather than through lib/webhook, so a
// bug in the code under test can't also be in the expected value.
function tapSigns(amountText: string, currency: string, status = "CAPTURED"): string {
  const input =
    "x_idchg_TS02A5720231433Qq1w0809257" +
    `x_amount${amountText}` +
    `x_currency${currency}` +
    "x_gateway_reference123456789" +
    "x_payment_reference0409231433001234" +
    `x_status${status}` +
    "x_created1695987825425";
  return createHmac("sha256", KEY).update(input).digest("hex");
}

describe("hashMatches", () => {
  it("verifies a SAR charge of 1.00", () => {
    expect(hashMatches(tapSigns("1.00", "SAR"), post({ amount: 1, currency: "SAR" }), KEY)).toBe(true);
  });

  it("verifies a KWD charge of 1.000", () => {
    expect(hashMatches(tapSigns("1.000", "KWD"), post({ amount: 1, currency: "KWD" }), KEY)).toBe(true);
  });

  it("verifies non-round amounts", () => {
    expect(hashMatches(tapSigns("49.50", "SAR"), post({ amount: 49.5, currency: "SAR" }), KEY)).toBe(true);
    expect(hashMatches(tapSigns("0.318", "KWD"), post({ amount: 0.318, currency: "KWD" }), KEY)).toBe(true);
  });

  it("rejects a changed amount", () => {
    expect(hashMatches(tapSigns("1.00", "SAR"), post({ amount: 2, currency: "SAR" }), KEY)).toBe(false);
    expect(hashMatches(tapSigns("1.000", "KWD"), post({ amount: 1.001, currency: "KWD" }), KEY)).toBe(false);
  });

  it("rejects a changed status", () => {
    expect(hashMatches(tapSigns("1.00", "SAR", "DECLINED"), post({ amount: 1, currency: "SAR" }), KEY)).toBe(false);
  });

  it("rejects a hash signed with another key", () => {
    const other = createHmac("sha256", "sk_test_other").update("x").digest("hex");
    expect(hashMatches(other, post({ amount: 1, currency: "SAR" }), KEY)).toBe(false);
  });

  it("accepts Tap's hash in upper case", () => {
    expect(hashMatches(tapSigns("1.00", "SAR").toUpperCase(), post({ amount: 1, currency: "SAR" }), KEY)).toBe(true);
  });

  it("rejects a missing header or key, and a short hash, without throwing", () => {
    const body = post({ amount: 1, currency: "SAR" });
    expect(hashMatches(null, body, KEY)).toBe(false);
    expect(hashMatches("", body, KEY)).toBe(false);
    expect(hashMatches("abc", body, KEY)).toBe(false);
    expect(hashMatches(tapSigns("1.00", "SAR"), body, undefined)).toBe(false);
  });
});

describe("hashAmount", () => {
  it("uses each currency's decimals", () => {
    expect(hashAmount(1, "SAR")).toBe("1.00");
    expect(hashAmount(1, "AED")).toBe("1.00");
    expect(hashAmount(1, "KWD")).toBe("1.000");
    expect(hashAmount(1, "BHD")).toBe("1.000");
    expect(hashAmount("10.5", "SAR")).toBe("10.50");
  });

  it("gives nothing for a missing amount rather than 0.00", () => {
    expect(hashAmount(undefined, "SAR")).toBe("");
    expect(hashAmount("", "SAR")).toBe("");
  });
});

describe("FAILED_STATUSES", () => {
  it("covers the final failures and not success or in-flight charges", () => {
    for (const s of ["DECLINED", "FAILED", "CANCELLED"]) expect(FAILED_STATUSES.has(s)).toBe(true);
    for (const s of ["CAPTURED", "INITIATED", "IN_PROGRESS", "AUTHORIZED"]) expect(FAILED_STATUSES.has(s)).toBe(false);
  });
});
