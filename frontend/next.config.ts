import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const headersList: { key: string; value: string }[] = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ];

    // Evita que o CSP bloqueie WebSockets do Webpack HMR / Fast Refresh em ambiente de desenvolvimento
    if (!isDev) {
      headersList.push({
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://www.googletagmanager.com",
          "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
          "style-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com https://*.tile.openstreetmap.org https://unpkg.com https://logo.clearbit.com https://www.google.com https://*.gstatic.com",
          "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://nominatim.openstreetmap.org https://images.unsplash.com https://fonts.googleapis.com https://fonts.gstatic.com",
          "frame-src https://accounts.google.com",
          "frame-ancestors 'none'",
        ].join("; "),
      });
    }

    return [
      {
        source: "/:path*",
        headers: headersList,
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5179";
    if (apiUrl.startsWith("http")) {
      const baseDest = apiUrl.endsWith('/api') 
        ? apiUrl.slice(0, -4) 
        : apiUrl.endsWith('/') 
          ? apiUrl.slice(0, -1) 
          : apiUrl;
          
      return [
        {
          source: "/api/health",
          destination: `${baseDest}/health`,
        },
        {
          source: "/api/:path*",
          destination: `${baseDest}/api/:path*`,
        },
      ];
    }
    return [];
  },
  async redirects() {
    return [
      {
        source: "/sitemap",
        destination: "/sitemap.xml",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;