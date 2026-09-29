import Link from "next/link";
import { notFound } from "next/navigation";

import { Heading, Lead } from "@/components/heading";
import { Receipt } from "@/components/receipt";
import { ProductCard } from "@/components/store/product-card";
import { TrustPoints } from "@/components/store/trust-points";
import { StorePage } from "@/components/store-page";
import { buttonVariants } from "@/components/ui/button";
import { countLabel, getDictionary, hasLocale } from "@/lib/i18n";
import { CATEGORIES, getProduct, PRODUCTS, STORE_CURRENCY, unitPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

const REPO_URL = "https://github.com/ahzab/nextjs-rtl-starter";

// Screen 1: the demo store. Every product can go to the cart or straight to
// checkout from its own page.
export default async function StoreHome({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const h = t.home;
  const firstOf = new Set(CATEGORIES.map((c) => PRODUCTS.find((p) => p.category === c)?.id));
  const shelves = CATEGORIES.map((category) => ({ category, products: PRODUCTS.filter((p) => p.category === category) })).filter((s) => s.products.length);

  // The hero's picture is what the demo ends in: a paid receipt.
  const sample = ["khawlani-coffee", "sukkari-dates"].map((id) => getProduct(id)!);

  return (
    <StorePage lang={lang} banner={t.site.testMode} current="home">
      <section className="flex flex-col gap-8 md:grid md:grid-cols-[1fr_1.05fr] md:items-center md:gap-14">
        <div className="flex flex-col gap-3 md:gap-5">
          <Heading text={h.title} soft={h.titleSoft} className="text-[32px] leading-[1.2] md:text-[52px] md:leading-[1.12]" />
          <Lead>{h.subtitle}</Lead>
          <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:gap-5">
            <a href="#products" className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto")}>
              {h.shop}
            </a>
            <a href={REPO_URL} className="py-2.5 text-center text-[15px] font-medium text-primary hover:underline">
              {h.code}
            </a>
          </div>
        </div>

        <figure className="hero-ground m-0 hidden rounded-3xl px-10 py-12 md:flex md:flex-col md:items-center md:gap-3 lg:px-16">
          <div aria-hidden className="w-full max-w-[380px] -rotate-1 drop-shadow-[0_18px_30px_rgb(28_34_48/0.10)]">
            <Receipt
              lang={lang}
              state="paid"
              currency={STORE_CURRENCY}
              items={sample.map((p) => ({ label: p.name[lang], amount: unitPrice(p) }))}
              orderId="a3f9e2d0-4c1b-4e7a-9b1d-2f7c8e0dc21e"
              tapStatus="CAPTURED"
              paidWith="mada"
            />
          </div>
          <figcaption className="text-[13px] text-muted-foreground">{h.sampleOrder}</figcaption>
        </figure>
      </section>

      <TrustPoints lang={lang} variant="strip" />

      <section id="products" aria-labelledby="products-title" className="flex scroll-mt-6 flex-col gap-5 pt-4 md:gap-6 md:pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="products-title" className="m-0 text-2xl font-semibold md:text-[28px]">
            {h.allProducts}
          </h2>
          <nav aria-label={h.shelves}>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {shelves.map(({ category, products }) => (
                <li key={category}>
                  <Link
                    href={`#${category}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-input bg-card ps-4 pe-3 text-sm font-medium hover:border-primary hover:text-primary"
                  >
                    {t.store.categories[category]}
                    <span aria-hidden className="tabular rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {products.length}
                    </span>
                    <span className="sr-only">{countLabel(products.length, h.countOne, h.countTwo, h.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
          {PRODUCTS.map((product) => (
            // The first product of each category is where its chip lands.
            <div key={product.id} id={firstOf.has(product.id) ? product.category : undefined} className="scroll-mt-6">
              <ProductCard product={product} lang={lang} />
            </div>
          ))}
        </div>
      </section>
    </StorePage>
  );
}
