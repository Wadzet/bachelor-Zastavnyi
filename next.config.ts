import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the local-network IP so LAN devices (phones, tablets) can load
  // the dev server without Next.js blocking RSC/inline-script responses.
  allowedDevOrigins: [
    "192.168.1.147",
  ],
};

export default nextConfig;
