import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "127.0.0.1.nip.io", // Telegram widget (run http://localhost:80)
    "auth.medincident.dreyn-drafts.ru",
    "id-medincident.ulbwa.bombomeow.ru",
    "zitadel-medincident.ulbwa.bombomeow.ru",
  ],

  experimental: {
    turbopackFileSystemCacheForDev: true,
    authInterrupts: true,
  },

  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;
