import { describe, expect, it } from "vitest";

import { formatMinor, fromMinor, minorDigits, toMinor } from "../lib/money";

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
