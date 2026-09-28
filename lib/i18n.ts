export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

const ar = {
  meta: { title: "الدفع عبر ميسر في Next.js" },
  home: {
    title: "مثال الدفع عبر ميسر",
    subtitle: "مدى وApple Pay وSTC Pay وVisa وMastercard في تطبيق Next.js.",
    product: "طلب تجريبي",
    productNote: "مبلغ تجريبي في وضع الاختبار. لن يُخصم أي مبلغ حقيقي.",
    pay: "ادفع الآن",
  },
  checkout: {
    title: "إتمام الدفع",
    summary: "ملخص الطلب",
    total: "الإجمالي",
    order: "رقم الطلب",
    testMode: "وضع الاختبار: استخدم بطاقات ميسر التجريبية.",
    missingKey: "أضف NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY إلى ملف ‎.env.local لعرض نموذج الدفع.",
    notPending: "هذا الطلب لم يعد بانتظار الدفع.",
  },
  result: {
    paid: "تم الدفع بنجاح",
    paidBody: "تحققنا من الدفع لدى ميسر وحدّثنا الطلب.",
    failed: "لم يكتمل الدفع",
    failedBody: "لم يُخصم أي مبلغ. يمكنك المحاولة مرة أخرى.",
    missing: "لا يوجد دفع للتحقق منه",
    reasons: {
      not_found: "لم نجد هذا الدفع لدى ميسر.",
      no_order: "هذا الدفع لا يطابق أي طلب لدينا.",
      not_paid: "حالة الدفع لدى ميسر ليست مدفوعة.",
      amount_mismatch: "المبلغ المدفوع لا يطابق مبلغ الطلب.",
      currency_mismatch: "عملة الدفع لا تطابق عملة الطلب.",
    },
    status: "حالة ميسر",
    back: "العودة",
    retry: "حاول مرة أخرى",
  },
  switchTo: "English",
};

const en: typeof ar = {
  meta: { title: "Moyasar payments in Next.js" },
  home: {
    title: "Moyasar checkout example",
    subtitle: "mada, Apple Pay, STC Pay, Visa and Mastercard in a Next.js app.",
    product: "Sample order",
    productNote: "A test amount in sandbox mode. No real money moves.",
    pay: "Pay now",
  },
  checkout: {
    title: "Checkout",
    summary: "Order summary",
    total: "Total",
    order: "Order",
    testMode: "Test mode: use Moyasar's test cards.",
    missingKey: "Add NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY to .env.local to show the payment form.",
    notPending: "This order is no longer waiting for payment.",
  },
  result: {
    paid: "Payment received",
    paidBody: "We checked the payment with Moyasar and updated the order.",
    failed: "Payment didn't go through",
    failedBody: "Nothing was charged. You can try again.",
    missing: "No payment to check",
    reasons: {
      not_found: "Moyasar has no payment with this id.",
      no_order: "This payment doesn't match any of our orders.",
      not_paid: "Moyasar doesn't show this payment as paid.",
      amount_mismatch: "The amount paid doesn't match the order.",
      currency_mismatch: "The payment currency doesn't match the order.",
    },
    status: "Moyasar status",
    back: "Back",
    retry: "Try again",
  },
  switchTo: "العربية",
};

export type Dictionary = typeof ar;
export const getDictionary = (locale: Locale): Dictionary => (locale === "ar" ? ar : en);
