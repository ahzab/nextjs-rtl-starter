import { ShoppingCart } from "lucide-react";
import Link from "next/link";

import { cartCount } from "@/lib/cart";
import { readCart } from "@/lib/cart-cookie";
import { getDictionary, type Locale } from "@/lib/i18n";

export async function CartButton({ lang }: { lang: Locale }) {
  const count = cartCount(await readCart());
  const t = getDictionary(lang).store;
  return (
    <Link
      href={`/${lang}/cart`}
      aria-label={t.cartLabel.replace("{count}", String(count))}
      className="relative flex size-11 items-center justify-center text-foreground hover:text-primary"
    >
      <ShoppingCart className="size-[22px]" aria-hidden />
      {count > 0 ? (
        <span className="absolute end-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
