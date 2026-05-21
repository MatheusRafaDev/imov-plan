"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Calculator, LineChart, LogOut, Home, Bot, Landmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app/objetivo", icon: Building2, label: "1. Imóvel" },
  { to: "/app/pessoas", icon: Users, label: "2. Perfil" },
  { to: "/app/consultoria", icon: Bot, label: "3. IA" },
  { to: "/app/bancos", icon: Landmark, label: "4. Banco" },
  { to: "/app/financiamento", icon: Home, label: "5. Simulação" },
  { to: "/app/planejamento", icon: Calculator, label: "6. Plano" },
  { to: "/app/resultado", icon: LineChart, label: "7. Resultado" },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-gradient-cream">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/app/objetivo" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
              <Building2 className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Imov<span className="text-accent">.</span>Plan</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const isActive = pathname?.startsWith(n.to) || false;
              return (
              <Link
                key={n.to}
                href={n.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {n.label}
              </Link>
            )})}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="md:hidden border-t border-border/60 bg-background/70">
          <div className="container flex">
            {nav.map((n) => {
              const active = pathname?.startsWith(n.to) || false;
              return (
                <Link key={n.to} href={n.to} className={`flex-1 py-2 grid place-items-center text-xs gap-0.5 ${active ? "text-accent" : "text-muted-foreground"}`}>
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="container py-8 md:py-12">{children}</main>
    </div>
  );
};
