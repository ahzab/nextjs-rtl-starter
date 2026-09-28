import { notFound } from "next/navigation";

// Any path under /ar or /en that no route matches lands on [lang]/not-found,
// inside the locale layout, instead of Next's unstyled English default.
export default function Missing() {
  notFound();
}
