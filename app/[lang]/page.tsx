import { notFound } from "next/navigation";

import { startCheckout } from "@/app/[lang]/actions";
import { Heading, Lead } from "@/components/heading";
import { Receipt } from "@/components/receipt";
import { StorePage } from "@/components/store-page";
import { Button, buttonVariants } from "@/components/ui/button";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { toMinor } from "@/lib/money";
import { SAMPLE_ORDER } from "@/lib/sample-order";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/ahzab/nextjs-rtl-starter";

// Screen 1: the sample order.
export default async function OrderPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const amount = toMinor(SAMPLE_ORDER.amount, SAMPLE_ORDER.currency);

  const pay = (
    <form action={startCheckout.bind(null, lang)} className="contents">
      <Button type="submit" size="lg" className="w-full md:w-auto">
        {t.home.pay}
      </Button>
    </form>
  );

  return (
    <StorePage lang={lang} banner={t.site.testMode}>
      <div className="flex flex-1 flex-col gap-5 md:grid md:grid-cols-[1.1fr_1fr] md:items-center md:gap-20">
        <div className="flex flex-col gap-2.5 md:gap-5">
          <Heading text={t.home.title} soft={t.home.titleSoft} className="text-[32px] md:text-[52px]" />
          <Lead>{t.home.subtitle}</Lead>
          <div className="hidden gap-3 md:flex">
            {pay}
            <a href={REPO_URL} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              {t.home.code}
            </a>
          </div>
        </div>
        <div className="md:max-w-[440px]">
          <Receipt
            lang={lang}
            state="waiting"
            currency={SAMPLE_ORDER.currency}
            items={[{ label: t.home.product, amount }]}
            note={t.home.productNote}
          />
        </div>
        <div className="md:hidden">{pay}</div>
      </div>
    </StorePage>
  );
}
