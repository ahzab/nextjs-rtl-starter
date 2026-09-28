import "server-only";

const API = "https://api.moyasar.com/v1";

export type PaymentStatus =
  | "initiated"
  | "paid"
  | "authorized"
  | "failed"
  | "refunded"
  | "captured"
  | "voided"
  | "verified";

export type Payment = {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  refunded: number;
  description: string | null;
  metadata: Record<string, string> | null;
  source: { type: string; company?: string; message?: string };
  created_at: string;
};

export class MoyasarError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function authHeader(): string {
  const key = process.env.MOYASAR_SECRET_KEY;
  if (!key) throw new Error("MOYASAR_SECRET_KEY is not set");
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new MoyasarError(res.status, `Moyasar ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export function fetchPayment(id: string): Promise<Payment> {
  return call<Payment>(`/payments/${encodeURIComponent(id)}`);
}

// Omit `amount` for a full refund. Partial refunds take minor units.
export function refundPayment(id: string, amount?: number): Promise<Payment> {
  return call<Payment>(`/payments/${encodeURIComponent(id)}/refund`, {
    method: "POST",
    body: JSON.stringify(amount === undefined ? {} : { amount }),
  });
}
