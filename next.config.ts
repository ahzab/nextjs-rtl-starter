import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Arabic is the default locale; every page lives under /ar or /en.
  async redirects() {
    return [{ source: "/", destination: "/ar", permanent: false }];
  },
};

export default nextConfig;
