"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Building2, Calculator, LineChart, Sparkles,
  Shield, TrendingUp, CheckCircle, Clock, Zap, Star,
  ChevronRight, BarChart3, Lock
} from "lucide-react";

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "hsl(var(--background))" }}>

      {/* ── Ambient background orbs ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-gold w-[600px] h-[600px] -top-48 -left-32 opacity-60" />
        <div className="orb orb-blue w-[500px] h-[500px] top-1/2 -right-48 opacity-50" />
        <div className="orb orb-navy w-[400px] h-[400px] bottom-0 left-1/3 opacity-80" />
      </div>

      {/* ── Header ────────────────────────────────────────── */}
      <header className="relative z-10 container flex items-center justify-between py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-xl bg-gradient-gold opacity-30 blur-sm" />
            <div className="relative h-9 w-9 rounded-xl bg-gradient-gold grid place-items-center shadow-glow-sm">
              <Building2 className="h-5 w-5 text-accent-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Imov<span className="text-gradient-gold">.</span>Plan
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-glow-sm">
              <Link href="/app/imovel">Abrir meu plano <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative z-10 container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20 md:py-32">
        <div className="space-y-8 animate-fade-in-up">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full">
            <Sparkles className="h-3 w-3" />
            Planejamento inteligente para a entrada
          </span>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="font-display text-5xl md:text-6xl xl:text-7xl leading-[1.02] tracking-tight">
              O imóvel dos
              <br />
              seus sonhos
              <br />
              começa{" "}
              <span className="text-gradient-gold italic">aqui.</span>
            </h1>
          </div>

          {/* Description */}
          <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
            Simule CDI real, IR regressivo e aportes extras. Descubra exatamente quanto
            guardar por mês e quando você estará pronto para comprar.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-glow h-13 px-8 animate-glow-pulse font-bold">
              <Link href={user ? "/app/imovel" : "/auth"}>
                Começar agora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-13 px-7 border-white/10 hover:border-accent/30 text-muted-foreground hover:text-foreground">
              <a href="#como">Como funciona</a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-5 pt-2">
            {[
              { icon: Shield,     text: "Sem planilha" },
              { icon: TrendingUp, text: "CDI atualizado" },
              { icon: Lock,       text: "Dados seguros" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-accent/70" />
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* Hero card */}
        <div className="relative" style={{ animationDelay: "0.2s" }}>
          {/* Glow behind card */}
          <div className="absolute inset-0 bg-gradient-gold blur-[80px] opacity-10 rounded-full scale-90" />

          <div className="relative glass border border-white/10 rounded-2xl p-8 shadow-elevated animate-float">
            {/* Card header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Exemplo de simulação</p>
                <p className="font-display text-xl font-bold">Apê de R$ 500.000</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/10 text-success border border-success/20">
                ✓ Atingível
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "Entrada (20%)", value: "R$ 100.000", sub: "obrigatório" },
                { label: "Custos extras", value: "R$ 25.000",  sub: "ITBI + cartório" },
                { label: "Aporte mensal", value: "R$ 3.200",   sub: "ideal calculado" },
                { label: "CDI esperado",  value: "10,75% a.a", sub: "atualizado" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3.5">
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">{label}</p>
                  <p className="font-display text-base font-bold text-foreground num">{value}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

            {/* Highlights */}
            <div className="space-y-3">
              <Row label="Meta total necessária" value="R$ 125.000" />
              <Row label="Atinge a meta em" value="34 meses" highlight />
              <Row label="Lucro líquido com CDI" value="≈ R$ 14.700" highlight />
            </div>
          </div>
        </div>
      </section>

      {/* ── Como Funciona ─────────────────────────────────── */}
      <section id="como" className="relative z-10 container py-20 md:py-28">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full mb-4">
            <Star className="h-3 w-3" />
            Simples e poderoso
          </span>
          <h2 className="font-display text-4xl md:text-5xl mt-3 mb-4">Como funciona?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Três etapas. Menos de 5 minutos. Resultado preciso.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Building2,
              step: "01",
              title: "Defina o imóvel",
              text: "Valor, % de entrada, prazo e custos extras (ITBI, escritura, registro). Estimativa automática por cidade.",
              color: "from-amber-500/20 to-orange-500/10",
            },
            {
              icon: Calculator,
              step: "02",
              title: "Cadastre as pessoas",
              text: "Renda principal e complementar, gastos de cada um. O sistema sugere o aporte ideal automaticamente.",
              color: "from-blue-500/20 to-cyan-500/10",
            },
            {
              icon: LineChart,
              step: "03",
              title: "Simule e acompanhe",
              text: "CDI real, IR regressivo e aportes extras — visualize mês a mês e ajuste em tempo real.",
              color: "from-green-500/20 to-emerald-500/10",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="relative group rounded-2xl border border-white/[0.07] p-7 shadow-card hover:border-white/[0.14] transition-all duration-300"
              style={{ background: "hsl(222 40% 9% / 0.8)", animationDelay: `${i * 0.1}s` }}
            >
              {/* Gradient bg */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-11 w-11 rounded-xl bg-white/[0.06] border border-white/[0.08] grid place-items-center group-hover:border-accent/20 transition-colors duration-300">
                    <s.icon className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-display text-4xl font-bold text-white/5 group-hover:text-white/10 transition-colors">{s.step}</span>
                </div>
                <h3 className="font-display text-xl font-bold mb-2.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recursos detalhados ───────────────────────────── */}
      <section className="relative z-10 container py-20 md:py-28 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            Tudo que você precisa para a{" "}
            <span className="text-gradient-gold">melhor decisão</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Matemática bancária real. Sem arredondamentos. Sem surpresas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: BarChart3,
              title: "Paridade Matemática Exata",
              desc: "Diferente de simuladores comuns, nosso motor segue as exatas normas do sistema bancário — Price e SAC, garantindo projeções que refletem fielmente o mercado.",
              items: ["Amortização Constante (SAC) e Prestações Fixas (Price)", "IR Regressivo sobre rendimentos de investimento", "CDI composto atualizado diariamente"],
            },
            {
              icon: Clock,
              title: "Planejamento Flexível",
              desc: "A vida muda. Adicione aportes extras como 13º salário, férias ou FGTS e veja imediatamente o impacto na redução do prazo.",
              items: ["Aportes irregulares (Bônus, PLR, FGTS)", "Composição de renda familiar inteligente", "Rascunho salvo automaticamente na nuvem"],
            },
          ].map((card, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.07] p-8 shadow-card"
              style={{ background: "hsl(222 40% 9% / 0.7)" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 grid place-items-center">
                  <card.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold">{card.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{card.desc}</p>
              <ul className="space-y-2.5">
                {card.items.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────── */}
      <section className="relative z-10 container py-20 md:py-28 border-t border-white/[0.05] text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full mb-6">
            <Zap className="h-3 w-3" />
            Comece hoje, de graça
          </div>
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            Pronto para acelerar
            <br />
            <span className="text-gradient-gold">o seu sonho?</span>
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
            Crie sua conta gratuita e comece a simulação em menos de 2 minutos.
          </p>
          <Button asChild size="xl" className="bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-glow font-bold animate-glow-pulse">
            <Link href={user ? "/app/imovel" : "/auth"}>
              Iniciar Simulação <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="relative z-10 container py-8 text-xs text-muted-foreground border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-gradient-gold grid place-items-center">
            <Building2 className="h-2.5 w-2.5 text-accent-foreground" strokeWidth={3} />
          </div>
          <span>© {new Date().getFullYear()} Imov.Plan</span>
        </div>
        <span className="text-center">Cálculos didáticos. Não constituem recomendação de investimento.</span>
      </footer>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className={`font-display text-base font-bold num ${highlight ? "text-gradient-gold" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
