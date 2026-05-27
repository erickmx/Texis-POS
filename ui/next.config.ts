import type { NextConfig } from "next";

const isTauriBuild = process.env.TAURI_BUILD === "true";

const nextConfig: NextConfig = {
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
