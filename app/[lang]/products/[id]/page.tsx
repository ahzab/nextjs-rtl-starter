import { Check } from "lucide-react";
import { notFound } from "next/navigation";

import { buyNowAction } from "@/app/[lang]/actions";
import { Heading } from "@/components/heading";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Price } from "@/components/store/price";
import { ProductCard } from "@/components/store/product-card";
import { ProductImage } from "@/components/store/product-image";
import { QuantityStepper } from "@/components/store/quantity-stepper";
import { TrustPoints } from "@/components/store/trust-points";
import { StorePage } from "@/components/store-page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SubmitButton } from "@/components/ui/submit-button";
import { addToCartLabels, getDictionary, hasLocale } from "@/lib/i18n";
import { getProduct, PRODUCTS, unitPrice } from "@/lib/products";

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
    <StorePage lang={lang} banner={t.site.testMode} current="products">
      <Breadcrumb
        label={s.breadcrumb}
        items={[
          { label: s.home, href: `/${lang}` },
          { label: s.categories[product.category], href: `/${lang}#${product.category}` },
          { label: product.name[lang] },
        ]}
      />

      <div className="flex flex-col gap-6 md:grid md:grid-cols-[1.1fr_1fr] md:items-start md:gap-14">
        <ProductImage category={product.category} className="aspect-[4/3] rounded-3xl md:aspect-square md:max-w-[560px]" />
        <form className="flex flex-col gap-4 md:gap-5 md:pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-muted-foreground">{s.categories[product.category]}</span>
            <span className="rounded-full bg-accent/25 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{s.sampleBadge}</span>
          </div>
          <Heading text={product.name[lang]} className="md:text-[36px]" />
          <Price minor={unitPrice(product)} lang={lang} className="text-2xl font-semibold md:text-[28px]" />
          <p className="m-0 max-w-[52ch] text-[15px] leading-[1.8] text-muted-foreground">
            {product.description[lang]} {s.sample}
          </p>
          <div className="flex items-center gap-4 border-t border-border pt-4 md:pt-5">
            <QuantityStepper label={s.quantity} decrease={s.decrease} increase={s.increase} />
            <span className="flex items-center gap-1.5 text-sm text-primary">
              <Check className="size-4" aria-hidden />
              {s.inStock}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <SubmitButton size="lg" className="w-full" formAction={buyNowAction.bind(null, lang, product.id)}>
              {s.buyNow}
            </SubmitButton>
            <AddToCartButton
              productId={product.id}
              name={product.name[lang]}
              category={product.category}
              cartHref={`/${lang}/cart`}
              labels={addToCartLabels(s)}
              size="lg"
            />
          </div>
          <TrustPoints lang={lang} variant="list" />
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
