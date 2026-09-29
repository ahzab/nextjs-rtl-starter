import { Coffee, CookingPot, Flame, TreePalm } from "lucide-react";

import type { Category } from "@/lib/products";
import { cn } from "@/lib/utils";

const ICONS = { coffee: Coffee, dates: TreePalm, incense: Flame, tools: CookingPot } as const;

// A surface tinted by category with its icon, where your product photo goes.
// Swap it for next/image once the catalogue has pictures.
// `small` gives thumbnails (cart lines, toasts) an icon big enough to read.
export function ProductImage({ category, small = false, className }: { category: Category; small?: boolean; className?: string }) {
  const Icon = ICONS[category];
  return (
    <div aria-hidden className={cn(`tint-${category} flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl`, className)}>
      <Icon className={cn(small ? "size-2/5 stroke-[1.75]" : "size-1/4 stroke-[1.25]", "transition-transform duration-300 ease-out motion-safe:group-hover/card:scale-110")} />
    </div>
  );
}
