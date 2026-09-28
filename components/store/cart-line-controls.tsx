"use client";

import { useTransition } from "react";

import { setQuantityAction } from "@/app/[lang]/actions";
import { QuantityStepper } from "@/components/store/quantity-stepper";

// Each step saves straight away; the page re-renders with the new totals.
export function CartLineControls({
  productId,
  quantity,
  labels,
}: {
  productId: string;
  quantity: number;
  labels: { quantity: string; decrease: string; increase: string; remove: string };
}) {
  const [pending, start] = useTransition();
  const save = (n: number) => start(() => setQuantityAction(productId, n));
  return (
    <div className="flex items-center gap-3" aria-busy={pending}>
      <QuantityStepper initial={quantity} label={labels.quantity} decrease={labels.decrease} increase={labels.increase} onChange={save} />
      <button type="button" onClick={() => save(0)} disabled={pending} className="h-11 px-1 text-[15px] font-medium text-primary hover:underline disabled:opacity-50">
        {labels.remove}
      </button>
    </div>
  );
}
