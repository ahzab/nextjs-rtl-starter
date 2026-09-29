import { beforeEach, describe, expect, it, vi } from "vitest";

// The cookie jar, in memory.
let stored: Record<string, number> = {};
vi.mock("../lib/cart-cookie", () => ({
  readCart: async () => ({ ...stored }),
  writeCart: async (cart: Record<string, number>) => {
    stored = cart;
  },
}));
vi.mock("server-only", () => ({}));

const { addToCartAction } = await import("../app/[lang]/actions");

const form = (quantity: number) => {
  const f = new FormData();
  f.set("quantity", String(quantity));
  return f;
};

describe("addToCartAction", () => {
  beforeEach(() => {
    stored = {};
  });

  it("adds the stepper's quantity and says so", async () => {
    const result = await addToCartAction("cardamom", form(3));
    expect(result).toMatchObject({ ok: true, quantity: 3 });
    expect(stored).toEqual({ cardamom: 3 });
  });

  it("refuses an unknown product and leaves the cart alone", async () => {
    const result = await addToCartAction("not-a-product", form(1));
    expect(result.ok).toBe(false);
    expect(stored).toEqual({});
  });

  it("gives two identical adds different timestamps", async () => {
    const a = await addToCartAction("saffron");
    await new Promise((r) => setTimeout(r, 2));
    const b = await addToCartAction("saffron");
    expect(b.at).toBeGreaterThan(a.at);
    expect(stored).toEqual({ saffron: 2 });
  });
});
