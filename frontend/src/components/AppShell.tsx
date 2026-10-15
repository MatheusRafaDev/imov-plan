"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, Calculator, LineChart, LogOut, Key, HardHat, LayoutGrid, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { Button } from "@/components/ui/button";

export const navPorCenario = {
  entrada: [
    { to: "/app/imovel", icon: Building2, label: "Imóvel" },
    { to: "/app/pessoas", icon: Users, label: "Pessoas" },
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
  const { cenario, objetivo, salvarPlano, calcularBackend } = usePlanLogic();
  const pathname = usePathname();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const homeHref = nav[0]?.to ?? "/app/imovel";
  const isStep1Filled = !!(objetivo && objetivo.valorImovel && objetivo.valorImovel > 0);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    if (targetPath === "/app/planejamento" || targetPath === "/app/resultado") {
      // Não damos preventDefault para a navegação ser instantânea.
      // Dispara o salvamento e recálculo em background.
      salvarPlano().then((savedId) => {
        if (savedId && !savedId.startsWith("local-draft")) {
          calcularBackend(savedId);
        }
      });
    }
  };

  return (
    <div className="app-shell flex flex-col bg-gradient-cream">
      {/* ── Header ── */}
      <header className="safe-top shrink-0 border-b border-border/60 bg-white/95 dark:bg-card/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="container flex h-14 lg:h-16 items-center justify-between gap-2 lg:gap-4">
          <Logo href={homeHref} size="sm" className="min-w-0" />

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
                      <div className="grid place-items-center h-5 w-5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground/30">
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
                          ? "bg-white dark:bg-card text-foreground shadow-xs ring-1 ring-border/70" 
                          : isPast 
                            ? "text-accent hover:bg-secondary/60" 
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <div className={`grid place-items-center h-5 w-5 rounded-full text-[10px] font-medium ${
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
            {(() => {
              const isPerfilActive = pathname?.startsWith("/app/perfil");
              return (
                <Link href="/app/perfil">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`relative gap-2 max-w-[160px] transition-colors ${
                      isPerfilActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <User className={`h-4 w-4 ${isPerfilActive ? "text-accent" : ""}`} />
                    <span className="truncate">{user?.name?.split(" ")[0] || "Minha conta"}</span>
                    {isPerfilActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent" />
                    )}
                  </Button>
                </Link>
              );
            })()}

            {(() => {
              const isPlanosActive = pathname?.startsWith("/app/planos");
              return (
                <Link href="/app/planos">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`relative gap-1 sm:gap-2 transition-colors ${
                      isPlanosActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className={`h-4 w-4 ${isPlanosActive ? "text-accent" : ""}`} />
                    <span className="hidden sm:inline">Meus Planos</span>
                    <span className="inline sm:hidden text-xs">Planos</span>
                    {isPlanosActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent" />
                    )}
                  </Button>
                </Link>
              );
            })()}

            <Button type="button" variant="ghost" size="sm" onClick={() => void logout()} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="app-main">
        <div className="app-content w-full px-4 sm:px-6 md:px-8 pt-6 md:pt-8 lg:pt-12 max-w-[1600px] mx-auto">{children}</div>
      </main>

      {/* ── Bottom Nav (mobile PWA) ── */}
      <nav className="safe-bottom safe-x lg:hidden shrink-0 border-t border-border/60 bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-sm">
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
