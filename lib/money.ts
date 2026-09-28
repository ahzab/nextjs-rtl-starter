// Two units, kept apart on purpose. Orders store MINOR units (10 SAR is 1000
// halalas, 10 KWD is 10000 fils) so sums stay integers. Tap's API and card
// field take MAJOR units (1.00 SAR, not 100), as a decimal. Intl knows each
// currency's minor digits, so nothing here hardcodes them.

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

// What Tap is sent: major units, rounded to the currency's digits so a float
// like 0.1 + 0.2 never reaches the API.
export function toTapAmount(minor: number, currency: string): number {
  const digits = minorDigits(currency);
  return Number(fromMinor(minor, currency).toFixed(digits));
}

// What Tap returns (49.5, 0.318) back in minor units, for comparing with an order.
export function fromTapAmount(amount: number, currency: string): number {
  return toMinor(amount, currency);
}

// "10.00 ر.س" in Arabic and "SAR 10.00" in English. Western digits in both:
// every priced Arabic site checked uses them, and plain "ar-SA" would switch
// to Arabic-Indic numerals. Intl writes the symbol "ر.س." with a closing dot;
// the design drops it.
export function formatMinor(minor: number, currency: string, locale: string): string {
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA", {
    style: "currency",
    currency,
  });
  return formatter
    .formatToParts(fromMinor(minor, currency))
    .map((part) => (part.type === "currency" ? part.value.replace(/\.$/, "") : part.value))
    .join("");
}
