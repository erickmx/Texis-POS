import type { NextConfig } from "next";
import path from "path";

const isTauriBuild = process.env.TAURI_BUILD === "true";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to ui/ so a tooling package.json at the
  // monorepo root cannot hijack module resolution (tailwindcss resolve error).
  turbopack: {
    root: path.resolve(__dirname),
  },
  ...(isTauriBuild ? {
    output: "export",
    images: {
      unoptimized: true,
    },
  } : {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8080/api/:path*',
        },
      ];
    },
  }),
};

export default nextConfig;
