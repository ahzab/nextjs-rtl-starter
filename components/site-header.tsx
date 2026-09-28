import { ReceiptText } from "lucide-react";
import Link from "next/link";

import { LangSwitch } from "@/components/lang-switch";
import { CartButton } from "@/components/store/cart-button";
import { getDictionary, type Locale } from "@/lib/i18n";

export function SiteHeader({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).site;
  return (
    <header className="flex items-center justify-between px-5 py-4 md:px-20 md:py-5">
      <Link href={`/${lang}`} className="flex items-center gap-2 text-base font-semibold md:text-lg">
        <ReceiptText className="size-[22px] text-primary" aria-hidden />
        {t.brand}
      </Link>
      <div className="flex items-center gap-3 md:gap-5">
        <LangSwitch to={lang === "ar" ? "en" : "ar"} label={t.switchLabel} text={t.switchTo} />
        <CartButton lang={lang} />
      </div>
    </header>
  );
}
