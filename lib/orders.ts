// Demo order store. Replace this file with your own table: nothing else reads
// orders directly, and every function is already async so a database drops in.
//
// Two backends, picked by environment:
// - In memory (the default), so the example runs with no database. Orders
//   vanish on restart and aren't shared between serverless instances, which is
//   fine for a local test and wrong once deployed.
// - Redis over Upstash's REST API, when UPSTASH_REDIS_REST_URL and
//   UPSTASH_REDIS_REST_TOKEN are set (Vercel's Upstash integration sets
//   KV_REST_API_URL / KV_REST_API_TOKEN, which work too). This is what a hosted
//   demo needs: the checkout, Tap's redirect and the webhook can each land on a
//   different instance. Orders expire after a day.

import { randomUUID } from "node:crypto";

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

// One product line, priced on the server when the order is created.
export type OrderLine = { productId: string; quantity: number; unitAmount: number }; // unitAmount in minor units

export type Order = {
  id: string;
  description: string;
  amount: number; // minor units, the sum of the lines
  lines: OrderLine[];
  currency: string;
  status: OrderStatus;
  chargeId: string | null; // the latest Tap charge for this order
  createdAt: string;
  paidAt: string | null;
};

type Backend = {
  get(id: string): Promise<Order | null>;
  put(order: Order): Promise<void>;
};

const memory = (): Backend => {
  const store: Map<string, Order> = ((globalThis as { __orders?: Map<string, Order> }).__orders ??= new Map());
  return {
    get: async (id) => {
      const order = store.get(id);
      return order ? { ...order } : null;
    },
    put: async (order) => {
      store.set(order.id, { ...order });
    },
  };
};

const TTL_SECONDS = 60 * 60 * 24;

const redis = (url: string, token: string): Backend => {
  const command = async (args: (string | number)[]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Order store: Redis answered ${res.status}`);
    return ((await res.json()) as { result: unknown }).result;
  };
  return {
    get: async (id) => {
      const raw = await command(["GET", `order:${id}`]);
      return typeof raw === "string" ? (JSON.parse(raw) as Order) : null;
    },
    put: async (order) => {
      await command(["SET", `order:${order.id}`, JSON.stringify(order), "EX", TTL_SECONDS]);
    },
  };
};

function backend(): Backend {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? redis(url.replace(/\/$/, ""), token) : memory();
}

export async function createOrder(input: { description: string; amount: number; currency: string; lines?: OrderLine[] }): Promise<Order> {
  const order: Order = {
    lines: [],
    ...input,
    id: randomUUID(),
    status: "pending",
    chargeId: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
  await backend().put(order);
  return order;
}

export async function getOrder(id: string | undefined | null): Promise<Order | null> {
  return id ? backend().get(id) : null;
}

// A failed order can still be paid: the customer retries with a new charge.
export function canPay(order: Order): boolean {
  return order.status === "pending" || order.status === "failed";
}

// A retry creates a new charge, so the latest one wins. The result page only
// accepts the charge recorded here, which stops an old charge id being replayed.
export async function attachCharge(orderId: string, chargeId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order || !canPay(order)) return order;
  order.status = "pending";
  order.chargeId = chargeId;
  await backend().put(order);
  return order;
}

// Idempotent: the redirect and the webhook both confirm the same payment, and
// either can arrive first.
export async function markPaid(orderId: string, chargeId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status !== "paid" && order.status !== "refunded") {
    order.status = "paid";
    order.chargeId = chargeId;
    order.paidAt = new Date().toISOString();
    await backend().put(order);
  }
  return order;
}

// Only the order's latest charge can fail it, so a late post about an earlier
// attempt doesn't undo a retry that is under way.
export async function markFailed(orderId: string, chargeId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (order && order.status === "pending" && order.chargeId === chargeId) {
    order.status = "failed";
    await backend().put(order);
  }
  return order;
}

export async function markRefunded(orderId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (order && order.status === "paid") {
    order.status = "refunded";
    await backend().put(order);
  }
  return order;
}
