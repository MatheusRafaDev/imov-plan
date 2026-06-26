"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Calculator, LineChart, LogOut, Home, Key, HardHat } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlanContext } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";

const navPorCenario = {
  entrada: [
    { to: "/app/imovel", icon: Building2, label: "Imóvel" },
    { to: "/app/pessoas", icon: Users, label: "Perfil" },
    { to: "/app/planejamento", icon: Calculator, label: "Plano" },
    { to: "/app/resultado", icon: LineChart, label: "Resultado" },
  ],
  pronto: [
    { to: "/app/pronto", icon: Key, label: "Financiamento" },
    { to: "/app/planejamento", icon: Calculator, label: "Plano" },
    { to: "/app/resultado", icon: LineChart, label: "Resultado" },
  ],
  planta: [
    { to: "/app/planta", icon: HardHat, label: "Fluxo" },
    { to: "/app/planejamento", icon: Calculator, label: "Plano" },
    { to: "/app/resultado", icon: LineChart, label: "Resultado" },
  ],
};


export const AppShell = ({ children }: { children: ReactNode }) => {
  const { logout, user } = useAuth();
  const { cenario, objetivo } = usePlanContext();
  const pathname = usePathname();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const homeHref = nav[0]?.to ?? "/app/imovel";
  const isStep1Filled = !!(objetivo && objetivo.valorImovel && objetivo.valorImovel > 0);

  return (
    <div className="min-h-screen bg-gradient-cream">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href={homeHref} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
              <Building2 className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Imov<span className="text-accent">.</span>Plan</span>
          </Link>
          <nav className="hidden lg:flex items-center bg-secondary/40 rounded-full px-2 py-1.5 border border-border/50">
            {nav.map((n, index) => {
              const activeIndex = nav.findIndex(item => pathname?.startsWith(item.to));
              const isActive = index === activeIndex;
              const isPast = activeIndex !== -1 && index < activeIndex;
              const isDisabled = index > 0 && !isStep1Filled;

              return (
                <div key={n.to} className="flex items-center">
                  {isDisabled ? (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground/40 cursor-not-allowed opacity-50 select-none"
                    >
                      <div className="grid place-items-center h-5 w-5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground/30">
                        {index + 1}
                      </div>
                      <span className="hidden xl:inline">{n.label}</span>
                    </div>
                  ) : (
                    <Link
                      href={n.to}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isActive 
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                          : isPast 
                            ? "text-accent hover:bg-secondary/60" 
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <div className={`grid place-items-center h-5 w-5 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-accent text-accent-foreground" : isPast ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <span className="hidden xl:inline">{n.label}</span>
                    </Link>
                  )}
                  {index < nav.length - 1 && (
                    <div className="w-4 h-[1px] bg-border/60 mx-1" />
                  )}
                </div>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground mr-2">{user?.name?.split(' ')[0] || user?.email}</span>
            <Link href="/app/perfil">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="md:hidden border-t border-border/60 bg-background/70">
          <div className="container flex">
            {nav.map((n, index) => {
              const active = pathname?.startsWith(n.to) || false;
              const isDisabled = index > 0 && !isStep1Filled;
              return isDisabled ? (
                <div key={n.to} className="flex-1 py-2 grid place-items-center text-xs gap-0.5 text-muted-foreground/40 cursor-not-allowed opacity-50 select-none">
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </div>
              ) : (
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
