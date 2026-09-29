import { BadgeCheck, CreditCard, ShieldCheck } from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ICONS = [ShieldCheck, BadgeCheck, CreditCard];

// Why the checkout can be trusted, in three points. "strip" is the row under
// the home hero; "list" is the compact box next to a product's buy buttons.
export function TrustPoints({ lang, variant }: { lang: Locale; variant: "strip" | "list" }) {
  const points = getDictionary(lang).trust;

  if (variant === "list") {
    return (
      <ul className="m-0 flex list-none flex-col gap-2 rounded-2xl bg-muted p-4 text-[13px] leading-relaxed text-muted-foreground">
        {points.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <li key={item.title} className="flex items-start gap-2">
              <Icon className="mt-[3px] size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <strong className="font-semibold text-foreground">{item.title}.</strong> {item.body}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul
      className={cn(
        "m-0 grid list-none grid-cols-1 divide-y divide-border rounded-2xl border border-border bg-card p-0",
        "md:grid-cols-3 md:gap-4 md:divide-y-0 md:rounded-none md:border-0 md:bg-transparent",
      )}
    >
      {points.map((item, i) => {
        const Icon = ICONS[i];
        return (
          <li key={item.title} className="flex items-start gap-3 px-4 py-3.5 md:rounded-2xl md:border md:border-border md:bg-card md:px-5 md:py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <span className="flex flex-col gap-0.5">
              <strong className="text-[15px] font-semibold">{item.title}</strong>
              <span className="text-[13px] leading-relaxed text-muted-foreground">{item.body}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
