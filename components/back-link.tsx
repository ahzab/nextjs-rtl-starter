import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

// A link back up the flow. The chevron points to where "back" is: left in
// English, right in Arabic.
export function BackLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex w-fit items-center gap-1.5 py-2 text-sm font-medium text-primary hover:underline", className)}>
      <ChevronLeft className="size-[18px] rtl:rotate-180" aria-hidden />
      {label}
    </Link>
  );
}
