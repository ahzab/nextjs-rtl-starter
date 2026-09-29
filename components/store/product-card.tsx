import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Price } from "@/components/store/price";
import { ProductImage } from "@/components/store/product-image";
import { addToCartLabels, getDictionary, type Locale } from "@/lib/i18n";
import { unitPrice, type Product } from "@/lib/products";

export function ProductCard({ product, lang, compact = false }: { product: Product; lang: Locale; compact?: boolean }) {
  const t = getDictionary(lang).store;
  const href = `/${lang}/products/${product.id}`;
  return (
    <article className="group/card flex h-full flex-col gap-3">
      {/* A second way in for the pointer; keyboard and screen readers use the name link below. */}
      <Link href={href} tabIndex={-1} aria-hidden className="rounded-2xl ring-primary/0 transition-shadow group-hover/card:ring-2 group-hover/card:ring-primary/25">
        <ProductImage category={product.category} />
      </Link>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{t.categories[product.category]}</span>
        <Link href={href} className="text-[15px] leading-snug font-medium text-foreground hover:text-primary">
          {product.name[lang]}
        </Link>
        <Price minor={unitPrice(product)} lang={lang} className="pt-0.5 text-base font-semibold" />
      </div>
      {compact ? null : (
        <form className="mt-auto">
          <AddToCartButton
            productId={product.id}
            name={product.name[lang]}
            category={product.category}
            cartHref={`/${lang}/cart`}
            labels={addToCartLabels(t)}
          />
        </form>
      )}
    </article>
  );
}
