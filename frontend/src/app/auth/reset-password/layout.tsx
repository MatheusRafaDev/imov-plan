import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "redefinir senha",
  description: "Crie uma nova senha de acesso ao Imov.Plan.",
  alternates: {
    canonical: "/auth/reset-password",
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
