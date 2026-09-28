import Link from "next/link";
import { notFound } from "next/navigation";

import { addToCartAction, buyNowAction } from "@/app/[lang]/actions";
import { Heading } from "@/components/heading";
import { ProductCard } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { StorePage } from "@/components/store-page";
import { Button } from "@/components/ui/button";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { formatMinor } from "@/lib/money";
import { getProduct, PRODUCTS, STORE_CURRENCY, unitPrice } from "@/lib/products";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const product = getProduct(id);
  if (!product) notFound();
  const t = getDictionary(lang);
  const s = t.store;
  const related = [...PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category), ...PRODUCTS.filter((p) => p.category !== product.category)].slice(0, 4);

  // One form, two buttons: Buy now goes straight to checkout, Add to cart
  // stays here. Both carry the stepper's quantity.
  return (
    <StorePage lang={lang} banner={t.site.testMode}>
      <nav aria-label={s.home}>
        <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-sm text-muted-foreground">
          <li>
            <Link href={`/${lang}`} className="text-muted-foreground hover:text-primary">
              {s.home}
            </Link>
          </li>
          <li aria-hidden className="text-(--dashed)">/</li>
          <li aria-current="page" className="text-foreground">
            {product.name[lang]}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-14">
        <ProductImage category={product.category} className="md:max-w-[520px]" />
        <form className="flex flex-col gap-4">
          <span className="text-[13px] text-muted-foreground">{s.categories[product.category]}</span>
          <Heading text={product.name[lang]} className="md:text-[34px]" />
          <span className="tabular text-2xl font-semibold whitespace-nowrap md:text-[26px]">{formatMinor(unitPrice(product), STORE_CURRENCY, lang)}</span>
          <p className="m-0 text-[15px] leading-[1.8] text-muted-foreground">
            {product.description[lang]} {s.sample}
          </p>
          <QuantityStepper label={s.quantity} decrease={s.decrease} increase={s.increase} />
          <div className="flex flex-col gap-2.5">
            <Button type="submit" size="lg" className="w-full" formAction={buyNowAction.bind(null, lang, product.id)}>
              {s.buyNow}
            </Button>
            <Button type="submit" variant="outline" size="lg" className="w-full font-medium" formAction={addToCartAction.bind(null, product.id)}>
              {s.addToCart}
            </Button>
          </div>
        </form>
      </div>

      <section className="flex flex-col gap-4 pt-4 md:pt-8">
        <h2 className="m-0 text-xl font-semibold md:text-2xl">{s.related}</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} lang={lang} compact />
          ))}
        </div>
      </section>
    </StorePage>
  );
}
