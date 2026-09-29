"use client";

import { ReceiptText, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { LangSwitch } from "@/components/lang-switch";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, hasLocale } from "@/lib/i18n";

// An unknown path under /ar or /en, a product id that doesn't exist, or an
// order the store no longer has. not-found gets no params, so the locale comes
// from the URL, and the header is the bare one: the cart count needs the
// server's cookie read.
export default function NotFound() {
  const { lang: raw } = useParams<{ lang: string }>();
  const lang = hasLocale(raw) ? raw : "ar";
  const t = getDictionary(lang);
  return (
    <>
      <header className="flex items-center justify-between px-5 py-4 md:px-20 md:py-5">
        <Link href={`/${lang}`} className="flex items-center gap-2 text-base font-semibold md:text-lg">
          <ReceiptText className="size-[22px] text-primary" aria-hidden />
          {t.site.brand}
        </Link>
        <LangSwitch to={lang === "ar" ? "en" : "ar"} label={t.site.switchLabel} text={t.site.switchTo} />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-5">
        <EmptyState
          icon={<Search aria-hidden />}
          title={t.notFound.title}
          body={t.notFound.body}
          action={
            <Link href={`/${lang}`} className={buttonVariants({ size: "lg" })}>
              {t.notFound.back}
            </Link>
          }
        >
          <p className="m-0 font-mono text-sm text-muted-foreground">404</p>
        </EmptyState>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
