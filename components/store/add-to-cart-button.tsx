"use client";

import { Check } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { addToCartAction, type AddToCartResult } from "@/app/[lang]/actions";
import { ProductImage } from "@/components/store/product-image";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { Category } from "@/lib/products";
import { cn } from "@/lib/utils";

export type AddToCartLabels = {
  add: string;
  adding: string;
  added: string;
  toastTitle: string;
  viewCart: string;
  failed: string;
};

// Add to cart with feedback at every step: a spinner while the server writes
// the cart, "Added" on the button for two seconds, and a toast with a link to
// the cart. Inside a larger form (the product page) it submits that form, so
// the quantity stepper's value goes with it.
export function AddToCartButton({
  productId,
  name,
  category,
  cartHref,
  labels,
  size = "sm",
  className,
}: {
  productId: string;
  name: string;
  category: Category;
  cartHref: string;
  labels: AddToCartLabels;
  size?: "sm" | "lg";
  className?: string;
}) {
  const [result, formAction, pending] = useActionState<AddToCartResult | null, FormData>(
    (_prev, form) => addToCartAction(productId, form),
    null,
  );
  // "Added" shows until this catches up with the result's timestamp.
  const [settledAt, setSettledAt] = useState(0);
  const added = !pending && result?.ok === true && result.at > settledAt;

  // One toast per result: the page refresh after the action hands this
  // component new props, which must not announce the same add twice.
  const toasted = useRef(0);
  useEffect(() => {
    if (!result || toasted.current === result.at) return;
    toasted.current = result.at;
    if (result.ok) {
      toast({
        title: labels.toastTitle,
        body: result.quantity > 1 ? `${name} × ${result.quantity}` : name,
        media: <ProductImage category={category} small className="rounded-[10px]" />,
        action: { label: labels.viewCart, href: cartHref },
      });
    } else {
      toast({ title: labels.failed });
    }
  }, [result, name, category, cartHref, labels]);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setSettledAt(result.at), 2000);
    return () => clearTimeout(timer);
  }, [result]);

  return (
    <Button
      type="submit"
      variant="outline"
      size={size}
      formAction={formAction}
      disabled={pending}
      aria-busy={pending}
      className={cn("w-full font-medium", added && "border-primary text-primary", className)}
    >
      {pending ? (
        <>
          <Spinner className="size-4" />
          {labels.adding}
        </>
      ) : added ? (
        <>
          <Check className="size-4" aria-hidden />
          {labels.added}
        </>
      ) : (
        labels.add
      )}
    </Button>
  );
}
