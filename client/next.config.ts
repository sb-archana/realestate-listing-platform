import path from "node:path";
import type { NextConfig } from "next";

const apiHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").hostname;
  } catch {
    return "localhost";
  }
})();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: apiHost, port: "4000", pathname: "/uploads/**" },
    ],
    // The API runs on localhost in dev, which Next.js blocks by default as
    // an SSRF guard against optimizing arbitrary internal-network images.
    // Safe here since the "remote" host is our own backend; never enable
    // this against untrusted hosts.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
