import { describe, expect, it } from "vitest";

import { addToCart, cartCount, cartLines, linesTotal, MAX_QUANTITY, parseCart, withQuantity } from "../lib/cart";
import { orderItems } from "../lib/order-items";
import type { Order } from "../lib/orders";

describe("cart cookie parsing", () => {
  it("keeps known products with positive whole quantities", () => {
    expect(parseCart(JSON.stringify({ "ajwa-dates": 2, saffron: 1 }))).toEqual({ "ajwa-dates": 2, saffron: 1 });
  });

  it("drops unknown ids, zero, negative and non-numbers, and caps the rest", () => {
    const raw = JSON.stringify({ "ajwa-dates": -3, saffron: 0, nope: 4, cardamom: "5", "oud-incense": 99, "finjan-set": 2.9 });
    expect(parseCart(raw)).toEqual({ "oud-incense": MAX_QUANTITY, "finjan-set": 2 });
  });

  it("treats garbage as an empty cart", () => {
    expect(parseCart("not json")).toEqual({});
    expect(parseCart("[1,2]")).toEqual({});
    expect(parseCart(undefined)).toEqual({});
  });
});

describe("cart changes", () => {
  it("adds up, caps at the maximum and removes at zero", () => {
    let cart = addToCart({}, "saffron", 2);
    cart = addToCart(cart, "saffron", 20);
    expect(cart).toEqual({ saffron: MAX_QUANTITY });
    expect(withQuantity(cart, "saffron", 0)).toEqual({});
    expect(addToCart({}, "made-up")).toEqual({});
    expect(cartCount({ saffron: 2, "ajwa-dates": 3 })).toBe(5);
  });
});

describe("pricing", () => {
  it("prices lines from the catalogue in minor units, never from the cookie", () => {
    const lines = cartLines({ "khawlani-coffee": 2, cardamom: 1 }, "SAR");
    expect(lines).toEqual([
      { productId: "khawlani-coffee", quantity: 2, unitAmount: 6500 },
      { productId: "cardamom", quantity: 1, unitAmount: 3800 },
    ]);
    expect(linesTotal(lines)).toBe(16800);
  });

  it("uses three decimals for dinars", () => {
    const lines = cartLines({ "finjan-set": 2 }, "KWD");
    expect(lines[0].unitAmount).toBe(7750);
    expect(linesTotal(lines)).toBe(15500);
  });
});

describe("receipt rows", () => {
  const order = (lines: Order["lines"]): Order => ({
    id: "o1",
    description: "Demo store order",
    amount: linesTotal(lines),
    lines,
    currency: "SAR",
    status: "pending",
    chargeId: null,
    createdAt: "",
    paidAt: null,
  });

  it("names each line in the page's language, with the quantity when above one", () => {
    const o = order([
      { productId: "ajwa-dates", quantity: 2, unitAmount: 5500 },
      { productId: "saffron", quantity: 1, unitAmount: 3200 },
    ]);
    expect(orderItems(o, "en")).toEqual([
      { label: "Ajwa dates, 500 g × 2", amount: 11000 },
      { label: "Saffron, 1 g", amount: 3200 },
    ]);
    expect(orderItems(o, "ar")[0].label).toBe("تمر عجوة، 500 غ × 2");
  });

  it("falls back to the description for an order without lines", () => {
    expect(orderItems(order([]), "en")).toEqual([{ label: "Demo store order", amount: 0 }]);
  });
});
