import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Senha",
  description: "Recupere o acesso à sua conta no Imov.Plan.",
  alternates: {
    canonical: "/auth/forgot-password",
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
