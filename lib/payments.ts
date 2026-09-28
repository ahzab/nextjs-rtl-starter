import "server-only";

import { fetchPayment, MoyasarError, type Payment } from "./moyasar";
import { getOrder, markPaid, type Order } from "./orders";
import { checkPayment, type Rejection } from "./verify";

export type Confirmation =
  | { ok: true; order: Order; payment: Payment }
  | { ok: false; reason: Rejection | "not_found"; payment?: Payment };

// The one place a payment becomes "paid" in this app. The redirect page, the
// verify API and the webhook all come through here, and none of them trusts
// what the browser said: the payment is fetched from Moyasar with the secret
// key and checked against the order it claims to pay for.
export async function confirmPayment(paymentId: string): Promise<Confirmation> {
  let payment: Payment;
  try {
    payment = await fetchPayment(paymentId);
  } catch (err) {
    if (err instanceof MoyasarError && err.status === 404) return { ok: false, reason: "not_found" };
    throw err;
  }

  const order = getOrder(payment.metadata?.order_id);
  const rejection = checkPayment(payment, order);
  if (rejection || !order) return { ok: false, reason: rejection ?? "no_order", payment };

  return { ok: true, order: markPaid(order.id, payment.id)!, payment };
}
