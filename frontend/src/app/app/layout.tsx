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
      <div className="min-h-screen grid place-items-center" style={{ background: "hsl(var(--background))" }}>
        {/* Ambient orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="orb orb-gold w-96 h-96 opacity-20" style={{ top: "-5rem", left: "-5rem" }} />
          <div className="orb orb-blue w-80 h-80 opacity-15" style={{ bottom: "-3rem", right: "-3rem" }} />
        </div>
        <div className="relative flex flex-col items-center gap-5 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-gold opacity-30 blur-lg animate-glow-pulse" />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-gold grid place-items-center shadow-glow animate-pulse-glow">
              <Building2 className="h-8 w-8 text-accent-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight">
              Imov<span className="text-gradient-gold">.</span>Plan
            </span>
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
