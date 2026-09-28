import Link from "next/link";

import { addToCartAction } from "@/app/[lang]/actions";
import { ProductImage } from "@/components/store/product-image";
import { Button } from "@/components/ui/button";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatMinor } from "@/lib/money";
import { STORE_CURRENCY, unitPrice, type Product } from "@/lib/products";

export function ProductCard({ product, lang, compact = false }: { product: Product; lang: Locale; compact?: boolean }) {
  const t = getDictionary(lang).store;
  const href = `/${lang}/products/${product.id}`;
  return (
    <article className="flex h-full flex-col gap-2.5">
      {/* A second way in for the pointer; keyboard and screen readers use the name link below. */}
      <Link href={href} tabIndex={-1} aria-hidden>
        <ProductImage category={product.category} />
      </Link>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{t.categories[product.category]}</span>
        <Link href={href} className="text-[15px] font-medium text-foreground hover:text-primary">
          {product.name[lang]}
        </Link>
      </div>
      <span className="tabular text-base font-semibold whitespace-nowrap">{formatMinor(unitPrice(product), STORE_CURRENCY, lang)}</span>
      {compact ? null : (
        <form action={addToCartAction.bind(null, product.id)} className="mt-auto">
          <Button type="submit" variant="outline" size="sm" className="w-full font-medium">
            {t.addToCart}
          </Button>
        </form>
      )}
    </article>
  );
}
