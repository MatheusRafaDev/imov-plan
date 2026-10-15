import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acessar Conta ou Cadastrar",
  description:
    "Entre na sua conta Imov.Plan ou cadastre-se gratuitamente para planejar a entrada do seu imóvel dos sonhos com cálculo de CDI e custos de ITBI.",
  alternates: {
    canonical: "/auth",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
