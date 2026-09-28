"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Alert } from "@/components/alert";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/lib/app-url";
import type { Locale } from "@/lib/i18n";
import type { TapToken } from "@/types/tap-card-sdk";

// Tap's Card SDK v2, pinned. No SRI hash: Tap's CDN sends no CORS header, so a
// browser would refuse an integrity-checked copy. Check for a newer version at
// https://developers.tap.company/docs/card-sdk-web-v2 before bumping.
const SDK_URL = "https://tap-sdks.b-cdn.net/card/1.0.2/index.js";
const ELEMENT_ID = "tap-card-field";

type Props = {
  lang: Locale;
  publicKey: string;
  merchantId?: string;
  orderId: string;
  amount: number; // major units, what Tap's field expects
  currency: string;
  labels: { pay: string; paying: string; formLabel: string; loadFailed: string; cardInvalid: string; chargeFailed: string };
  // Other ways to pay, drawn above the card inputs (Apple Pay, STC Pay, KNET).
  before?: ReactNode;
};

type Phase = "loading" | "ready" | "tokenizing" | "charging" | "redirecting";

// Tap draws the card inputs inside its own frame; the pay button under them is
// ours. The card never reaches our server: Tap turns it into a token, our
// server creates the charge from the token, and Tap sends the customer through
// 3-D Secure and back to the result page.
export function TapCardField({ lang, publicKey, merchantId, orderId, amount, currency, labels, before }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const busy = useRef(false);

  const onToken = useCallback(
    async (token: TapToken) => {
      setPhase("charging");
      try {
        const res = await fetch(apiPath("/api/charges"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, token: token.id, lang }),
        });
        const body = (await res.json().catch(() => ({}))) as { url?: string };
        if (!res.ok || !body.url) throw new Error("charge failed");
        setPhase("redirecting");
        window.location.assign(body.url);
      } catch {
        busy.current = false;
        setPhase("ready");
        setError(labels.chargeFailed);
      }
    },
    [orderId, lang, labels.chargeFailed],
  );

  // Tap's callbacks are captured once at render time; route them through a ref
  // so they always see the latest handler.
  const handlers = useRef({ onToken, labels });
  useEffect(() => {
    handlers.current = { onToken, labels };
  });

  useEffect(() => {
    const sdk = window.CardSDK;
    if (!sdkLoaded || !sdk) return;
    const { renderTapCard, Theme, Direction, Edges, Locale } = sdk;
    const dark = document.documentElement.classList.contains("dark");
    const { unmount } = renderTapCard(ELEMENT_ID, {
      publicKey,
      ...(merchantId ? { merchant: { id: merchantId } } : {}),
      transaction: { amount, currency },
      acceptance: { supportedBrands: ["MADA", "VISA", "MASTERCARD"], supportedCards: "ALL" },
      fields: { cardHolder: true },
      addons: { displayPaymentBrands: true, loader: true, saveCard: false },
      interface: {
        locale: lang === "ar" ? Locale.AR : Locale.EN,
        direction: lang === "ar" ? Direction.RTL : Direction.LTR,
        theme: dark ? Theme.DARK : Theme.LIGHT,
        edges: Edges.CURVED,
      },
      onReady: () => setPhase((p) => (p === "loading" ? "ready" : p)),
      onSuccess: (token) => void handlers.current.onToken(token),
      onError: () => {
        busy.current = false;
        setPhase("ready");
        setError(handlers.current.labels.cardInvalid);
      },
    });
    return () => unmount();
  }, [sdkLoaded, publicKey, merchantId, amount, currency, lang]);

  const pay = () => {
    if (busy.current || phase !== "ready") return;
    busy.current = true;
    setError(null);
    setPhase("tokenizing");
    window.CardSDK?.tokenize();
  };

  const working = phase === "tokenizing" || phase === "charging" || phase === "redirecting";

  return (
    <section aria-label={labels.formLabel} className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[18px]">
      <Script
        src={SDK_URL}
        strategy="afterInteractive"
        onReady={() => setSdkLoaded(true)}
        onError={() => setError(labels.loadFailed)}
      />
      {before}
      <div id={ELEMENT_ID} className="min-h-[180px]" />
      {error ? <Alert kind="error" title={error} /> : null}
      <Button className="h-[50px] w-full" onClick={pay} disabled={phase === "loading" || working} aria-busy={working}>
        {working ? <Spinner /> : null}
        {working ? labels.paying : labels.pay}
      </Button>
    </section>
  );
}
