"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";

// A submit button that shows a spinner while its form's action runs. In a form
// with several actions (Buy now next to Add to cart) pass the same function as
// `formAction` and only the button that was pressed spins; the rest are
// disabled until the action ends.
export function SubmitButton({ children, formAction, disabled, ...props }: ComponentProps<typeof Button>) {
  const status = useFormStatus();
  const mine = status.pending && (!formAction || status.action === formAction);
  return (
    <Button type="submit" formAction={formAction} disabled={disabled || status.pending} aria-busy={mine} {...props}>
      {mine ? <Spinner className="size-4" /> : null}
      {children}
    </Button>
  );
}
