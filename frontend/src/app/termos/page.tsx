import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PublicHeader } from "@/components/PublicHeader";
import { FileText, Scale, AlertTriangle, ShieldCheck, HelpCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Conheça os termos, diretrizes e condições de utilização do simulador e planejador financeiro Imov.Plan.",
  alternates: {
    canonical: "/termos",
  },
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent/20 selection:text-accent">
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <PublicHeader />

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-gradient-to-b from-accent/5 via-accent/[0.02] to-background pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-accent transition-colors group mb-6 animate-fade-in-up"
            style={{ animationDelay: "0ms" }}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Voltar para o início
          </Link>

          {/* Badge */}
          <div>
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border/80 shadow-soft text-accent text-xs font-bold uppercase tracking-wider mb-5 animate-fade-in-up"
              style={{ animationDelay: "50ms" }}
            >
              <Scale className="w-4 h-4 text-accent" />
              Transparência e Regras de Uso
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-sans animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Termos de Uso
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mt-4 animate-fade-in-up"
            style={{ animationDelay: "150ms" }}
          >
            Leia com atenção as diretrizes e condições de utilização da plataforma Imov.Plan.
            Buscamos sempre clareza e transparência com nossos usuários.
          </p>

          {/* Pill tags */}
          <div
            className="flex flex-wrap gap-2.5 sm:gap-3 mt-6 text-xs sm:text-sm text-foreground/85 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-soft font-medium">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              Uso gratuito para simulações
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-soft font-medium">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              Transparência metodológica
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-soft font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Caráter consultivo e didático
            </span>
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO ─────────────────────────────────────────────────────── */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6 flex-1">
        {/* 1. Aceitação */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "250ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              1. Aceitação dos Termos
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Ao acessar ou utilizar a plataforma <strong className="text-foreground font-semibold">Imov.Plan</strong>, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com a nossa Política de Privacidade. Caso discorde de qualquer disposição, orientamos a interrupção do uso do serviço.
          </p>
        </section>

        {/* 2. Natureza dos Serviços */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              2. Natureza do Serviço e Caráter Didático
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            O Imov.Plan é uma ferramenta de tecnologia desenvolvida com o objetivo de auxiliar no planejamento financeiro pessoal, organização de metas de poupança e comparação de tabelas de financiamento (SAC e PRICE).
          </p>
          <div className="mt-6 p-4 sm:p-5 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 border-y border-r border-amber-500/20 text-sm sm:text-base text-foreground leading-relaxed">
            <strong className="font-semibold text-amber-700 dark:text-amber-400">Aviso Legal Importante:</strong> O Imov.Plan <strong className="font-semibold">não é uma instituição financeira</strong>, corretora de valores mobiliários, nem consultoria de investimentos regulamentada pela CVM ou Banco Central. Nossos cálculos, estimativas de rendimento de CDI, amortizações e projeções têm propósito estritamente <strong className="font-semibold">didático, simulatório e informativo</strong>. Rentabilidade passada ou projeções matemáticas não garantem resultados futuros no mercado financeiro real.
          </div>
        </section>

        {/* 3. Premissas de Cálculo */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "350ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              3. Premissas dos Cálculos
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Os resultados exibidos na plataforma dependem diretamente das variáveis inseridas pelo usuário e de índices de mercado convencionados:
          </p>
          <ul className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed pl-1">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>A taxa do CDI utilizada como referência é configurável e segue parâmetros econômicos vigentes.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>A tributação de Imposto de Renda segue a tabela regressiva padrão para aplicações de renda fixa (22,5% a 15%).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>As taxas de financiamento bancário efetivas (CET), seguros obrigatórios (DFI/MIP) e taxas administrativas podem variar de acordo com a instituição financeira e a análise de crédito individual de cada comprador.</span>
            </li>
          </ul>
        </section>

        {/* 4. Cadastro e Responsabilidade da Conta */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              4. Cadastro e Uso da Conta
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            O usuário é responsável por manter a confidencialidade de suas credenciais de login e pelas ações realizadas sob sua conta. É proibido utilizar a plataforma para práticas fraudulentas, engenharia reversa desautorizada ou inserção intencional de códigos maliciosos.
          </p>
        </section>

        {/* 5. Propriedade Intelectual */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "450ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              5. Propriedade Intelectual
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            A marca <strong className="text-foreground font-semibold">Imov.Plan</strong>, a identidade visual, interfaces, código-fonte, arquitetura de software e conteúdos presentes no site e aplicação são protegidos pelas leis de propriedade intelectual e direitos autorais. É proibida a reprodução ou cópia integral sem autorização prévia por escrito.
          </p>
        </section>

        {/* 6. Modificações e Encerramento */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "500ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              6. Alterações dos Termos e Foro
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            O Imov.Plan poderá revisar estes Termos a qualquer momento para refletir melhorias do produto ou adequações legais. Estes Termos são regidos pelas leis da República Federativa do Brasil, elegendo-se o foro do domicílio do usuário para dirimir quaisquer controvérsias.
          </p>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-card py-10 px-4 sm:px-6 mt-12 animate-fade-in">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            <Link href="/privacidade" className="text-muted-foreground hover:text-accent transition-colors">
              Política de privacidade
            </Link>
            <Link href="/termos" className="text-accent font-semibold hover:underline">
              Termos de uso
            </Link>
          </nav>
          <div className="text-xs text-muted-foreground text-center sm:text-right">
            © {new Date().getFullYear()} Imov.Plan — Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
