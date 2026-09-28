import { describe, expect, it } from "vitest";

import { enabledMethods, methodCurrency, saudiMobile, takesCurrency } from "../lib/methods";

describe("enabledMethods", () => {
  it("is empty with no flags", () => {
    expect(enabledMethods({})).toEqual([]);
  });

  it("turns on only the methods whose flag is exactly 1", () => {
    expect(enabledMethods({ applepay: "1", stcpay: "true", knet: "1" })).toEqual(["applepay", "knet"]);
    expect(enabledMethods({ applepay: "0", stcpay: "1" })).toEqual(["stcpay"]);
  });
});

describe("takesCurrency", () => {
  it("keeps KNET to dinars and STC Pay to riyals", () => {
    expect(takesCurrency("knet", "KWD")).toBe(true);
    expect(takesCurrency("knet", "SAR")).toBe(false);
    expect(takesCurrency("stcpay", "SAR")).toBe(true);
    expect(takesCurrency("stcpay", "KWD")).toBe(false);
    expect(methodCurrency("knet")).toBe("KWD");
  });

  it("lets Apple Pay take any currency the card field takes", () => {
    expect(takesCurrency("applepay", "SAR")).toBe(true);
    expect(takesCurrency("applepay", "KWD")).toBe(true);
    expect(methodCurrency("applepay")).toBeUndefined();
  });
});

describe("saudiMobile", () => {
  it("accepts the ways people write a Saudi mobile", () => {
    for (const input of ["0548220713", "548220713", "+966548220713", "00966548220713", "054 822 0713", "054-822-0713"]) {
      expect(saudiMobile(input)).toBe("548220713");
    }
  });

  it("rejects landlines, short numbers and other countries", () => {
    for (const input of ["", "0112345678", "05482207", "+96550000000", "abc548220713"]) {
      expect(saudiMobile(input)).toBeNull();
    }
  });
});
