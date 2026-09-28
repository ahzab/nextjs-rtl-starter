import { describe, expect, it } from "vitest";

import { FAILED_EVENTS, modeMatches, secretMatches } from "../lib/webhook";

describe("secretMatches", () => {
  it("accepts the exact secret", () => {
    expect(secretMatches("s3cret-token", "s3cret-token")).toBe(true);
  });

  it("rejects a wrong secret of the same length", () => {
    expect(secretMatches("s3cret-tokex", "s3cret-token")).toBe(false);
  });

  it("rejects a length mismatch without throwing", () => {
    expect(secretMatches("short", "s3cret-token")).toBe(false);
    expect(secretMatches("s3cret-token-longer", "s3cret-token")).toBe(false);
  });

  it("rejects a missing or non-string secret", () => {
    expect(secretMatches(undefined, "s3cret-token")).toBe(false);
    expect(secretMatches(123, "s3cret-token")).toBe(false);
    expect(secretMatches("s3cret-token", undefined)).toBe(false);
    expect(secretMatches("", "")).toBe(false);
  });
});

describe("modeMatches", () => {
  it("matches a test event to a test key and a live event to a live key", () => {
    expect(modeMatches(false, "sk_test_abc")).toBe(true);
    expect(modeMatches(true, "sk_live_abc")).toBe(true);
  });

  it("rejects crossed modes", () => {
    expect(modeMatches(true, "sk_test_abc")).toBe(false);
    expect(modeMatches(false, "sk_live_abc")).toBe(false);
  });

  it("rejects a missing flag or key", () => {
    expect(modeMatches(undefined, "sk_test_abc")).toBe(false);
    expect(modeMatches("false", "sk_test_abc")).toBe(false);
    expect(modeMatches(false, undefined)).toBe(false);
  });
});

describe("FAILED_EVENTS", () => {
  it("accepts both spellings", () => {
    expect(FAILED_EVENTS.has("payment_faild")).toBe(true);
    expect(FAILED_EVENTS.has("payment_failed")).toBe(true);
  });
});
