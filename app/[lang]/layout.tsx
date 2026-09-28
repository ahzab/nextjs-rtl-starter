import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";

import { DirectionProvider } from "@/components/ui/direction";
import { dirOf, getDictionary, hasLocale, locales } from "@/lib/i18n";

import "../globals.css";

// One face for Arabic and Latin so both scripts share a rhythm.
const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
});

// Code, keys and order ids only.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).meta.title };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dir = dirOf(lang);

  return (
    <html lang={lang} dir={dir} className={`${plex.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <DirectionProvider direction={dir}>{children}</DirectionProvider>
      </body>
    </html>
  );
}
