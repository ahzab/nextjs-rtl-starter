import { timingSafeEqual } from "node:crypto";

// Moyasar puts the secret you set in the dashboard inside the webhook body as
// `secret_token`. Compare it in constant time so response timing leaks nothing.
export function secretMatches(received: unknown, expected: string | undefined): boolean {
  if (typeof received !== "string" || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// A live event reaching a server that holds a test key (or the other way
// round) is a misconfigured webhook, not a payment to act on.
export function modeMatches(live: unknown, secretKey: string | undefined): boolean {
  if (typeof live !== "boolean" || !secretKey) return false;
  return live === secretKey.startsWith("sk_live_");
}

// Moyasar spells the failure event `payment_faild`. Accept both spellings so a
// future fix on their side doesn't silently drop failures here.
export const FAILED_EVENTS = new Set(["payment_faild", "payment_failed"]);
