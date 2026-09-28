import { describe, expect, it } from "vitest";

import { checkPayment } from "../lib/verify";

const order = { amount: 1000, currency: "SAR" };
const paid = { status: "paid", amount: 1000, currency: "SAR" };

describe("checkPayment", () => {
  it("accepts a paid payment that matches the order", () => {
    expect(checkPayment(paid, order)).toBeNull();
  });

  it("accepts a captured payment", () => {
    expect(checkPayment({ ...paid, status: "captured" }, order)).toBeNull();
  });

  it("rejects when there is no order", () => {
    expect(checkPayment(paid, null)).toBe("no_order");
  });

  it("rejects a payment that isn't paid", () => {
    expect(checkPayment({ ...paid, status: "failed" }, order)).toBe("not_paid");
    expect(checkPayment({ ...paid, status: "initiated" }, order)).toBe("not_paid");
  });

  it("rejects a currency mismatch", () => {
    expect(checkPayment({ ...paid, currency: "KWD" }, order)).toBe("currency_mismatch");
  });

  it("rejects an amount mismatch", () => {
    expect(checkPayment({ ...paid, amount: 999 }, order)).toBe("amount_mismatch");
  });

  it("checks status before amount, so an unpaid wrong amount reads as not paid", () => {
    expect(checkPayment({ status: "failed", amount: 1, currency: "SAR" }, order)).toBe("not_paid");
  });
});
