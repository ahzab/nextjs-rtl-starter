// Demo order store, kept in memory so the example runs with no database.
// Replace this file with your own table: nothing else reads orders directly.
// In memory means orders vanish on restart and aren't shared between
// serverless instances, which is fine for a local test and wrong in production.

import { randomUUID } from "node:crypto";

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export type Order = {
  id: string;
  description: string;
  amount: number; // minor units
  currency: string;
  status: OrderStatus;
  paymentId: string | null;
  createdAt: string;
  paidAt: string | null;
};

const store: Map<string, Order> = ((globalThis as { __orders?: Map<string, Order> }).__orders ??=
  new Map());

export function createOrder(input: { description: string; amount: number; currency: string }): Order {
  const order: Order = {
    ...input,
    id: randomUUID(),
    status: "pending",
    paymentId: null,
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
  store.set(order.id, order);
  return order;
}

export function getOrder(id: string | undefined | null): Order | null {
  return id ? (store.get(id) ?? null) : null;
}

export function attachPayment(orderId: string, paymentId: string): Order | null {
  const order = store.get(orderId);
  if (!order || order.status !== "pending") return order ?? null;
  order.paymentId = paymentId;
  return order;
}

// Idempotent: the redirect and the webhook both confirm the same payment, and
// either can arrive first.
export function markPaid(orderId: string, paymentId: string): Order | null {
  const order = store.get(orderId);
  if (!order) return null;
  if (order.status !== "paid" && order.status !== "refunded") {
    order.status = "paid";
    order.paymentId = paymentId;
    order.paidAt = new Date().toISOString();
  }
  return order;
}

export function markFailed(orderId: string): Order | null {
  const order = store.get(orderId);
  if (order && order.status === "pending") order.status = "failed";
  return order ?? null;
}

export function markRefunded(orderId: string): Order | null {
  const order = store.get(orderId);
  if (order && order.status === "paid") order.status = "refunded";
  return order ?? null;
}
