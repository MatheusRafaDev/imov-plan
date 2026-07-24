import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Imov.Plan - Planeje a entrada do seu imóvel",
  description:
    "Planeje a entrada do seu imóvel dos sonhos com simulação de CDI, IR regressivo e aportes extras. Sem planilhas, sem complicação.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Imov.Plan",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#D16330",
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
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <NextTopLoader color="#e15b31" height={3} showSpinner={false} shadow="0 0 10px #e15b31,0 0 5px #e15b31" />
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
        <PwaRegister />
      </body>
    </html>
  );
}