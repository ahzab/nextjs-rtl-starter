// Pure checks, kept apart from the network so they can be tested.

type PaymentLike = { status: string; amount: number; currency: string };
type OrderLike = { amount: number; currency: string };

export type Rejection = "no_order" | "not_paid" | "amount_mismatch" | "currency_mismatch";

// `captured` is what a manual-capture payment becomes once collected.
const PAID = new Set(["paid", "captured"]);

export function checkPayment(payment: PaymentLike, order: OrderLike | null): Rejection | null {
  if (!order) return "no_order";
  if (!PAID.has(payment.status)) return "not_paid";
  if (payment.currency !== order.currency) return "currency_mismatch";
  if (payment.amount !== order.amount) return "amount_mismatch";
  return null;
}
