import "server-only";

// A thin client for the two Tap calls a checkout needs: create a charge and
// retrieve it. Reference: https://developers.tap.company/reference/charges

const API = "https://api.tap.company/v2";

// Tap's charge statuses. Only CAPTURED means the money was taken.
export type ChargeStatus =
  | "INITIATED"
  | "IN_PROGRESS"
  | "ABANDONED"
  | "CANCELLED"
  | "FAILED"
  | "DECLINED"
  | "RESTRICTED"
  | "CAPTURED"
  | "AUTHORIZED"
  | "VOID"
  | "TIMEDOUT"
  | "UNKNOWN";

export type Charge = {
  id: string;
  status: ChargeStatus;
  amount: number; // major units, e.g. 10.5
  currency: string;
  live_mode: boolean;
  reference?: { order?: string; transaction?: string; payment?: string; gateway?: string };
  response?: { code: string; message: string };
  transaction?: { url?: string };
  card?: { brand?: string; scheme?: string; last_four?: string; first_six?: string };
  source?: { payment_method?: string };
};

export type CreateCharge = {
  amount: number; // major units
  currency: string;
  description: string;
  orderId: string;
  customer: { first_name: string; email: string };
  // A card or Apple Pay token (tok_…), or a method's source: KNET is
  // { id: "src_kw.knet" }, STC Pay adds the customer's STC Pay number.
  source: { id: string; phone?: { country_code: string; number: string } };
  redirectUrl: string;
  postUrl: string;
  lang: string;
};

export class TapError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
  }

  // 1243: the method is valid but not turned on for this Tap account.
  get methodNotEnabled(): boolean {
    return this.code === "1243";
  }

  // Tap answers an unknown charge with 400, not 404: 1144 "Charge id not
  // found" for a well-formed id, 9997 "Provided id is invalid" for a malformed one.
  get notFound(): boolean {
    return this.status === 404 || this.code === "1144" || this.code === "9997";
  }
}

export function secretKey(): string {
  const key = process.env.TAP_SECRET_KEY;
  if (!key) throw new Error("TAP_SECRET_KEY is not set. Copy .env.example to .env.local.");
  return key;
}

export function isTestMode(): boolean {
  return !(process.env.TAP_SECRET_KEY ?? "").startsWith("sk_live_");
}

async function call<T>(path: string, init: RequestInit & { lang?: string } = {}): Promise<T> {
  const { lang, ...rest } = init;
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(lang ? { lang_code: lang } : {}),
      ...rest.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text();
    let code: string | undefined;
    try {
      code = JSON.parse(body)?.errors?.[0]?.code;
    } catch {
      code = undefined;
    }
    throw new TapError(res.status, code, `Tap ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export function createCharge(input: CreateCharge): Promise<Charge> {
  return call<Charge>("/charges", {
    method: "POST",
    lang: input.lang,
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      threeDSecure: true,
      save_card: false,
      customer_initiated: true,
      description: input.description,
      reference: { order: input.orderId },
      customer: input.customer,
      source: input.source,
      redirect: { url: input.redirectUrl },
      post: { url: input.postUrl },
    }),
  });
}

export function retrieveCharge(id: string): Promise<Charge> {
  return call<Charge>(`/charges/${encodeURIComponent(id)}`);
}

// STC Pay texts the customer a one-time code after the charge is created; the
// charge completes when the code is sent back on it.
// https://developers.tap.company/docs/stcpay
export function submitStcPayOtp(chargeId: string, otp: string): Promise<Charge> {
  return call<Charge>(`/charges/${encodeURIComponent(chargeId)}`, {
    method: "PUT",
    body: JSON.stringify({ gateway_response: { name: "STC_PAY", response: { reference: { otp } } } }),
  });
}
