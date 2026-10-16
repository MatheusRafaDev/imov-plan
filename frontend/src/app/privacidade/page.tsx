"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ShieldCheck, Lock, UserCheck, Database, FileText, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function PrivacidadePage() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#FBFAF7",
        fontFamily: "'Figtree', system-ui, sans-serif",
        color: "#1D1B19",
        margin: 0,
        padding: 0,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #FBFAF7; }
        a { color: #E8590C; text-decoration: none; }
        a:hover { color: #8F2F03; }
        .legal-card {
          background: #FFFFFF;
          border: 1px solid #E8E3DA;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .legal-card:hover {
          box-shadow: 0 12px 32px -12px rgba(29,27,25,0.08);
        }
        .hp-btn-primary {
          display: inline-block; padding: 11px 20px; border-radius: 12px;
          background: #E8590C; color: #fff !important; font-weight: 600; font-size: 15px;
          transition: background 0.15s, transform 0.1s;
        }
        .hp-btn-primary:hover { background: #A83A06; }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header
        className="safe-top"
        style={{
          borderBottom: "1px solid #E8E3DA",
          background: "#FBFAF7",
          position: "sticky",
          top: 0,
          zIndex: 30,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "18px 24px",
            paddingLeft: "calc(24px + env(safe-area-inset-left, 0px))",
            paddingRight: "calc(24px + env(safe-area-inset-right, 0px))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Logo href="/" size="md" />

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#5E5951",
                fontWeight: 600,
                fontSize: 15,
                transition: "color 0.15s",
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao início
            </Link>
            <Link href="/auth" className="hp-btn-primary">
              Começar meu plano
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid #E8E3DA", background: "#FFF0E6", padding: "56px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "#FFFFFF",
              color: "#E8590C",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 16,
            }}
          >
            <ShieldCheck className="w-4 h-4 text-[#E8590C]" />
            Privacidade e Segurança
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: "clamp(34px, 5vw, 48px)",
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              color: "#1D1B19",
            }}
          >
            Política de Privacidade
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 18, lineHeight: 1.6, color: "#5E5951", maxWidth: 680 }}>
            No Imov.Plan, levamos a segurança e o sigilo das suas informações financeiras a sério.
            Conheça de forma transparente como seus dados são tratados em conformidade com a LGPD.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24, fontSize: 13, color: "#5E5951" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Em conformidade com a LGPD (Lei 13.709/18)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>
              <Lock className="w-4 h-4 text-emerald-600" />
              Criptografia em repouso e trânsito
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Você no controle dos seus dados
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* 1. Introdução */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <FileText className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              1. Visão Geral e Compromisso
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            Esta Política de Privacidade descreve como a plataforma <strong>Imov.Plan</strong> coleta, armazena, processa e protege as informações dos usuários. Nosso propósito é fornecer cálculos, estimativas de compra imobiliária e simulações com o máximo de precisão, mantendo a privacidade estrita de seus dados patrimoniais.
          </p>
        </section>

        {/* 2. Dados Coletados */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <Database className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              2. Quais Dados Coletamos
            </h2>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            Coletamos apenas as informações estritamente necessárias para a prestação do serviço e o cálculo das projeções:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#5E5951", fontSize: 15, lineHeight: 1.8 }}>
            <li><strong>Dados de Identificação e Cadastro:</strong> Nome, endereço de e-mail e foto de perfil pública caso realize login via Google OAuth.</li>
            <li><strong>Dados de Planejamento Imobiliário:</strong> Valor estimado do imóvel, percentual de entrada desejado, data pretendida e custos de cartório/ITBI estimados.</li>
            <li><strong>Dados Financeiros para Simulação:</strong> Renda informada, estimativas de gastos, valores iniciais guardados e aportes mensais ou extras (ex: 13º salário e FGTS).</li>
            <li><strong>Metadados Técnicos:</strong> Informações técnicas de sessão, cookies de autenticação e histórico de conexões estritamente para manter você conectado com segurança.</li>
          </ul>
        </section>

        {/* 3. Finalidade do Tratamento */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              3. Para Que Utilizamos Seus Dados
            </h2>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            Seus dados são tratados para as seguintes finalidades legítimas:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#5E5951", fontSize: 15, lineHeight: 1.8 }}>
            <li>Executar os algoritmos de projeção financeira (juros compostos, CDI, IR regressivo, amortização SAC e PRICE).</li>
            <li>Salvar os rascunhos e cenários para que você possa acessá-los de qualquer dispositivo.</li>
            <li>Permitir a gestão de múltiplos participantes e planejamento compartilhado para casais e famílias.</li>
            <li>Garantir a segurança da sua conta e prevenir fraudes ou acessos não autorizados.</li>
          </ul>
          <div style={{ marginTop: 18, padding: "14px 18px", borderRadius: 12, background: "#F2EEE7", borderLeft: "4px solid #E8590C", fontSize: 14.5, color: "#1D1B19" }}>
            <strong>Compromisso de não comercialização:</strong> O Imov.Plan <strong>nunca</strong> vende, aluga ou compartilha seus dados pessoais ou financeiros com corretoras, construtoras, imobiliárias ou terceiros para fins de marketing sem sua solicitação expressa.
          </div>
        </section>

        {/* 4. Segurança e Armazenamento */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <Lock className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              4. Armazenamento e Medidas de Segurança
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            Utilizamos infraestrutura em nuvem segura com padrões modernos de proteção. Todas as comunicações entre seu navegador e nossos servidores são protegidas por criptografia SSL/TLS (HTTPS). Senhas são criptografadas com hash criptográfico unidirecional seguro (bcrypt), impedindo que qualquer membro da nossa equipe ou terceiro tenha acesso à sua credencial.
          </p>
        </section>

        {/* 5. Direitos do Titular (LGPD) */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              5. Seus Direitos (LGPD)
            </h2>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            Nos termos do artigo 18 da Lei Geral de Proteção de Dados (Lei 13.709/2018), você possui o direito de:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#5E5951", fontSize: 15, lineHeight: 1.8 }}>
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar, corrigir ou atualizar seus dados a qualquer momento pelo menu de Perfil.</li>
            <li>Solicitar a portabilidade ou exportação dos seus planos e simulações.</li>
            <li><strong>Excluir integralmente sua conta e dados cadastrais:</strong> essa opção fica disponível diretamente no menu do aplicativo em tempo real.</li>
          </ul>
        </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #E8E3DA", background: "#FBFAF7", padding: "48px 24px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
          }}
        >
          <Logo size="sm" />
          <nav style={{ display: "flex", gap: 24, fontSize: 14, fontWeight: 500 }}>
            <Link href="/privacidade" style={{ color: "#E8590C", fontWeight: 700 }}>Política de privacidade</Link>
            <Link href="/termos" style={{ color: "#5E5951" }}>Termos de uso</Link>
          </nav>
          <div style={{ fontSize: 13, color: "#5E5951" }}>
            © {new Date().getFullYear()} Imov.Plan — Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
