import type { NextConfig } from "next";

// Both are empty for a normal install. A hosted demo sets them:
// NEXT_PUBLIC_BASE_PATH serves the whole app under a prefix ("/demo"), and
// SERVER_ACTIONS_ALLOWED_ORIGINS lets the Pay now action accept posts that
// arrive through another domain's rewrite (comma-separated hosts).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") || undefined;
const allowedOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  basePath,
  ...(allowedOrigins.length ? { experimental: { serverActions: { allowedOrigins } } } : {}),
};

export default nextConfig;
