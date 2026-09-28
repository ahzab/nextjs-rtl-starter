"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import type { Locale } from "@/lib/i18n";

// Swaps the /ar or /en prefix and keeps the rest of the URL, so switching on
// the result page keeps its ?tap_id.
function SwitchLink({ to, label, text }: { to: Locale; label: string; text: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");
  const href = `/${to}${rest}${search ? `?${search}` : ""}`;
  return (
    <Link href={href} hrefLang={to} lang={to} aria-label={label} className="px-1 py-2.5 text-sm text-primary md:text-[15px]">
      {text}
    </Link>
  );
}

export function LangSwitch(props: { to: Locale; label: string; text: string }) {
  return (
    <Suspense
      fallback={
        <Link href={`/${props.to}`} hrefLang={props.to} lang={props.to} className="px-1 py-2.5 text-sm text-primary md:text-[15px]">
          {props.text}
        </Link>
      }
    >
      <SwitchLink {...props} />
    </Suspense>
  );
}
