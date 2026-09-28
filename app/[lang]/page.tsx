import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary, hasLocale } from "@/lib/i18n";

// Placeholder home until the checkout slice (t4) lands.
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const other = lang === "ar" ? "en" : "ar";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <p className="w-fit rounded-md bg-accent px-3 py-1 text-sm text-accent-foreground">
        {t.home.productNote}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance">{t.home.title}</h1>
      <p className="text-lg text-muted-foreground">{t.home.subtitle}</p>
      <Link href={`/${other}`} className="w-fit text-primary underline underline-offset-4">
        {t.switchTo}
      </Link>
    </main>
  );
}
