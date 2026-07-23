import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "Imov.Plan - Planeje a entrada do seu imóvel",
  description: "Planeje a entrada do seu imóvel dos sonhos com simulação de CDI, IR regressivo e aportes extras. Sem planilhas, sem complicação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <GoogleOAuthProvider 
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "missing_client_id"} 
          locale="pt-BR"
          // Configuração para evitar conflitos com COOP
          // O cookie será lido automaticamente pelo backend via withCredentials
        >
          <AuthProvider>
            <NextTopLoader color="#e15b31" height={3} showSpinner={false} shadow="0 0 10px #e15b31,0 0 5px #e15b31" />
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}