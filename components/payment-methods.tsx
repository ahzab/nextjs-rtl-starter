"use client";

import dynamic from "next/dynamic";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";

import { Alert } from "@/components/alert";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { apiPath } from "@/lib/app-url";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Method } from "@/lib/methods";
import { minorDigits } from "@/lib/money";

// Tap's Apple Pay button touches window on import, so it loads in the browser only.
const ApplePayButton = dynamic(() => import("@tap-payments/apple-pay-button").then((m) => m.ApplePayButton), {
  ssr: false,
});

export type MethodState = { method: Method; status: "ok" | "wrong_currency"; currency?: string };

type Props = {
  lang: Locale;
  orderId: string;
  amount: number; // major units
  currency: string;
  publicKey: string;
  merchantId?: string;
  testMode: boolean;
  methods: MethodState[];
  labels: Dictionary["methods"];
};

const NAMES: Record<Method, string> = { applepay: "Apple Pay", stcpay: "STC Pay", knet: "KNET" };
const FLAGS: Record<Method, string> = {
  applepay: "NEXT_PUBLIC_TAP_APPLE_PAY=1",
  stcpay: "NEXT_PUBLIC_TAP_STC_PAY=1",
  knet: "NEXT_PUBLIC_TAP_KNET=1",
};

const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? key);

// POSTs to /api/charges and follows the answer: a page to send the customer
// to, or (STC Pay) a charge waiting for the texted code.
async function startCharge(payload: Record<string, unknown>): Promise<{ url?: string; otp?: boolean; chargeId?: string; error?: string }> {
  const res = await fetch(apiPath("/api/charges"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; otp?: boolean; chargeId?: string; error?: string };
  return res.ok ? body : { error: body.error ?? "tap_error" };
}

// Apple Pay exists only in Safari on Apple devices. Read once in the browser;
// null on the server, so the first render matches.
const noop = () => () => {};
function useApplePayAvailable(): boolean | null {
  return useSyncExternalStore(
    noop,
    () => {
      const session = (window as { ApplePaySession?: { canMakePayments?: () => boolean } }).ApplePaySession;
      try {
        return Boolean(session?.canMakePayments?.());
      } catch {
        return false;
      }
    },
    () => null,
  );
}

function DevNote({ title, flag, children }: { title: string; flag: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-dashed border-primary px-3.5 py-3 text-[13px] leading-relaxed">
      <strong className="font-semibold">{title}</strong>
      <span>
        {children} <code dir="ltr" className="font-mono">{flag}</code>
      </span>
    </div>
  );
}

// Everything above "or pay by card": one button per method that is switched
// on, or a plain reason where a switched-on method can't be used here. The
// card field below always renders, so a customer is never left without a way to pay.
export function PaymentMethods({ lang, orderId, amount, currency, publicKey, merchantId, testMode, methods, labels }: Props) {
  const applePay = useApplePayAvailable();
  const [off, setOff] = useState<Method[]>([]);
  const [busy, setBusy] = useState<Method | null>(null);
  // The error sits next to the method it is about.
  const [error, setError] = useState<{ method: Method; text: string } | null>(null);
  const [stc, setStc] = useState<{ step: "closed" | "phone" | "otp"; chargeId?: string }>({ step: "closed" });
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const phoneId = useId();
  const otpId = useId();

  if (methods.length === 0) return null;

  const go = (url: string) => {
    window.location.assign(url);
  };

  const fail = (method: Method, code?: string) => {
    setBusy(null);
    if (code === "method_not_enabled") setOff((m) => [...m, method]);
    else if (code === "invalid_phone") setError({ method, text: labels.invalidPhone });
    else if (code === "invalid_otp" || code === "otp_failed") setError({ method, text: labels.invalidOtp });
    else setError({ method, text: labels.failed });
  };

  const pay = async (method: Method, extra: Record<string, unknown> = {}) => {
    setError(null);
    setBusy(method);
    try {
      const res = await startCharge({ orderId, lang, method, ...extra });
      if (res.url) return go(res.url);
      if (res.otp && res.chargeId) {
        setBusy(null);
        setStc({ step: "otp", chargeId: res.chargeId });
        return;
      }
      fail(method, res.error);
    } catch {
      fail(method);
    }
  };

  const confirmOtp = async () => {
    if (!stc.chargeId) return;
    setError(null);
    setBusy("stcpay");
    try {
      const res = await fetch(apiPath(`/api/charges/${encodeURIComponent(stc.chargeId)}/otp`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, otp, lang }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && body.url) return go(body.url);
      fail("stcpay", body.error);
    } catch {
      fail("stcpay");
    }
  };

  const unavailable = (method: Method, title: string, body: string, dev: ReactNode) => (
    <div key={method} className="flex flex-col gap-2">
      <Alert kind="info" title={title}>
        {body}
      </Alert>
      {testMode ? (
        <DevNote title={labels.forDeveloper} flag={FLAGS[method]}>
          {dev}
        </DevNote>
      ) : null}
    </div>
  );

  const outline = (method: Method, onClick: () => void) => (
    <Button
      key={method}
      type="button"
      variant="outline"
      className="h-12 w-full text-[15px] font-semibold"
      onClick={onClick}
      disabled={busy !== null}
      aria-busy={busy === method}
    >
      {busy === method ? <Spinner /> : null}
      {busy === method ? labels.working : NAMES[method]}
    </Button>
  );

  const items = methods.map(({ method, status, currency: wants }) => {
    const name = NAMES[method];
    if (status === "wrong_currency" && wants) {
      const names = labels.currencies;
      return unavailable(
        method,
        fill(labels.unavailable, { method: name }),
        fill(labels.wrongCurrency, { method: name, currency: names[wants] ?? wants, orderCurrency: names[currency] ?? currency }),
        fill(labels.wrongCurrencyDev, { currency: wants }),
      );
    }
    if (off.includes(method)) {
      return unavailable(method, fill(labels.notEnabled, { method: name }), labels.notEnabledBody, labels.notEnabledDev);
    }

    if (method === "applepay") {
      if (applePay === null) return <div key={method} className="h-12" aria-hidden />;
      if (!applePay || !merchantId) {
        return unavailable(method, fill(labels.unavailable, { method: name }), labels.applePayBrowser, labels.applePayDev);
      }
      return (
        <ApplePayButton
          key={method}
          publicKey={publicKey}
          environment="production"
          merchant={{ id: merchantId, domain: window.location.hostname }}
          transaction={{ amount: amount.toFixed(minorDigits(currency)), currency }}
          acceptance={{ supportedBrands: ["mada", "masterCard", "visa"] }}
          features={{}}
          scope="TapToken"
          interface={{ locale: lang, theme: "dark", type: "buy", edges: "curved" }}
          onSuccess={async (data) => {
            const token = typeof data?.id === "string" ? data.id : "";
            const res = await startCharge({ orderId, lang, method: "applepay", token });
            if (res.url) go(res.url);
            else setError({ method: "applepay", text: labels.applePayFailed });
          }}
          onError={() => setError({ method: "applepay", text: labels.applePayFailed })}
        />
      );
    }

    if (method === "knet") return outline("knet", () => void pay("knet"));

    // STC Pay: the button opens a number field, then a code field.
    if (stc.step === "closed") return outline("stcpay", () => setStc({ step: "phone" }));
    const otpStep = stc.step === "otp";
    return (
      <form
        key={method}
        className="flex flex-col gap-2.5 rounded-[10px] border border-border p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (otpStep) void confirmOtp();
          else void pay("stcpay", { phone });
        }}
      >
        <strong className="text-[15px] font-semibold">{name}</strong>
        <label htmlFor={otpStep ? otpId : phoneId} className="text-sm font-medium">
          {otpStep ? labels.stcOtp : labels.stcPhone}
        </label>
        <input
          id={otpStep ? otpId : phoneId}
          key={otpStep ? "otp" : "phone"}
          dir="ltr"
          inputMode="numeric"
          autoComplete={otpStep ? "one-time-code" : "tel-national"}
          placeholder={otpStep ? "123456" : "05XXXXXXXX"}
          value={otpStep ? otp : phone}
          onChange={(e) => (otpStep ? setOtp(e.target.value) : setPhone(e.target.value))}
          className="h-[46px] rounded-lg border border-input bg-card px-3 text-start text-[15px] tabular-nums"
          autoFocus
        />
        <span className="text-[13px] text-muted-foreground">{otpStep ? labels.stcOtpHint : labels.stcPhoneHint}</span>
        {error?.method === "stcpay" ? <Alert kind="error" title={error.text} /> : null}
        <Button type="submit" className="h-12 w-full" disabled={busy !== null} aria-busy={busy === "stcpay"}>
          {busy === "stcpay" ? <Spinner /> : null}
          {otpStep ? labels.stcConfirm : labels.stcSend}
        </Button>
      </form>
    );
  });

  return (
    <>
      {items}
      {error && error.method !== "stcpay" ? <Alert kind="error" title={error.text} /> : null}
      <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
        <div className="grow border-t border-border" />
        {labels.orPayByCard}
        <div className="grow border-t border-border" />
      </div>
    </>
  );
}
