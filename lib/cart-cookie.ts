import "server-only";

import { cookies } from "next/headers";

import { parseCart, serializeCart, type Cart } from "@/lib/cart";

const NAME = "cart";

export async function readCart(): Promise<Cart> {
  return parseCart((await cookies()).get(NAME)?.value);
}

// Server Actions only: cookies can't be written while a page renders.
export async function writeCart(cart: Cart): Promise<void> {
  const jar = await cookies();
  if (Object.keys(cart).length === 0) jar.delete(NAME);
  else jar.set(NAME, serializeCart(cart), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
