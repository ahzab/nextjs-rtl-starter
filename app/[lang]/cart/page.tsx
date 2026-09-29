import { ArrowRight, Lock, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { checkoutCartAction } from "@/app/[lang]/actions";
import { Heading, Lead } from "@/components/heading";
import { Receipt } from "@/components/receipt";
import { CartLineControls } from "@/components/store/cart-line-controls";
import { ProductImage } from "@/components/store/product-image";
import { StorePage } from "@/components/store-page";
import { Button, buttonVariants } from "@/components/ui/button";
import { cartLines, linesTotal } from "@/lib/cart";
import { readCart } from "@/lib/cart-cookie";
import { countLabel, getDictionary, hasLocale } from "@/lib/i18n";
import { formatMinor } from "@/lib/money";
import { getProduct, STORE_CURRENCY } from "@/lib/products";
import { cn } from "@/lib/utils";

export default async function CartPage({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const s = t.store;
  const lines = cartLines(await readCart());
  const money = (minor: number) => formatMinor(minor, STORE_CURRENCY, lang);

  if (lines.length === 0) {
    return (
      <StorePage lang={lang} banner={t.site.testMode} current="cart">
        <div className="mx-auto flex max-w-[460px] flex-col items-center gap-3 py-10 text-center md:gap-4 md:py-16">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingCart className="size-7 stroke-[1.5]" aria-hidden />
          </span>
          <Heading text={s.emptyCart} />
          <Lead>{s.emptyCartBody}</Lead>
          <Link href={`/${lang}#products`} className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full md:w-fit")}>
            {s.browse}
          </Link>
        </div>
      </StorePage>
    );
  }

  const total = linesTotal(lines);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const itemLabel = countLabel(count, s.itemOne, s.itemTwo, s.items);
  const items = lines.map((line) => {
    const product = getProduct(line.productId)!;
    return { line, product, name: product.name[lang] };
  });

  return (
    <StorePage lang={lang} banner={t.site.testMode} current="cart">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <Heading text={s.cart} className="md:text-4xl" />
          <span className="tabular text-[15px] text-muted-foreground">{itemLabel}</span>
        </div>
        <Link href={`/${lang}#products`} className="flex items-center gap-1.5 py-2 text-[15px] font-medium text-primary hover:underline">
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
          {s.continueShopping}
        </Link>
      </div>
      <div className="flex flex-col gap-6 md:grid md:grid-cols-[1.5fr_1fr] md:items-start md:gap-10 lg:gap-14">
        <ul className="m-0 flex list-none flex-col rounded-2xl border border-border bg-card px-5 py-1">
          {items.map(({ line, product, name }) => (
            <li key={line.productId} className="flex items-center gap-3.5 border-b border-border py-4 last:border-b-0">
              <Link href={`/${lang}/products/${product.id}`} tabIndex={-1} className="w-20 shrink-0 md:w-[88px]">
                <ProductImage category={product.category} className="rounded-[10px]" />
              </Link>
              <div className="flex min-w-0 grow flex-col gap-2">
                <Link href={`/${lang}/products/${product.id}`} className="text-[15px] font-medium text-foreground hover:text-primary">
                  {name}
                </Link>
                <span className="text-[13px] text-muted-foreground">
                  <span className="tabular">{money(line.unitAmount)}</span> {s.each}
                </span>
                <CartLineControls
                  key={line.quantity}
                  productId={line.productId}
                  quantity={line.quantity}
                  labels={{ quantity: s.quantity, decrease: s.decrease, increase: s.increase, remove: s.remove }}
                />
              </div>
              <span className="tabular self-start pt-0.5 text-base font-semibold whitespace-nowrap">{money(line.unitAmount * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3.5 md:sticky md:top-6">
          <Receipt
            lang={lang}
            state="waiting"
            currency={STORE_CURRENCY}
            items={items.map(({ line, name }) => ({ label: line.quantity > 1 ? `${name} × ${line.quantity}` : name, amount: line.unitAmount * line.quantity }))}
          />
          <form action={checkoutCartAction.bind(null, lang)}>
            <Button type="submit" size="lg" className="w-full">
              {s.pay} <span className="tabular">{money(total)}</span>
            </Button>
          </form>
          <div className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
            <Lock className="mt-[3px] size-4 shrink-0 text-primary" aria-hidden />
            <span>{t.checkout.cardNote}</span>
          </div>
        </div>
      </div>
    </StorePage>
  );
}
