import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/alert";
import { Heading, Lead } from "@/components/heading";
import { Receipt } from "@/components/receipt";
import { StorePage } from "@/components/store-page";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { getOrder } from "@/lib/orders";
import { confirmCharge } from "@/lib/payments";
import type { Charge } from "@/lib/tap";
import { cn } from "@/lib/utils";

// "mada •••• 1234": the card's brand and last four, as Tap reports them.
function paidWith(charge: Charge, lang: Locale): string | undefined {
  const brand = charge.card?.brand ?? charge.source?.payment_method;
  if (!brand) return undefined;
  const name = brand === "MADA" ? (lang === "ar" ? "مدى" : "mada") : brand.charAt(0) + brand.slice(1).toLowerCase();
  return charge.card?.last_four ? `${name} •••• ${charge.card.last_four}` : name;
}

function paidAt(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

// Screens 3 and 4. Tap sends the customer here with ?tap_id=chg_… after
// 3-D Secure. Nothing in the URL is trusted: the charge is retrieved from Tap
// and checked against the order before anything is shown as paid. Reloading
// runs the same check and changes nothing.
export default async function ResultPage({ params, searchParams }: PageProps<"/[lang]/checkout/result">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const { tap_id } = await searchParams;
  const chargeId = typeof tap_id === "string" ? tap_id : "";

  const grid = (left: React.ReactNode, receipt: React.ReactNode, actions: React.ReactNode) => (
    <StorePage lang={lang} banner={t.site.testModeShort}>
      <div className="flex flex-1 flex-col gap-5 md:grid md:grid-cols-[1.1fr_1fr] md:items-center md:gap-20">
        <div className="flex flex-col gap-2 md:gap-[18px]">
          {left}
          <div className="hidden md:flex">{actions}</div>
        </div>
        {receipt ? <div className="md:max-w-[440px]">{receipt}</div> : null}
        <div className="md:hidden">{actions}</div>
      </div>
    </StorePage>
  );

  const home = (variant: "outline" | "default", label: string) => (
    <Link href={`/${lang}`} className={cn(buttonVariants({ variant }), "w-full md:w-auto")}>
      {label}
    </Link>
  );

  if (!chargeId.startsWith("chg_")) {
    return grid(
      <>
        <Heading text={t.result.missing} className="md:text-[44px]" />
        <Lead>{t.result.missingBody}</Lead>
      </>,
      null,
      home("outline", t.result.back),
    );
  }

  const result = await confirmCharge(chargeId);

  if (result.ok) {
    const { order, charge } = result;
    return grid(
      <>
        <Heading text={t.result.paid} className="text-[30px] md:text-[44px]" />
        <Lead>{t.result.paidBody}</Lead>
      </>,
      <Receipt
        lang={lang}
        state="paid"
        currency={order.currency}
        items={[{ label: order.description, amount: order.amount }]}
        orderId={order.id}
        tapStatus={charge.status}
        paidWith={paidWith(charge, lang)}
        note={order.paidAt ? `${t.receipt.paidAt}: ${paidAt(order.paidAt, lang)}` : undefined}
      />,
      home("outline", t.result.backToStore),
    );
  }

  const { charge, reason } = result;
  // Only our own order gets a receipt. A charge for someone else's order, or
  // one we can't find, shows the reason and nothing from Tap's record.
  const order = reason === "no_order" || reason === "not_found" ? null : getOrder(charge?.reference?.order);
  // The bank's words only mean something when the charge itself didn't go through.
  const settled = charge && !["INITIATED", "IN_PROGRESS"].includes(charge.status);
  const bank = reason === "not_captured" && settled ? charge.response?.message : undefined;
  const retryOrder = order?.status === "pending" ? order.id : null;
  return grid(
    <>
      <Heading text={t.result.failed} className="text-[30px] md:text-[44px]" />
      <Lead>{t.result.failedBody}</Lead>
      <Alert kind="error" title={t.result.reasons[reason]}>
        {bank ? `${t.result.bankMessage}: ${bank}` : null}
      </Alert>
    </>,
    order ? (
      <Receipt
        lang={lang}
        state="failed"
        currency={order.currency}
        items={[{ label: order.description, amount: order.amount }]}
        orderId={order.id}
        tapStatus={charge?.status}
      />
    ) : null,
    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
      {retryOrder ? (
        <Link href={`/${lang}/checkout/${retryOrder}`} className={cn(buttonVariants(), "w-full md:w-auto")}>
          {t.result.retry}
        </Link>
      ) : null}
      {home("outline", t.result.back)}
    </div>,
  );
}
