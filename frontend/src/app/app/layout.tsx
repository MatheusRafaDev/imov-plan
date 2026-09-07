"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { AppShell } from "@/components/AppShell";
import { Building2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push("/auth");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated()) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-cream">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="h-16 w-16 rounded-2xl bg-gradient-warm grid place-items-center shadow-glow animate-pulse-glow">
            <Building2 className="h-8 w-8 text-accent-foreground" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="font-display text-2xl font-semibold">Imov<span className="text-accent">.</span>Plan</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
              Carregando seu plano...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
