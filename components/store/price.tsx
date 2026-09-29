import type { Locale } from "@/lib/i18n";
import { formatMinor } from "@/lib/money";
import { STORE_CURRENCY } from "@/lib/products";
import { cn } from "@/lib/utils";

// An amount in minor units, in the store's currency unless told otherwise.
// Tabular figures so prices line up, and never broken across lines.
export function Price({ minor, lang, currency = STORE_CURRENCY, className }: { minor: number; lang: Locale; currency?: string; className?: string }) {
  return <span className={cn("tabular whitespace-nowrap", className)}>{formatMinor(minor, currency, lang)}</span>;
}
