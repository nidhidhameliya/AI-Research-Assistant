import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove 'standalone' — Vercel handles its own output format
  // Increase proxy body size limit so large file uploads don't get rejected
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Disable keep-alive to prevent ECONNRESET on slow multipart uploads
  httpAgentOptions: {
    keepAlive: false,
  },
  async rewrites() {
    const backendUrl =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
