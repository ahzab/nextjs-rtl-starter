import "server-only";

import { getOrder, markFailed, markPaid, type Order } from "./orders";
import { retrieveCharge, TapError, type Charge } from "./tap";
import { checkCharge, type Rejection } from "./verify";
import { FAILED_STATUSES } from "./webhook";

export type Confirmation =
  | { ok: true; order: Order; charge: Charge }
  | { ok: false; reason: Rejection | "not_found"; charge?: Charge };

// The one place an order becomes "paid". The result page and the webhook
// both come through here, and neither trusts what it was sent: the charge
// is retrieved from Tap with the secret key and checked against the order it
// claims to pay for. Calling it twice for the same charge is safe.
export async function confirmCharge(chargeId: string): Promise<Confirmation> {
  let charge: Charge;
  try {
    charge = await retrieveCharge(chargeId);
  } catch (err) {
    if (err instanceof TapError && err.notFound) return { ok: false, reason: "not_found" };
    throw err;
  }

  const order = getOrder(charge.reference?.order);
  const rejection = checkCharge(charge, order);
  if (rejection || !order) return { ok: false, reason: rejection ?? "no_order", charge };

  return { ok: true, order: markPaid(order.id, charge.id)!, charge };
}

// The webhook's other half. A declined, failed or cancelled charge marks its
// order failed, but only once Tap confirms the status and only while it is
// still the order's latest charge. The customer can retry a failed order, and
// a second post for the same charge changes nothing.
export async function failCharge(chargeId: string): Promise<Order | null> {
  let charge: Charge;
  try {
    charge = await retrieveCharge(chargeId);
  } catch (err) {
    if (err instanceof TapError && err.notFound) return null;
    throw err;
  }
  const order = getOrder(charge.reference?.order);
  if (!order || !FAILED_STATUSES.has(charge.status)) return order;
  return markFailed(order.id, charge.id);
}
