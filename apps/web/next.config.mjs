import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

// Keep builds and E2E assets separate from a user's running development server.
export default function config(phase) {
  const configuredApiBase =
    process.env.NEXT_PUBLIC_E2E_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    `http://127.0.0.1:${process.env.API_PORT ?? "3001"}/api`;
  const apiOrigin =
    process.env.BUDGETMAP_API_PROXY_TARGET ??
    configuredApiBase.replace(/\/api\/?$/, "");

  return {
    devIndicators: false,
    distDir:
      process.env.BUDGETMAP_NEXT_DIST ??
      (process.env.VERCEL === "1"
        ? ".next"
        : phase === PHASE_DEVELOPMENT_SERVER
          ? ".next"
          : ".next-build"),
    async rewrites() {
      return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
    },
  };
}
