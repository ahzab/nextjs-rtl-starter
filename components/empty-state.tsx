import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// A centred icon, one line of title, one of explanation and the way out:
// the empty cart and the not-found page.
export function EmptyState({
  icon,
  title,
  body,
  action,
  children,
  as: Title = "h1",
  className,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  children?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-[460px] flex-col items-center gap-3 py-10 text-center md:gap-4 md:py-16", className)}>
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-7 [&_svg]:stroke-[1.5]">{icon}</span>
      <Title className="m-0 text-2xl leading-tight font-semibold text-balance md:text-[28px]">{title}</Title>
      {body ? <p className="m-0 text-[15px] leading-[1.7] text-muted-foreground md:text-base">{body}</p> : null}
      {children}
      {action ? <div className="mt-2 flex w-full justify-center">{action}</div> : null}
    </div>
  );
}
