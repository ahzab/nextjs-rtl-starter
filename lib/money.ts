// Moyasar takes amounts in the currency's smallest unit: 10 SAR is 1000
// halalas, 10 KWD is 10000 fils. Intl knows each currency's minor digits,
// so nothing here hardcodes them.

export function minorDigits(currency: string): number {
  return (
    new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

export function toMinor(amount: number, currency: string): number {
  return Math.round(amount * 10 ** minorDigits(currency));
}

export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** minorDigits(currency);
}

export function formatMinor(minor: number, currency: string, locale: string): string {
  // Western digits in both languages: every priced Arabic site checked uses
  // them, and plain "ar-SA" would switch to Arabic-Indic numerals.
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA", {
    style: "currency",
    currency,
  }).format(fromMinor(minor, currency));
}
