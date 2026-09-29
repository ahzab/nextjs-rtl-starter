import { ReceiptText } from "lucide-react";
import Link from "next/link";

import { LangSwitch } from "@/components/lang-switch";
import { CartButton } from "@/components/store/cart-button";
import { getDictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Section = "home" | "products" | "cart" | null;

export function SiteHeader({ lang, current = null }: { lang: Locale; current?: Section }) {
  const d = getDictionary(lang);
  const t = d.site;
  const link = (active: boolean) => cn("px-1 py-2.5 text-[15px] hover:text-primary", active ? "font-semibold text-foreground" : "text-muted-foreground");
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-4 md:px-20 md:py-5">
      <div className="flex items-center gap-10">
        <Link href={`/${lang}`} className="flex items-center gap-2 text-base font-semibold md:text-lg">
          <ReceiptText className="size-[22px] text-primary" aria-hidden />
          {t.brand}
        </Link>
        <nav aria-label={d.store.nav} className="hidden md:block">
          <ul className="m-0 flex list-none items-center gap-6 p-0">
            <li>
              <Link href={`/${lang}`} aria-current={current === "home" ? "page" : undefined} className={link(current === "home")}>
                {d.store.home}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}#products`} aria-current={current === "products" ? "true" : undefined} className={link(current === "products")}>
                {d.home.products}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex items-center gap-3 md:gap-5">
        <LangSwitch to={lang === "ar" ? "en" : "ar"} label={t.switchLabel} text={t.switchTo} />
        <CartButton lang={lang} />
      </div>
    </header>
  );
}
