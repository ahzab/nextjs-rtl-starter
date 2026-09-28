// The one product in the demo. Edit it here; nothing else hardcodes it.
// SAMPLE_CURRENCY=KWD prices it in dinars, which is what KNET takes.
export const SAMPLE_ORDER = {
  amount: 10,
  currency: process.env.SAMPLE_CURRENCY === "KWD" ? "KWD" : "SAR",
};
