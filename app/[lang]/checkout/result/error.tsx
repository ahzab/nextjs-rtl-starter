"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { startTransition } from "react";

import { Alert } from "@/components/alert";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, hasLocale } from "@/lib/i18n";

// Tap didn't answer (timeout, outage). Nothing is marked paid on this path;
// retrying reloads the page, which asks Tap again.
export default function ResultError({ reset }: { error: Error; reset: () => void }) {
  const { lang: raw } = useParams<{ lang: string }>();
  const lang = hasLocale(raw) ? raw : "ar";
  const t = getDictionary(lang).result;
  const router = useRouter();
  // Refresh re-runs the server page (asking Tap again); reset clears the boundary.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });
  return (
    <main className="flex flex-1 flex-col items-start gap-4 px-5 py-10 md:px-20">
      <Alert kind="error" title={t.unreachable}>
        {t.unreachableBody}
      </Alert>
      <div className="flex gap-3">
        <button type="button" onClick={retry} className={buttonVariants()}>
          {t.checkAgain}
        </button>
        <Link href={`/${lang}`} className={buttonVariants({ variant: "outline" })}>
          {t.back}
        </Link>
      </div>
    </main>
  );
}
