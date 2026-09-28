// The demo store's catalogue. SAMPLE DATA: replace it with your own products
// (a table, a CMS, a JSON file). Nothing else hardcodes a product or a price.
//
// Prices are in major units per currency. The store sells in SAR by default;
// SAMPLE_CURRENCY=KWD switches every price to dinars, which is what KNET takes.

import type { Locale } from "@/lib/i18n";
import { toMinor } from "@/lib/money";

export type Category = "coffee" | "dates" | "incense" | "tools";

export type Product = {
  id: string;
  category: Category;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  price: { SAR: number; KWD: number };
};

export const PRODUCTS: Product[] = [
  {
    id: "khawlani-coffee",
    category: "coffee",
    name: { ar: "بن خولاني، 250 غ", en: "Khawlani coffee, 250 g" },
    description: {
      ar: "بن يمني بتحميص متوسط ونكهة الفواكه المجففة.",
      en: "Yemeni beans, medium roast, with a dried-fruit finish.",
    },
    price: { SAR: 65, KWD: 5.3 },
  },
  {
    id: "cardamom",
    category: "coffee",
    name: { ar: "هيل حب، 100 غ", en: "Whole cardamom, 100 g" },
    description: { ar: "هيل أخضر كامل لقهوة عربية.", en: "Whole green cardamom for Arabic coffee." },
    price: { SAR: 38, KWD: 3.1 },
  },
  {
    id: "saffron",
    category: "coffee",
    name: { ar: "زعفران، 1 غ", en: "Saffron, 1 g" },
    description: { ar: "خيوط زعفران لرشة في الدلة.", en: "Saffron threads for a pinch in the pot." },
    price: { SAR: 32, KWD: 2.6 },
  },
  {
    id: "sukkari-dates",
    category: "dates",
    name: { ar: "تمر سكري، 1 كغ", en: "Sukkari dates, 1 kg" },
    description: { ar: "تمر سكري طري من القصيم.", en: "Soft Sukkari dates from Qassim." },
    price: { SAR: 45, KWD: 3.7 },
  },
  {
    id: "ajwa-dates",
    category: "dates",
    name: { ar: "تمر عجوة، 500 غ", en: "Ajwa dates, 500 g" },
    description: { ar: "تمر عجوة داكن من المدينة.", en: "Dark Ajwa dates from Madinah." },
    price: { SAR: 55, KWD: 4.5 },
  },
  {
    id: "oud-incense",
    category: "incense",
    name: { ar: "بخور عود، 50 غ", en: "Oud incense, 50 g" },
    description: { ar: "قطع بخور عود للمبخرة.", en: "Oud chips for the burner." },
    price: { SAR: 120, KWD: 9.8 },
  },
  {
    id: "copper-dallah",
    category: "tools",
    name: { ar: "دلة نحاسية", en: "Copper dallah" },
    description: { ar: "دلة نحاسية لتقديم القهوة العربية.", en: "A copper pot for serving Arabic coffee." },
    price: { SAR: 180, KWD: 14.7 },
  },
  {
    id: "finjan-set",
    category: "tools",
    name: { ar: "فناجين قهوة، 6 قطع", en: "Coffee cups, set of 6" },
    description: { ar: "فناجين خزفية صغيرة للقهوة العربية.", en: "Small porcelain cups for Arabic coffee." },
    price: { SAR: 95, KWD: 7.75 },
  },
];

// SAR unless SAMPLE_CURRENCY=KWD.
export const STORE_CURRENCY: "SAR" | "KWD" = process.env.SAMPLE_CURRENCY === "KWD" ? "KWD" : "SAR";

export function getProduct(id: string | undefined | null): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

// A product's price in minor units, in the store's currency.
export function unitPrice(product: Product, currency: "SAR" | "KWD" = STORE_CURRENCY): number {
  return toMinor(product.price[currency], currency);
}
