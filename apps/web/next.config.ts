import type { NextConfig } from "next";

/*
 * Two build modes:
 * - default        → output: "standalone" (local/server)
 * - STATIC_EXPORT=1 → output: "export" (static site for GitHub Pages),
 *   with optional BASE_PATH (e.g. "/waslfy") set by the deploy workflow.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? { output: "export" as const, images: { unoptimized: true } }
    : { output: "standalone" as const }),
  ...(basePath ? { basePath } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
