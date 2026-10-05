import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/login",
        destination: "/admin/login",
      },
      {
        source: "/register",
        destination: "/admin/register",
      },
      {
        source: "/dashboard",
        destination: "/admin/dashboard",
      },
      {
        source: "/register-internship",
        destination: "/apply",
      },
    ];
  },
};

export default nextConfig;
