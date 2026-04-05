import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js/Turbopack from trying to bundle native Node modules used by Remotion
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer"],
  outputFileTracingIncludes: {
    "/api/render-mp4": [
      "./src/**/*",
      "./postcss.config.mjs",
      "./tsconfig.json",
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/shop",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
