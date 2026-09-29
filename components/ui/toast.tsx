"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// A small toast queue with no provider: call toast() from any client
// component, mount <Toaster /> once per page. Bottom corner, clear of the
// header's cart badge; newest nearest the edge, three at most,
// each gone after `duration` ms. The region is always in the DOM so screen
// readers announce what lands in it; nothing takes focus.

type Action = { label: string } & ({ href: string } | { onClick: () => void });

export type ToastInput = {
  title: string;
  body?: string;
  media?: ReactNode;
  action?: Action;
  duration?: number;
};

type Toast = ToastInput & { id: number };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const EMPTY: Toast[] = [];

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function toast(input: ToastInput): number {
  const id = nextId++;
  toasts = [{ ...input, id }, ...toasts].slice(0, 3);
  emit();
  setTimeout(() => dismissToast(id), input.duration ?? 4500);
  return id;
}

const actionClass = "shrink-0 rounded-md px-2 py-1.5 text-sm font-semibold text-primary hover:bg-primary-soft";

function ToastAction({ id, action }: { id: number; action: Action }) {
  if ("href" in action) {
    return (
      <Link href={action.href} onClick={() => dismissToast(id)} className={actionClass}>
        {action.label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={actionClass}
      onClick={() => {
        dismissToast(id);
        action.onClick();
      }}
    >
      {action.label}
    </button>
  );
}

export function Toaster({ label, dismiss }: { label: string; dismiss: string }) {
  const list = useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
  return (
    <section
      aria-label={label}
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col-reverse gap-2 md:inset-x-auto md:end-8 md:bottom-8 md:w-[380px]"
    >
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_12px_32px_rgb(28_34_48/0.14)]",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3",
          )}
        >
          {t.media ? <div className="size-12 shrink-0">{t.media}</div> : null}
          <div className="flex min-w-0 grow flex-col">
            <strong className="text-sm font-semibold">{t.title}</strong>
            {t.body ? <span className="truncate text-[13px] text-muted-foreground">{t.body}</span> : null}
          </div>
          {t.action ? <ToastAction id={t.id} action={t.action} /> : null}
          <button
            type="button"
            aria-label={dismiss}
            onClick={() => dismissToast(t.id)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </section>
  );
}
