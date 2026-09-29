import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type Section } from "@/components/site-header";
import { TestModeBanner } from "@/components/test-mode-banner";
import { Toaster } from "@/components/ui/toast";
import { getDictionary, type Locale } from "@/lib/i18n";

// The frame every free-repo page shares: test-mode banner, header, main, footer.
export function StorePage({ lang, banner, current, children }: { lang: Locale; banner: string; current?: Section; children: ReactNode }) {
  return (
    <>
      <TestModeBanner text={banner} />
      <SiteHeader lang={lang} current={current} />
      <main className="flex flex-1 flex-col gap-5 px-5 pt-2 pb-6 md:gap-6 md:px-20 md:py-10">{children}</main>
      <SiteFooter lang={lang} />
      <Toaster label={getDictionary(lang).store.notifications} dismiss={getDictionary(lang).store.dismiss} />
    </>
  );
}
