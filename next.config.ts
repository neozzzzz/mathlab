import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/v2/:path*",
        destination: "/:path*",
      },
      {
        source: "/v2",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
