import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // The sample covers and uploaded ones (app/uploads/[file]/route.ts) go through the optimiser.
    localPatterns: [
      { pathname: "/covers/**", search: "" },
      { pathname: "/uploads/**", search: "" },
    ],
    // Cover file names change with the photo, so resized copies can be kept a month.
    minimumCacheTTL: 2678400,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
