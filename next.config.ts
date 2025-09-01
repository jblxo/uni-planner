import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"]
  },
  webpack: (config) => {
    config.externals.push("better-sqlite3");
    return config;
  }
};

export default nextConfig;
