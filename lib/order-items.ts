import type { Locale } from "@/lib/i18n";
import type { Order } from "@/lib/orders";
import { getProduct } from "@/lib/products";

// The receipt's rows for an order: one per product line ("Ajwa dates × 2"),
// or the order's description when it has no lines.
export function orderItems(order: Order, lang: Locale): { label: string; amount: number }[] {
  const lines = order.lines ?? [];
  if (lines.length === 0) return [{ label: order.description, amount: order.amount }];
  return lines.map((line) => {
    const name = getProduct(line.productId)?.name[lang] ?? line.productId;
    return { label: line.quantity > 1 ? `${name} × ${line.quantity}` : name, amount: line.unitAmount * line.quantity };
  });
}
