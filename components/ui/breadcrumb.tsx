import Link from "next/link";

// Home / Coffee / Khawlani coffee. The last item is the current page and has
// no link; the separators are decorative and hidden from screen readers.
export function Breadcrumb({ label, items }: { label: string; items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label={label}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {i > 0 ? (
                <span aria-hidden className="text-(--dashed)">
                  /
                </span>
              ) : null}
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined} className={last ? "text-foreground" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="text-muted-foreground hover:text-primary">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
