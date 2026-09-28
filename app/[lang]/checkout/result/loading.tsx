"use client";

import { useParams } from "next/navigation";

import { Receipt } from "@/components/receipt";
import { hasLocale } from "@/lib/i18n";

// Shown while the result page retrieves the charge from Tap.
export default function Checking() {
  const { lang } = useParams<{ lang: string }>();
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-[440px]" aria-busy="true">
        <Receipt lang={hasLocale(lang) ? lang : "ar"} state="verifying" currency="SAR" items={[]} />
      </div>
    </main>
  );
}
