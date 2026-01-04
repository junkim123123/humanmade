import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ytimg.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/reports/:reportId/v1",
        destination: "/reports/:reportId/v2",
        permanent: true,
      },
      {
        source: "/reports/:reportId",
        destination: "/reports/:reportId/v2",
        permanent: false, // Use temporary redirect to allow override by page.tsx
      },
    ];
  },
};

export default nextConfig;
