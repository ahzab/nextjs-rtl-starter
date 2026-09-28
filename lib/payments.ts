import "server-only";

import { getOrder, markPaid, type Order } from "./orders";
import { retrieveCharge, TapError, type Charge } from "./tap";
import { checkCharge, type Rejection } from "./verify";

export type Confirmation =
  | { ok: true; order: Order; charge: Charge }
  | { ok: false; reason: Rejection | "not_found"; charge?: Charge };

// The one place an order becomes "paid". The result page (and the webhook, t5)
// both come through here, and neither trusts what the browser said: the charge
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
