import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// info is teal and polite; error is red and announced right away.
export function Alert({
  kind,
  title,
  children,
  action,
}: {
  kind: "info" | "error";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const Icon = kind === "info" ? Info : CircleAlert;
  return (
    <div
      role={kind === "info" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-[10px] px-4 py-3.5 text-sm leading-relaxed",
        kind === "info" ? "bg-primary-soft text-primary-soft-foreground" : "bg-destructive-soft text-destructive",
      )}
    >
      <Icon className="mt-[3px] size-[18px] shrink-0" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <strong className="font-semibold">{title}</strong>
        {children ? <span className="text-foreground">{children}</span> : null}
        {action ? <div className="flex pt-1.5">{action}</div> : null}
      </div>
    </div>
  );
}
