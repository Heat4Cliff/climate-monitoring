import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Tailscale IP for Next.js hot-reloading
  // @ts-ignore
  allowedDevOrigins: ['100.75.253.114'],
};

export default nextConfig;
