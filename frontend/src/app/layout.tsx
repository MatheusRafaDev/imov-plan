import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { PwaRegister } from "@/components/PwaRegister";
import { QueryProvider } from "@/providers/QueryProvider";

import { getBaseUrl, siteConfig, generateStructuredData } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: siteConfig.title,
    template: "%s | Imov.Plan",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.shortTitle,
    description: siteConfig.description,
    creator: "@imovplan",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: "Imov.Plan",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/maskable-icon.svg",
        color: "#E8590C",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#E8590C",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = generateStructuredData();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
        <QueryProvider>
          <AuthProvider>
            <NextTopLoader color="#E8590C" height={3} showSpinner={false} shadow="0 0 10px #E8590C,0 0 5px #E8590C" />
            {children}
            <Toaster
              richColors
              position="top-right"
              duration={2500}
              closeButton
              toastOptions={{
                classNames: {
                  toast: "cursor-pointer",
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
        <PwaRegister />
      </body>
    </html>
  );
}