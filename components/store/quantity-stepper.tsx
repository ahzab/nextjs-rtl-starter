"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { MAX_QUANTITY } from "@/lib/cart";

// Minus, count, plus. Inside a form it submits its value as "quantity";
// with onChange it reports every step instead (the cart page).
export function QuantityStepper({
  initial = 1,
  label,
  decrease,
  increase,
  onChange,
}: {
  initial?: number;
  label: string;
  decrease: string;
  increase: string;
  onChange?: (quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(initial);
  const step = (by: number) => {
    const next = Math.min(MAX_QUANTITY, Math.max(1, quantity + by));
    if (next === quantity) return;
    setQuantity(next);
    onChange?.(next);
  };
  const button = "flex size-10 items-center justify-center rounded-[10px] disabled:opacity-35";
  return (
    <div role="group" aria-label={label} className="inline-flex w-fit items-center rounded-[10px] border border-input bg-card">
      <button type="button" aria-label={decrease} className={button} disabled={quantity <= 1} onClick={() => step(-1)}>
        <Minus className="size-4" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-[15px] font-semibold tabular-nums">
        {quantity}
      </output>
      <button type="button" aria-label={increase} className={button} disabled={quantity >= MAX_QUANTITY} onClick={() => step(1)}>
        <Plus className="size-4" aria-hidden />
      </button>
      <input type="hidden" name="quantity" value={quantity} />
    </div>
  );
}
