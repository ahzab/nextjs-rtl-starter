import { NextResponse, type NextRequest } from "next/server";

import { pickLocale } from "@/lib/locale";

// "/" goes to /ar or /en by the browser's Accept-Language; Arabic when unsure.
export function proxy(request: NextRequest) {
  const lang = pickLocale(request.headers.get("accept-language"));
  return NextResponse.redirect(new URL(`/${lang}`, request.url), 307);
}

export const config = { matcher: "/" };
