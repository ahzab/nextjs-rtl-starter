// The cart: product id → quantity, kept in a cookie so the demo needs no
// database and survives a reload. Everything here is pure; lib/cart-cookie.ts
// reads and writes the cookie. Prices never come from the cookie: lines are
// priced from lib/products.ts on the server every time.

import type { OrderLine } from "@/lib/orders";
import { getProduct, unitPrice } from "@/lib/products";

export type Cart = Record<string, number>;

// Per line. Keeps a demo cart from charging silly amounts.
export const MAX_QUANTITY = 10;

const clamp = (n: number) => Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(n)));

// Anything unreadable, unknown or not a positive whole number is dropped.
export function parseCart(raw: string | undefined): Cart {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const cart: Cart = {};
  for (const [id, qty] of Object.entries(data)) {
    const n = typeof qty === "number" && Number.isFinite(qty) ? clamp(qty) : 0;
    if (n > 0 && getProduct(id)) cart[id] = n;
  }
  return cart;
}

export const serializeCart = (cart: Cart): string => JSON.stringify(cart);

// Sets a line's quantity; zero or less removes it.
export function withQuantity(cart: Cart, id: string, quantity: number): Cart {
  const next = { ...cart };
  const n = clamp(quantity);
  if (n > 0 && getProduct(id)) next[id] = n;
  else delete next[id];
  return next;
}

export const addToCart = (cart: Cart, id: string, quantity = 1): Cart => withQuantity(cart, id, (cart[id] ?? 0) + quantity);

export function cartLines(cart: Cart, currency?: "SAR" | "KWD"): OrderLine[] {
  return Object.entries(cart).flatMap(([productId, quantity]) => {
    const product = getProduct(productId);
    return product ? [{ productId, quantity, unitAmount: unitPrice(product, currency) }] : [];
  });
}

// Minor units.
export const linesTotal = (lines: OrderLine[]): number => lines.reduce((sum, l) => sum + l.unitAmount * l.quantity, 0);

export const cartCount = (cart: Cart): number => Object.values(cart).reduce((sum, n) => sum + n, 0);
