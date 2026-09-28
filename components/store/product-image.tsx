import { Coffee, CookingPot, Flame, TreePalm } from "lucide-react";

import type { Category } from "@/lib/products";
import { cn } from "@/lib/utils";

const ICONS = { coffee: Coffee, dates: TreePalm, incense: Flame, tools: CookingPot } as const;

// A plain surface with the category's icon, where your product photo goes.
// Swap it for next/image once the catalogue has pictures.
export function ProductImage({ category, className }: { category: Category; className?: string }) {
  const Icon = ICONS[category];
  return (
    <div aria-hidden className={cn("flex aspect-square w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground", className)}>
      <Icon className="size-1/4 stroke-[1.5]" />
    </div>
  );
}
