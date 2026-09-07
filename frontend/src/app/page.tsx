"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Calculator, LineChart, Sparkles, Shield, TrendingUp, CheckCircle, Clock, Zap } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-cream">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
            <Building2 className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-display text-2xl font-semibold">Imov<span className="text-accent">.</span>Plan</span>
        </div>
        {user ? (
          <Button asChild variant="secondary"><Link href="/app/imovel">Abrir meu plano</Link></Button>
        ) : (
          <Button asChild variant="ghost"><Link href="/auth">Entrar</Link></Button>
        )}
      </header>

      {/* Hero Section */}
      <section className="container grid lg:grid-cols-2 gap-12 items-center py-16 md:py-24">
        <div className="space-y-6 animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3 w-3" /> Planejamento para a entrada
          </span>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05]">
            O imóvel dos seus sonhos começa <em className="text-accent not-italic">aqui</em>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Informe o valor do imóvel e descubra exatamente quanto você precisa guardar por mês com simulação de CDI, IR regressivo e aportes extras.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow h-12 px-7">
              <Link href={user ? "/app/imovel" : "/auth"}>
                Começar meu plano <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="h-12">
              <a href="#como">Como funciona</a>
            </Button>
          </div>
          <div className="flex gap-6 pt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Sem planilha</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Simulação real</span>
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Inteligente</span>
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-warm blur-3xl opacity-20 rounded-full" />
          <div className="relative rounded-3xl bg-gradient-ink text-primary-foreground p-8 shadow-elevated">
            <p className="text-xs uppercase tracking-widest opacity-60">Exemplo</p>
            <p className="font-display text-2xl mt-1">Apê de R$ 500.000</p>
            <div className="mt-6 space-y-3">
              <Row label="Entrada (20%)" value="R$ 100.000" />
              <Row label="Custos extras (5%)" value="R$ 25.000" />
              <Row label="Aporte mensal" value="R$ 3.200" />
              <div className="h-px bg-white/10 my-4" />
              <Row label="Atinge meta em" value="34 meses" highlight />
              <Row label="Lucro com CDI" value="≈ R$ 14.700" highlight />
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como" className="container py-16 md:py-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: Building2, title: "Defina o imóvel", text: "Valor, % de entrada, prazo e custos extras (ITBI, escritura, registro)." },
          { icon: Calculator, title: "Cadastre as pessoas", text: "Renda principal e complementar, gastos de cada um. Sugerimos o aporte ideal." },
          { icon: LineChart, title: "Simule e acompanhe", text: "Juros compostos, IR regressivo e aportes extras — tudo em um gráfico." },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border/60 p-6 shadow-soft hover:shadow-elevated transition-shadow duration-300">
            <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center mb-4"><s.icon className="h-5 w-5" /></div>
            <h3 className="font-display text-xl mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </section>

      {/* Mais Informações / Detalhes (Adicionado a pedido do usuário) */}
      <section className="container py-16 md:py-24 border-t border-border/60">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="font-display text-4xl mb-4">Tudo que você precisa para tomar a melhor decisão</h2>
          <p className="text-muted-foreground text-lg">
            Planejar a compra de um imóvel envolve muitas variáveis. Nossa plataforma cuida da matemática complexa para que você foque apenas no seu objetivo final.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-card border border-border/60 p-8 shadow-soft">
            <h3 className="font-display text-2xl mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-accent" /> Paridade Matemática Exata
            </h3>
            <p className="text-muted-foreground mb-4">
              Diferente de simuladores comuns que arredondam valores, nosso motor de cálculo foi desenvolvido seguindo as exatas normas do sistema bancário (Price e SAC), garantindo que as projeções reflitam fielmente o mercado.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Amortização Constante (SAC) e Prestações Fixas (PRICE)</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Cálculo de Imposto de Renda Regressivo sobre investimentos</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Rendimento composto via CDI atualizado</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-card border border-border/60 p-8 shadow-soft">
            <h3 className="font-display text-2xl mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-accent" /> Planejamento Flexível
            </h3>
            <p className="text-muted-foreground mb-4">
              Sabemos que a vida muda. Por isso, você pode adicionar aportes extras anuais, como seu 13º salário, férias ou saques do FGTS, e ver imediatamente o impacto disso na redução do seu tempo de espera.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Injeção de valores irregulares (Bônus, PLR)</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Composição de renda familiar inteligente</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Rascunho salvo em nuvem automaticamente</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container py-16 md:py-24 border-t border-border/60 text-center">
        <h2 className="font-display text-4xl mb-6">Pronto para acelerar seu sonho?</h2>
        <Button asChild size="lg" className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow h-12 px-10">
          <Link href={user ? "/app/imovel" : "/auth"}>
            Iniciar Simulador Agora <Zap className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="container py-10 text-xs text-muted-foreground border-t border-border/60 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Imov.Plan</span>
        <span>Cálculos didáticos. Não constituem recomendação de investimento.</span>
      </footer>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm opacity-70">{label}</span>
      <span className={`font-display text-lg num ${highlight ? "text-accent" : ""}`}>{value}</span>
    </div>
  );
}
