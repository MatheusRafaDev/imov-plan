"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Salva o cenário padrão "entrada" e redireciona direto
    Cookies.set("imovplan_cenario", "entrada", { expires: 30 });
    router.push("/app/imovel");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-cream flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
