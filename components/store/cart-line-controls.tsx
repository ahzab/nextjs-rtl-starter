"use client";

import { startTransition, useTransition } from "react";

import { setQuantityAction } from "@/app/[lang]/actions";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// Each step saves straight away; the page re-renders with the new totals.
// Remove says so in a toast with Undo, which puts the line back as it was.
export function CartLineControls({
  productId,
  quantity,
  name,
  labels,
}: {
  productId: string;
  quantity: number;
  name: string;
  labels: { quantity: string; decrease: string; increase: string; remove: string; removed: string; undo: string };
}) {
  const [pending, start] = useTransition();
  const save = (n: number) => start(() => setQuantityAction(productId, n));
  const remove = () => {
    save(0);
    toast({
      title: labels.removed,
      body: name,
      // The line has unmounted by the time Undo is pressed, so this goes
      // through React's module-level startTransition, not this component's.
      action: { label: labels.undo, onClick: () => startTransition(() => setQuantityAction(productId, quantity)) },
      duration: 6000,
    });
  };
  return (
    <div className={cn("flex items-center gap-3 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      <QuantityStepper initial={quantity} label={labels.quantity} decrease={labels.decrease} increase={labels.increase} onChange={save} />
      <button type="button" onClick={remove} disabled={pending} className="h-11 px-1 text-[15px] font-medium text-primary hover:underline disabled:opacity-50">
        {labels.remove}
      </button>
    </div>
  );
}
