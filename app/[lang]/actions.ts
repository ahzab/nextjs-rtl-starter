"use server";

import { redirect } from "next/navigation";

import { addToCart, cartLines, linesTotal, withQuantity, type Cart } from "@/lib/cart";
import { readCart, writeCart } from "@/lib/cart-cookie";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { createOrder } from "@/lib/orders";
import { getProduct, STORE_CURRENCY } from "@/lib/products";

const localeOf = (lang: string): Locale => (hasLocale(lang) ? lang : "ar");

const quantityFrom = (form: FormData | undefined) => {
  const n = Number(form?.get("quantity") ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

// The order and its amount are always built here, from the catalogue's prices:
// the browser only ever sends product ids and quantities.
async function checkout(lang: Locale, cart: Cart) {
  const lines = cartLines(cart);
  if (lines.length === 0) redirect(`/${lang}/cart`);
  const order = await createOrder({
    description: getDictionary(lang).store.orderDescription,
    amount: linesTotal(lines),
    currency: STORE_CURRENCY,
    lines,
  });
  redirect(`/${lang}/checkout/${order.id}`);
}

export type AddToCartResult = { ok: boolean; quantity: number; at: number };

// Returns what happened so the button can say so. `at` makes two adds of the
// same quantity distinct results.
export async function addToCartAction(productId: string, form?: FormData): Promise<AddToCartResult> {
  const quantity = quantityFrom(form);
  if (!getProduct(productId)) return { ok: false, quantity, at: Date.now() };
  await writeCart(addToCart(await readCart(), productId, quantity));
  return { ok: true, quantity, at: Date.now() };
}

export async function setQuantityAction(productId: string, quantity: number) {
  await writeCart(withQuantity(await readCart(), productId, quantity));
}

// Pay for the whole cart. The cart is emptied once the order exists: a retry
// after a failed payment reuses the order, not the cart.
export async function checkoutCartAction(lang: string) {
  const locale = localeOf(lang);
  const cart = await readCart();
  if (Object.keys(cart).length > 0) await writeCart({});
  await checkout(locale, cart);
}

// Buy now: an order for this product alone, leaving the cart as it is.
export async function buyNowAction(lang: string, productId: string, form?: FormData) {
  const locale = localeOf(lang);
  if (!getProduct(productId)) redirect(`/${locale}`);
  await checkout(locale, withQuantity({}, productId, quantityFrom(form)));
}
