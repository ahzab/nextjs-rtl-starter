import { Spinner } from "@/components/spinner";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatMinor } from "@/lib/money";
import { cn } from "@/lib/utils";

type Item = { label: string; amount: number }; // minor units

type Props = {
  lang: Locale;
  state: "waiting" | "verifying" | "paid" | "failed";
  currency: string;
  items: Item[];
  orderId?: string;
  note?: string;
  // paid and failed: what Tap said
  tapStatus?: string;
  paidWith?: string;
};

// Shortens a uuid to its ends: a3f9…c21e.
const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id);

// The receipt: dashed while it waits or fails, solid with the paid stamp once
// Tap confirmed it, with a torn bottom edge in every state.
export function Receipt({ lang, state, currency, items, orderId, note, tapStatus, paidWith }: Props) {
  const t = getDictionary(lang).receipt;
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const top = { waiting: t.waiting, verifying: t.verifying, paid: t.order, failed: t.failed }[state];
  const money = (minor: number) => formatMinor(minor, currency, lang);

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "relative flex flex-col gap-3 rounded-t-xl border border-b-0 bg-card p-5 md:gap-3.5 md:p-7",
          state === "paid" ? "border-solid border-border" : "border-dashed border-(--dashed)",
        )}
      >
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{top}</span>
          {orderId ? (
            <span dir="ltr" className="font-mono">
              {shortId(orderId)}
            </span>
          ) : null}
        </div>
        {items.length ? (
          <>
            {items.map((item) => (
              <div key={item.label} className="flex justify-between gap-3 text-base md:text-lg">
                <span>{item.label}</span>
                <span className="tabular whitespace-nowrap">{money(item.amount)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-input" />
            <div className="flex justify-between text-lg font-semibold md:text-[22px]">
              <span>{t.total}</span>
              <span className="tabular whitespace-nowrap">{money(total)}</span>
            </div>
          </>
        ) : null}

        {state === "paid" ? (
          <>
            <div className="border-t border-dashed border-input" />
            {paidWith ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t.paidWith}</span>
                <span dir="auto">{paidWith}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.tapStatus}</span>
              <span className="font-mono text-primary">{tapStatus}</span>
            </div>
            <div
              aria-hidden
              className="stamp absolute start-[42%] top-[58px] rounded-lg border-2 border-primary bg-card px-3 py-1 text-lg font-semibold text-primary md:top-[66px]"
            >
              {t.paid}
            </div>
          </>
        ) : null}

        {state === "failed" && tapStatus ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.tapStatus}</span>
            <span className="font-mono">{tapStatus}</span>
          </div>
        ) : null}

        {state === "verifying" ? (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Spinner className="text-primary" />
            <span>{t.waitingForTap}</span>
          </div>
        ) : null}

        {note ? <div className="text-[13px] text-muted-foreground">{note}</div> : null}
      </div>
      <div className="receipt-edge" />
    </div>
  );
}
