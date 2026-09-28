import { notFound } from "next/navigation";

import { Heading, Lead } from "@/components/heading";
import { ProductCard } from "@/components/store/product-card";
import { StorePage } from "@/components/store-page";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { PRODUCTS } from "@/lib/products";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/ahzab/nextjs-rtl-starter";

// Screen 1: the demo store. Every product can go to the cart or straight to
// checkout from its own page.
export default async function StoreHome({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <StorePage lang={lang} banner={t.site.testMode}>
      <section className="flex max-w-[720px] flex-col gap-3 md:gap-5">
        <Heading text={t.home.title} soft={t.home.titleSoft} className="text-[32px] md:text-[52px]" />
        <Lead>{t.home.subtitle}</Lead>
        <div className="flex flex-col gap-3 md:flex-row">
          <a href="#products" className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto")}>
            {t.home.products}
          </a>
          <a href={REPO_URL} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full md:w-auto")}>
            {t.home.code}
          </a>
        </div>
      </section>

      <section id="products" className="flex scroll-mt-6 flex-col gap-4 pt-4 md:pt-8">
        <h2 className="m-0 text-2xl font-semibold md:text-[26px]">{t.home.products}</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang} />
          ))}
        </div>
      </section>
    </StorePage>
  );
}
