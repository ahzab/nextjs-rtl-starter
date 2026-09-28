import { describe, expect, it } from "vitest";

import { checkCharge } from "../lib/verify";

// Orders hold minor units; Tap reports major units.
const order = { amount: 1000, currency: "SAR", chargeId: "chg_1" };
const captured = { id: "chg_1", status: "CAPTURED", amount: 10, currency: "SAR" };

describe("checkCharge", () => {
  it("accepts a captured charge that matches the order", () => {
    expect(checkCharge(captured, order)).toBeNull();
  });

  it("treats 10 and 10.00 as the same amount", () => {
    expect(checkCharge({ ...captured, amount: 10.0 }, order)).toBeNull();
  });

  it("matches three-decimal KWD", () => {
    const kwd = { amount: 1250, currency: "KWD", chargeId: "chg_1" };
    expect(checkCharge({ ...captured, amount: 1.25, currency: "KWD" }, kwd)).toBeNull();
    expect(checkCharge({ ...captured, amount: 1.251, currency: "KWD" }, kwd)).toBe("amount_mismatch");
  });

  it("rejects when there is no order", () => {
    expect(checkCharge(captured, null)).toBe("no_order");
  });

  it("rejects a charge that isn't the one recorded on the order", () => {
    expect(checkCharge({ ...captured, id: "chg_other" }, order)).toBe("charge_mismatch");
    expect(checkCharge(captured, { ...order, chargeId: null })).toBe("charge_mismatch");
  });

  it("rejects anything but CAPTURED", () => {
    for (const status of ["INITIATED", "AUTHORIZED", "DECLINED", "FAILED", "CANCELLED", "ABANDONED"]) {
      expect(checkCharge({ ...captured, status }, order)).toBe("not_captured");
    }
  });

  it("rejects a currency mismatch", () => {
    expect(checkCharge({ ...captured, currency: "KWD" }, order)).toBe("currency_mismatch");
  });

  it("rejects an amount mismatch, including a minor-unit amount sent by mistake", () => {
    expect(checkCharge({ ...captured, amount: 9.99 }, order)).toBe("amount_mismatch");
    expect(checkCharge({ ...captured, amount: 1000 }, order)).toBe("amount_mismatch");
  });
});
