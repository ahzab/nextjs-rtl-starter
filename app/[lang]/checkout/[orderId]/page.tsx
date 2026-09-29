import { Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/alert";
import { BackLink } from "@/components/back-link";
import { Heading } from "@/components/heading";
import { StorePage } from "@/components/store-page";
import { PaymentMethods, type MethodState } from "@/components/payment-methods";
import { TapCardField } from "@/components/tap-card-field";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { enabledMethods, methodCurrency, takesCurrency } from "@/lib/methods";
import { formatMinor, toTapAmount } from "@/lib/money";
import { orderItems } from "@/lib/order-items";
import { canPay, getOrder } from "@/lib/orders";
import { isTestMode } from "@/lib/tap";

// Screen 2: order summary and Tap's card field.
export default async function CheckoutPage({ params }: PageProps<"/[lang]/checkout/[orderId]">) {
  const { lang, orderId } = await params;
  if (!hasLocale(lang)) notFound();
  const order = await getOrder(orderId);
  if (!order) notFound();
  const t = getDictionary(lang);
  const total = formatMinor(order.amount, order.currency, lang);
  const publicKey = process.env.NEXT_PUBLIC_TAP_PUBLIC_KEY;

  const back = <BackLink href={`/${lang}`} label={t.checkout.back} className="-my-2" />;

  const summary = (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-[18px] py-4">
      <div className="text-[13px] text-muted-foreground">{t.checkout.summary}</div>
      {orderItems(order, lang).map((item) => (
        <div key={item.label} className="flex justify-between gap-3 text-[15px]">
          <span>{item.label}</span>
          <span className="tabular whitespace-nowrap">{formatMinor(item.amount, order.currency, lang)}</span>
        </div>
      ))}
      <div className="border-t border-border" />
      <div className="flex justify-between text-[17px] font-semibold">
        <span>{t.checkout.total}</span>
        <span className="tabular">{total}</span>
      </div>
    </div>
  );

  const note = (
    <div className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
      <Lock className="mt-[3px] size-4 shrink-0 text-primary" aria-hidden />
      <span>{t.checkout.cardNote}</span>
    </div>
  );

  let field;
  if (!canPay(order)) {
    field = (
      <Alert
        kind="info"
        title={t.checkout.notPending}
        action={
          order.chargeId ? (
            <Link
              href={`/${lang}/checkout/result?tap_id=${encodeURIComponent(order.chargeId)}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t.checkout.notPendingAction}
            </Link>
          ) : undefined
        }
      />
    );
  } else if (!publicKey) {
    field = <Alert kind="error" title={t.checkout.missingKey} />;
  } else {
    const methods: MethodState[] = enabledMethods().map((method) =>
      takesCurrency(method, order.currency)
        ? { method, status: "ok" }
        : { method, status: "wrong_currency", currency: methodCurrency(method) },
    );
    field = (
      <TapCardField
        before={
          <PaymentMethods
            lang={lang}
            orderId={order.id}
            amount={toTapAmount(order.amount, order.currency)}
            currency={order.currency}
            publicKey={publicKey}
            merchantId={process.env.TAP_MERCHANT_ID}
            testMode={isTestMode()}
            methods={methods}
            labels={t.methods}
          />
        }
        lang={lang}
        publicKey={publicKey}
        merchantId={process.env.TAP_MERCHANT_ID}
        orderId={order.id}
        amount={toTapAmount(order.amount, order.currency)}
        currency={order.currency}
        labels={{
          pay: `${t.checkout.pay} ${total}`,
          paying: t.checkout.paying,
          formLabel: t.checkout.formLabel,
          loadFailed: t.checkout.loadFailed,
          cardInvalid: t.checkout.cardInvalid,
          chargeFailed: t.checkout.chargeFailed,
        }}
      />
    );
  }

  return (
    <StorePage lang={lang} banner={t.site.testModeCheckout}>
      <div className="flex flex-col gap-5 md:grid md:grid-cols-[1fr_1.1fr] md:items-start md:gap-14">
        <div className="flex flex-col gap-5 md:gap-[18px]">
          {back}
          <Heading text={t.checkout.title} />
          {summary}
          <div className="hidden md:block">{note}</div>
        </div>
        {field}
        <div className="md:hidden">{note}</div>
      </div>
    </StorePage>
  );
}
