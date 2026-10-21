import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PublicHeader } from "@/components/PublicHeader";
import { ShieldCheck, Lock, UserCheck, Database, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "política de privacidade",
  description:
    "Entenda como o Imov.Plan protege e trata seus dados patrimoniais e financeiros em conformidade rigorosa com a LGPD.",
  alternates: {
    canonical: "/privacidade",
  },
};

export default function PrivacidadePage() {
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
              <ShieldCheck className="w-4 h-4 text-accent" />
              Privacidade e Segurança
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground font-sans animate-fade-in-up"
            style={{ animationDelay: "100ms" }}
          >
            Política de Privacidade
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mt-4 animate-fade-in-up"
            style={{ animationDelay: "150ms" }}
          >
            No Imov.Plan, levamos a segurança e o sigilo das suas informações financeiras a sério.
            Conheça de forma transparente como seus dados são tratados em conformidade com a LGPD.
          </p>

          {/* Pill tags */}
          <div
            className="flex flex-wrap gap-2.5 sm:gap-3 mt-6 text-xs sm:text-sm text-foreground/85 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-soft font-medium">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              Em conformidade com a LGPD (Lei 13.709/18)
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-soft font-medium">
              <Lock className="w-4 h-4 text-success shrink-0" />
              Criptografia em repouso e trânsito
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/70 shadow-soft font-medium">
              <UserCheck className="w-4 h-4 text-success shrink-0" />
              Você no controle dos seus dados
            </span>
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO ─────────────────────────────────────────────────────── */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6 flex-1">
        {/* 1. Introdução */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "250ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              1. Visão Geral e Compromisso
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Esta Política de Privacidade descreve como a plataforma <strong className="text-foreground font-semibold">Imov.Plan</strong> coleta, armazena, processa e protege as informações dos usuários. Nosso propósito é fornecer cálculos, estimativas de compra imobiliária e simulações com o máximo de precisão, mantendo a privacidade estrita de seus dados patrimoniais.
          </p>
        </section>

        {/* 2. Dados Coletados */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              2. Quais Dados Coletamos
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Coletamos apenas as informações estritamente necessárias para a prestação do serviço e o cálculo das projeções:
          </p>
          <ul className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed pl-1">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong className="text-foreground font-semibold">Dados de Identificação e Cadastro:</strong> Nome, endereço de e-mail e foto de perfil pública caso realize login via Google OAuth.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong className="text-foreground font-semibold">Dados de Planejamento Imobiliário:</strong> Valor estimado do imóvel, percentual de entrada desejado, data pretendida e custos de cartório/ITBI estimados.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong className="text-foreground font-semibold">Dados Financeiros para Simulação:</strong> Renda informada, estimativas de gastos, valores iniciais guardados e aportes mensais ou extras (ex: 13º salário e FGTS).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong className="text-foreground font-semibold">Metadados Técnicos:</strong> Informações técnicas de sessão, cookies de autenticação e histórico de conexões estritamente para manter você conectado com segurança.</span>
            </li>
          </ul>
        </section>

        {/* 3. Finalidade do Tratamento */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "350ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              3. Para Que Utilizamos Seus Dados
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Seus dados são tratados para as seguintes finalidades legítimas:
          </p>
          <ul className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed pl-1">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>Executar os algoritmos de projeção financeira (juros compostos, CDI, IR regressivo, amortização SAC e PRICE).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>Salvar os rascunhos e cenários para que você possa acessá-los de qualquer dispositivo.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>Permitir a gestão de múltiplos participantes e planejamento compartilhado para casais e famílias.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>Garantir a segurança da sua conta e prevenir fraudes ou acessos não autorizados.</span>
            </li>
          </ul>
          <div className="mt-6 p-4 sm:p-5 rounded-xl bg-accent/5 border-l-4 border-accent border-y border-r border-accent/20 text-sm sm:text-base text-foreground leading-relaxed">
            <strong className="font-semibold text-accent">Compromisso de não comercialização:</strong> O Imov.Plan <strong className="font-semibold">nunca</strong> vende, aluga ou compartilha seus dados pessoais ou financeiros com corretoras, construtoras, imobiliárias ou terceiros para fins de marketing sem sua solicitação expressa.
          </div>
        </section>

        {/* 4. Segurança e Armazenamento */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              4. Armazenamento e Medidas de Segurança
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Utilizamos infraestrutura em nuvem segura com padrões modernos de proteção. Todas as comunicações entre seu navegador e nossos servidores são protegidas por criptografia SSL/TLS (HTTPS). Senhas são criptografadas com hash criptográfico unidirecional seguro (bcrypt), impedindo que qualquer membro da nossa equipe ou terceiro tenha acesso à sua credencial.
          </p>
        </section>

        {/* 5. Direitos do Titular (LGPD) */}
        <section
          className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-soft hover:shadow-elevated transition-all duration-300 animate-fade-in-up group"
          style={{ animationDelay: "450ms" }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-xs transition-transform group-hover:scale-105 duration-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              5. Seus Direitos (LGPD)
            </h2>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
            Nos termos do artigo 18 da Lei Geral de Proteção de Dados (Lei 13.709/2018), você possui o direito de:
          </p>
          <ul className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed pl-1">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>Confirmar a existência de tratamento dos seus dados.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>Acessar, corrigir ou atualizar seus dados a qualquer momento pelo menu de Perfil.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span>Solicitar a portabilidade ou exportação dos seus planos e simulações.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong className="text-foreground font-semibold">Excluir integralmente sua conta e dados cadastrais:</strong> essa opção fica disponível diretamente no menu do aplicativo em tempo real.</span>
            </li>
          </ul>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-card py-10 px-4 sm:px-6 mt-12 animate-fade-in">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            <Link href="/privacidade" className="text-accent font-semibold hover:underline">
              Política de privacidade
            </Link>
            <Link href="/termos" className="text-muted-foreground hover:text-accent transition-colors">
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
