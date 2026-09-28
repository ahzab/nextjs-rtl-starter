// Pure checks, kept apart from the network so they can be tested.

import { fromTapAmount } from "./money";

type ChargeLike = { id: string; status: string; amount: number; currency: string };
type OrderLike = { amount: number; currency: string; chargeId: string | null };

export type Rejection =
  | "no_order"
  | "not_captured"
  | "currency_mismatch"
  | "amount_mismatch"
  | "charge_mismatch";

// The order is looked up by the charge's `reference.order`. A charge only pays
// for an order if every one of these holds. Amounts are compared in minor units
// so 10 and 10.00 are equal and 10.001 is not.
export function checkCharge(charge: ChargeLike, order: OrderLike | null): Rejection | null {
  if (!order) return "no_order";
  if (order.chargeId !== charge.id) return "charge_mismatch";
  if (charge.status !== "CAPTURED") return "not_captured";
  if (charge.currency !== order.currency) return "currency_mismatch";
  if (fromTapAmount(charge.amount, charge.currency) !== order.amount) return "amount_mismatch";
  return null;
}
