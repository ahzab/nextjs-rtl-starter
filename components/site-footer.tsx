import { getDictionary, type Locale } from "@/lib/i18n";

export function SiteFooter({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).site;
  return (
    <footer className="border-t border-border px-5 pt-3.5 pb-5 text-center text-xs text-muted-foreground md:flex md:justify-between md:px-20 md:py-[18px] md:text-[13px]">
      <span>{t.footerTap}</span>
      <span className="md:hidden"> · </span>
      <span>{t.footerLicense}</span>
    </footer>
  );
}
