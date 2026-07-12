import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5179/api";
    // Proxy API requests to backend
    if (apiUrl.startsWith("http")) {
      return [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
