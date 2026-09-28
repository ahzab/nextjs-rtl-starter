// The app can live under a path prefix (NEXT_PUBLIC_BASE_PATH, e.g. "/demo"),
// which Next.js adds to links, redirects and assets on its own but not to a
// plain fetch() or to the URLs we hand Tap. These two cover that.

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

// Browser side: an API route as the browser must request it.
export function apiPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

// Server side: the public address Tap sends the customer back to and posts the
// webhook to. APP_URL overrides the request's own origin (behind a tunnel, or a
// proxy such as a hosted demo) and includes any prefix; without it the prefix
// is added to the origin the request came in on.
export function appUrl(request: Request): string {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  return configured || `${new URL(request.url).origin}${BASE_PATH}`;
}
