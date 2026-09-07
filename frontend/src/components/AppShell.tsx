"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, Users, Calculator, LineChart, LogOut, Key,
  HardHat, LayoutGrid, MapPin, ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlanLogic } from "@/hooks/usePlanLogic";;
import { Button } from "@/components/ui/button";

export const navPorCenario = {
  entrada: [
    { to: "/app/imovel",      icon: Building2,   label: "Imóvel"    },
    { to: "/app/pessoas",     icon: Users,        label: "Perfil"    },
    { to: "/app/planejamento",icon: Calculator,   label: "Plano"     },
    { to: "/app/resultado",   icon: LineChart,    label: "Resultado" },
  ],
  pronto: [
    { to: "/app/pronto",      icon: Key,          label: "Financiamento" },
    { to: "/app/planejamento",icon: Calculator,   label: "Plano"         },
    { to: "/app/resultado",   icon: LineChart,    label: "Resultado"     },
  ],
  planta: [
    { to: "/app/planta",      icon: HardHat,      label: "Fluxo"     },
    { to: "/app/planejamento",icon: Calculator,   label: "Plano"     },
    { to: "/app/resultado",   icon: LineChart,    label: "Resultado" },
  ],
};

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { logout, user } = useAuth();
  const { cenario, objetivo, salvarPlano, calcularBackend } = usePlanLogic();
  const pathname = usePathname();
  const router = useRouter();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const homeHref = nav[0]?.to ?? "/app/imovel";
  const isStep1Filled = !!(objetivo && objetivo.valorImovel && objetivo.valorImovel > 0);

  const handleNavClick = async (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    if (targetPath === "/app/planejamento" || targetPath === "/app/resultado") {
      e.preventDefault();
      const savedId = await salvarPlano();
      if (savedId && !savedId.startsWith("local-draft")) {
        calcularBackend(savedId);
      }
      router.push(targetPath);
    }
  };

  const activeIndex = nav.findIndex(item => pathname?.startsWith(item.to));

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "hsl(var(--background))" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="safe-top shrink-0 sticky top-0 z-40 border-b border-white/[0.06]"
        style={{ background: "hsl(222 40% 7% / 0.85)", backdropFilter: "blur(24px) saturate(180%)" }}>
        <div className="container flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href={homeHref} className="flex items-center gap-2.5 group shrink-0">
            <div className="relative h-8 w-8 shrink-0">
              <div className="absolute inset-0 rounded-lg bg-gradient-gold opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
              <div className="relative h-8 w-8 rounded-lg bg-gradient-gold grid place-items-center shadow-glow-sm">
                <Building2 className="h-4 w-4 text-accent-foreground" strokeWidth={2.5} />
              </div>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Imov<span className="text-gradient-gold">.</span>Plan
            </span>
          </Link>

          {/* Desktop stepper nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {nav.map((n, index) => {
              const isActive  = index === activeIndex;
              const isPast    = activeIndex !== -1 && index < activeIndex;
              const isDisabled = index > 0 && !isStep1Filled;
              const isFuture  = !isActive && !isPast && !isDisabled;

              if (isDisabled) {
                return (
                  <div key={n.to} className="flex items-center">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground/30 cursor-not-allowed select-none">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border/30 text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span className="hidden xl:inline">{n.label}</span>
                    </div>
                    {index < nav.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 mx-0.5 shrink-0" />
                    )}
                  </div>
                );
              }

              return (
                <div key={n.to} className="flex items-center">
                  <Link
                    href={n.to}
                    onClick={(e) => handleNavClick(e, n.to)}
                    className={[
                      "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "text-accent-foreground"
                        : isPast
                          ? "text-accent hover:text-accent hover:bg-accent/8"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    ].join(" ")}
                  >
                    {/* Active background */}
                    {isActive && (
                      <span className="absolute inset-0 rounded-lg bg-gradient-gold opacity-100" />
                    )}
                    <span className={[
                      "relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                      isActive  ? "bg-accent-foreground/20 text-accent-foreground"
                      : isPast  ? "bg-accent/20 text-accent"
                      : "bg-white/8 text-muted-foreground"
                    ].join(" ")}>
                      {index + 1}
                    </span>
                    <span className="relative hidden xl:inline">{n.label}</span>
                  </Link>
                  {index < nav.length - 1 && (
                    <ChevronRight className={`h-3.5 w-3.5 mx-0.5 shrink-0 ${isPast ? "text-accent/40" : "text-muted-foreground/20"}`} />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {user?.name && (
              <span className="hidden md:inline text-xs font-medium text-muted-foreground mr-1 truncate max-w-[100px]">
                {user.name.split(" ")[0]}
              </span>
            )}

            <Link href="/app/planos">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Meus Planos</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={logout}
              title="Sair"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="w-full px-4 sm:px-6 md:px-8 py-8 lg:py-12 pb-20 lg:pb-12 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>

      {/* ── Bottom Nav (mobile) ─────────────────────────────────────────── */}
      <nav className="safe-bottom safe-x lg:hidden shrink-0 border-t border-white/[0.06]"
        style={{ background: "hsl(222 40% 7% / 0.92)", backdropFilter: "blur(20px)" }}>
        <div className="flex">
          {nav.map((n, index) => {
            const active     = pathname?.startsWith(n.to) || false;
            const isDisabled = index > 0 && !isStep1Filled;

            return isDisabled ? (
              <div
                key={n.to}
                className="flex-1 min-w-0 py-3.5 grid place-items-center text-[10px] gap-1 text-muted-foreground/25 cursor-not-allowed select-none"
              >
                <n.icon className="h-5 w-5" />
                <span className="truncate w-full text-center px-1 font-medium">{n.label}</span>
              </div>
            ) : (
              <Link
                key={n.to}
                href={n.to}
                onClick={(e) => handleNavClick(e, n.to)}
                className={[
                  "relative flex-1 min-w-0 py-3.5 grid place-items-center text-[10px] gap-1 transition-all duration-200 active:scale-95",
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground/80"
                ].join(" ")}
              >
                {/* Gold pill indicator */}
                {active && (
                  <span className="absolute top-0 inset-x-0 mx-auto w-8 h-0.5 rounded-full bg-gradient-gold" />
                )}
                {/* Active glow bg */}
                {active && (
                  <span className="absolute inset-0 bg-gradient-to-b from-accent/8 to-transparent" />
                )}
                <n.icon className="relative h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                <span className="relative truncate w-full text-center px-1 font-semibold">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
