import { cn } from "@/lib/utils";

// v3 headline: one weight, tight tracking, balanced wrap, and an optional
// muted qualifier after the claim.
export function Heading({ text, soft, className }: { text: string; soft?: string; className?: string }) {
  return (
    <h1 className={cn("m-0 text-[28px] leading-tight font-semibold tracking-[-0.01em] text-balance md:text-[40px]", className)}>
      {text}
      {soft ? <span className="text-muted-foreground"> {soft}</span> : null}
    </h1>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-[15px] leading-[1.7] text-muted-foreground md:text-lg">{children}</p>;
}
