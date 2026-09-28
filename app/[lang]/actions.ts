"use server";

import { redirect } from "next/navigation";

import { getDictionary, hasLocale } from "@/lib/i18n";
import { toMinor } from "@/lib/money";
import { createOrder } from "@/lib/orders";
import { SAMPLE_ORDER } from "@/lib/sample-order";

// Pay now: the order (and its amount) is created on the server, then the
// customer moves to the checkout page for it.
export async function startCheckout(lang: string) {
  const locale = hasLocale(lang) ? lang : "ar";
  const order = await createOrder({
    description: getDictionary(locale).home.product,
    amount: toMinor(SAMPLE_ORDER.amount, SAMPLE_ORDER.currency),
    currency: SAMPLE_ORDER.currency,
  });
  redirect(`/${locale}/checkout/${order.id}`);
}
