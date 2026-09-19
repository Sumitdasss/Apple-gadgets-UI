import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.applegadgetsbd.com",
      },
      {
        protocol: "https",
        hostname: "adminapi.applegadgetsbd.com",
      },
    ],
  },
};

export default nextConfig;
