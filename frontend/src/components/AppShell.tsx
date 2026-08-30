"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Users, Calculator, LineChart, LogOut, Key, HardHat, LayoutGrid, MapPin, ListChecks } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlanContext } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";

export const navPorCenario = {
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
  const { cenario, objetivo, saveDraft, calcularBackend } = usePlanContext();
  const pathname = usePathname();
  const router = useRouter();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const homeHref = nav[0]?.to ?? "/app/imovel";
  const isStep1Filled = !!(objetivo && objetivo.valorImovel && objetivo.valorImovel > 0);

  const handleNavClick = async (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    if (targetPath === "/app/planejamento" || targetPath === "/app/resultado") {
      e.preventDefault();
      const savedId = await saveDraft();
      if (savedId && !savedId.startsWith("local-draft")) {
        calcularBackend(savedId);
      }
      router.push(targetPath);
    }
  };

  return (
    <div className="flex flex-col bg-gradient-cream" style={{ height: '100dvh' }}>
      {/* ── Header ── */}
      <header className="safe-top shrink-0 border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-30">
        <div className="container flex h-14 lg:h-16 items-center justify-between gap-2 lg:gap-4">
          <Link href={homeHref} className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 lg:h-8 lg:w-8 shrink-0 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
              <Building2 className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-accent-foreground" />
            </div>
            <span className="font-display text-lg lg:text-xl font-semibold truncate">
              Imov<span className="text-accent">.</span>Plan
            </span>
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
                      onClick={(e) => handleNavClick(e, n.to)}
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

          <div className="flex items-center gap-1 lg:gap-2">
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground mr-1 lg:mr-2 truncate max-w-[100px]">
              {user?.name?.split(' ')[0] || user?.email}
            </span>

            <Link href="/app/sincronizar">
              <Button variant="default" size="sm" className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm">
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </Button>
            </Link>

            <Link href="/app/planos">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Meus Planos</span>
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 lg:py-12 pb-16 lg:pb-12 max-w-[1600px] mx-auto">{children}</div>
      </main>

      {/* ── Bottom Nav (mobile) ── */}
      <nav className="safe-bottom safe-x lg:hidden shrink-0 border-t border-border/60 bg-background/80 backdrop-blur">
        <div className="flex">
          {nav.map((n, index) => {
            const active = pathname?.startsWith(n.to) || false;
            const isDisabled = index > 0 && !isStep1Filled;
            return isDisabled ? (
              <div
                key={n.to}
                className="flex-1 min-w-0 py-3 grid place-items-center text-xs gap-1 text-muted-foreground/40 cursor-not-allowed opacity-50 select-none"
              >
                <n.icon className="h-5 w-5" />
                <span className="truncate w-full text-center px-1">{n.label}</span>
              </div>
            ) : (
              <Link
                key={n.to}
                href={n.to}
                onClick={(e) => handleNavClick(e, n.to)}
                className={`relative flex-1 min-w-0 py-3 grid place-items-center text-xs gap-1 transition-colors active:scale-95 ${
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-accent" />
                )}
                <n.icon className="h-5 w-5" />
                <span className="truncate w-full text-center px-1">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
