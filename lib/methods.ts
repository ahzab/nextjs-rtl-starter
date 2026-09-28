// Payment methods beyond the card field, each off until its flag is "1".
// Every one of them needs setup outside this code (see the README), so they
// start switched off rather than failing in front of a customer.

export type Method = "applepay" | "stcpay" | "knet";

export const METHODS: Method[] = ["applepay", "stcpay", "knet"];

// Next.js inlines NEXT_PUBLIC_ variables only when they are spelled out in
// full, so each flag is read by name rather than through a lookup.
export function enabledMethods(
  flags: Partial<Record<Method, string | undefined>> = {
    applepay: process.env.NEXT_PUBLIC_TAP_APPLE_PAY,
    stcpay: process.env.NEXT_PUBLIC_TAP_STC_PAY,
    knet: process.env.NEXT_PUBLIC_TAP_KNET,
  },
): Method[] {
  return METHODS.filter((m) => flags[m] === "1");
}

// The currencies Tap takes for each method (developers.tap.company, read
// 2026-09-28). Apple Pay takes whatever the card field takes.
const CURRENCIES: Partial<Record<Method, string[]>> = {
  stcpay: ["SAR"],
  knet: ["KWD"],
};

export function takesCurrency(method: Method, currency: string): boolean {
  return CURRENCIES[method]?.includes(currency) ?? true;
}

export function methodCurrency(method: Method): string | undefined {
  return CURRENCIES[method]?.[0];
}

// Tap's source id for the methods our server charges directly. Apple Pay
// isn't here: its button returns a token, charged like a card.
export const SOURCE_IDS = { stcpay: "src_sa.stcpay", knet: "src_kw.knet" } as const;

// A Saudi mobile number as STC Pay wants it: 9 digits starting with 5, with
// the country code sent apart. Accepts 05…, 5…, +9665… and 009665….
export function saudiMobile(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "").replace(/^(\+966|00966|966|0)/, "");
  return /^5\d{8}$/.test(digits) ? digits : null;
}
