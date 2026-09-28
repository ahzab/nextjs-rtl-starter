import { describe, expect, it } from "vitest";

import { formatMinor, fromMinor, fromTapAmount, minorDigits, toMinor, toTapAmount } from "../lib/money";

describe("minorDigits", () => {
  it("knows each currency's minor unit", () => {
    expect(minorDigits("SAR")).toBe(2);
    expect(minorDigits("KWD")).toBe(3);
    expect(minorDigits("JPY")).toBe(0);
  });
});

describe("toMinor / fromMinor", () => {
  it("converts SAR to halalas", () => {
    expect(toMinor(10, "SAR")).toBe(1000);
    expect(fromMinor(1000, "SAR")).toBe(10);
  });

  it("converts KWD to fils", () => {
    expect(toMinor(10, "KWD")).toBe(10000);
    expect(fromMinor(1250, "KWD")).toBe(1.25);
  });

  it("leaves JPY alone", () => {
    expect(toMinor(1000, "JPY")).toBe(1000);
    expect(fromMinor(1000, "JPY")).toBe(1000);
  });

  it("rounds away float noise", () => {
    expect(toMinor(19.99, "SAR")).toBe(1999);
    expect(toMinor(0.1 + 0.2, "SAR")).toBe(30);
  });
});

describe("formatMinor", () => {
  it("uses Western digits in Arabic", () => {
    const out = formatMinor(100000, "SAR", "ar");
    expect(out).toMatch(/1,000\.00|1٬000\.00/);
    expect(out).not.toMatch(/[٠-٩]/);
  });

  it("shows three decimals for KWD", () => {
    expect(formatMinor(1250, "KWD", "en")).toContain("1.250");
  });
});

describe("toTapAmount / fromTapAmount", () => {
  it("sends Tap major units", () => {
    expect(toTapAmount(1000, "SAR")).toBe(10);
    expect(toTapAmount(4950, "SAR")).toBe(49.5);
    expect(toTapAmount(1250, "KWD")).toBe(1.25);
    expect(toTapAmount(1000, "JPY")).toBe(1000);
  });

  it("reads Tap amounts back into minor units", () => {
    expect(fromTapAmount(49.5, "SAR")).toBe(4950);
    expect(fromTapAmount(0.318, "KWD")).toBe(318);
    expect(fromTapAmount(1000, "JPY")).toBe(1000);
  });

  it("round-trips without float drift", () => {
    for (const minor of [1, 99, 1999, 30, 123456]) {
      expect(fromTapAmount(toTapAmount(minor, "SAR"), "SAR")).toBe(minor);
      expect(fromTapAmount(toTapAmount(minor, "KWD"), "KWD")).toBe(minor);
    }
  });
});

describe("formatMinor symbols", () => {
  it("writes ر.س without Intl's closing dot", () => {
    const out = formatMinor(1000, "SAR", "ar");
    expect(out).toContain("10.00");
    expect(out).toContain("ر.س");
    expect(out).not.toContain("ر.س.");
  });

  it("writes SAR first in English", () => {
    expect(formatMinor(1000, "SAR", "en")).toMatch(/^SAR\s10\.00$/);
  });
});
