import { createHmac, timingSafeEqual } from "node:crypto";

import { minorDigits } from "./money";

// Tap signs every webhook post with a `hashstring` header: HMAC-SHA256, keyed
// with your secret key, over seven fields of the charge in a fixed order.
// Reference: https://developers.tap.company/docs/webhook

type Posted = {
  id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  reference?: { gateway?: unknown; payment?: unknown } | null;
  transaction?: { created?: unknown } | null;
};

const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

// The amount is written with the currency's own decimals: "1.00" for SAR,
// "1.000" for KWD. Hashing the number as the JSON gives it ("1") fails every
// real post, so this is the line to get right.
export function hashAmount(amount: unknown, currency: string): string {
  const value = typeof amount === "number" ? amount : Number(text(amount));
  return text(amount) !== "" && Number.isFinite(value) ? value.toFixed(minorDigits(currency)) : "";
}

export function hashInput(body: Posted): string {
  const currency = text(body.currency);
  return (
    `x_id${text(body.id)}` +
    `x_amount${currency ? hashAmount(body.amount, currency) : ""}` +
    `x_currency${currency}` +
    `x_gateway_reference${text(body.reference?.gateway)}` +
    `x_payment_reference${text(body.reference?.payment)}` +
    `x_status${text(body.status)}` +
    `x_created${text(body.transaction?.created)}`
  );
}

export function computeHash(body: Posted, secretKey: string): string {
  return createHmac("sha256", secretKey).update(hashInput(body)).digest("hex");
}

// Compared in constant time so response timing says nothing about how much of
// a forged hash was right.
export function hashMatches(received: string | null, body: Posted, secretKey: string | undefined): boolean {
  if (!received || !secretKey) return false;
  const a = Buffer.from(received.trim().toLowerCase());
  const b = Buffer.from(computeHash(body, secretKey));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Tap only posts final charges: CAPTURED or one of these. INITIATED and
// ABANDONED are never posted, but an abandoned charge is a failed one too.
export const FAILED_STATUSES = new Set([
  "ABANDONED",
  "CANCELLED",
  "DECLINED",
  "FAILED",
  "RESTRICTED",
  "TIMEDOUT",
  "VOID",
]);
