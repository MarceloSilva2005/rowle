import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Pacotes do monorepo publicados como TypeScript.
  transpilePackages: ["@rowle/core", "@rowle/design"],
};

export default nextConfig;
