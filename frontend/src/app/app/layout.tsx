"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";

import { AppShell } from "@/components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Só redireciona se terminou o loading e nem no state nem nos cookies há usuário
    if (!loading && !isAuthenticated()) {
      const hasCookie = Cookies.get("user");
      if (!hasCookie) {
        router.replace("/auth");
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated()) {
    return (
      <AppShell>
        <div className="animate-fade-in-up space-y-8 max-w-6xl mx-auto w-full">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-secondary/80 animate-shimmer" />
            <div className="h-10 w-3/4 max-w-md rounded-lg bg-secondary/80 animate-shimmer" />
            <div className="h-5 w-full max-w-2xl rounded bg-secondary/60 animate-shimmer" />
          </div>
          
          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-secondary/40 animate-shimmer border border-border/40" />
            ))}
          </div>

          {/* Main Area Skeleton */}
          <div className="h-80 w-full rounded-3xl bg-secondary/30 animate-shimmer border border-border/40" />
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
