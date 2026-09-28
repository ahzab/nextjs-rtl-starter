import { defaultLocale, hasLocale, type Locale } from "./i18n";

// Picks ar or en from an Accept-Language header, honouring q-values.
// "en-GB,en;q=0.9,ar;q=0.8" gives en; anything unknown gives the default (ar).
export function pickLocale(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;
  const ranked = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, i };
    })
    .filter((x) => x.lang && !Number.isNaN(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  const match = ranked.find((x) => hasLocale(x.lang));
  return match && hasLocale(match.lang) ? match.lang : defaultLocale;
}
