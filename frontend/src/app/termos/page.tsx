"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FileText, Scale, AlertTriangle, ShieldCheck, HelpCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function TermosPage() {
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
            <Scale className="w-4 h-4 text-[#E8590C]" />
            Transparência e Regras de Uso
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
            Termos de Uso
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 18, lineHeight: 1.6, color: "#5E5951", maxWidth: 680 }}>
            Leia com atenção as diretrizes e condições de utilização da plataforma Imov.Plan.
            Buscamos sempre clareza e transparência com nossos usuários.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24, fontSize: 13, color: "#5E5951" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Uso gratuito para simulações
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Transparência metodológica
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 8 }}>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Caráter consultivo e didático
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* 1. Aceitação */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <FileText className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              1. Aceitação dos Termos
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            Ao acessar ou utilizar a plataforma <strong>Imov.Plan</strong>, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com a nossa Política de Privacidade. Caso discorde de qualquer disposição, orientamos a interrupção do uso do serviço.
          </p>
        </section>

        {/* 2. Natureza dos Serviços */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <Scale className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              2. Natureza do Serviço e Caráter Didático
            </h2>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            O Imov.Plan é uma ferramenta de tecnologia desenvolvida com o objetivo de auxiliar no planejamento financeiro pessoal, organização de metas de poupança e comparação de tabelas de financiamento (SAC e PRICE).
          </p>
          <div style={{ padding: "16px 20px", borderRadius: 14, background: "#FFF7F1", border: "1px solid #FFD8BF", color: "#1D1B19", fontSize: 15, lineHeight: 1.6 }}>
            <strong>Aviso Legal Importante:</strong> O Imov.Plan <strong>não é uma instituição financeira</strong>, corretora de valores mobiliários, nem consultoria de investimentos regulamentada pela CVM ou Banco Central. Nossos cálculos, estimativas de rendimento de CDI, amortizações e projeções têm propósito estritamente <strong>didático, simulatório e informativo</strong>. Rentabilidade passada ou projeções matemáticas não garantem resultados futuros no mercado financeiro real.
          </div>
        </section>

        {/* 3. Premissas de Cálculo */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <HelpCircle className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              3. Premissas dos Cálculos
            </h2>
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            Os resultados exibidos na plataforma dependem diretamente das variáveis inseridas pelo usuário e de índices de mercado convencionados:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#5E5951", fontSize: 15, lineHeight: 1.8 }}>
            <li>A taxa do CDI utilizada como referência é configurável e segue parâmetros econômicos vigentes.</li>
            <li>A tributação de Imposto de Renda segue a tabela regressiva padrão para aplicações de renda fixa (22,5% a 15%).</li>
            <li>As taxas de financiamento bancário efetivas (CET), seguros obrigatórios (DFI/MIP) e taxas administrativas podem variar de acordo com a instituição financeira e a análise de crédito individual de cada comprador.</li>
          </ul>
        </section>

        {/* 4. Cadastro e Responsabilidade da Conta */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              4. Cadastro e Uso da Conta
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            O usuário é responsável por manter a confidencialidade de suas credenciais de login e pelas ações realizadas sob sua conta. É proibido utilizar a plataforma para práticas fraudulentas, engenharia reversa desautorizada ou inserção intencional de códigos maliciosos.
          </p>
        </section>

        {/* 5. Propriedade Intelectual */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <FileText className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              5. Propriedade Intelectual
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            A marca <strong>Imov.Plan</strong>, a identidade visual, interfaces, código-fonte, arquitetura de software e conteúdos presentes no site e aplicação são protegidos pelas leis de propriedade intelectual e direitos autorais. É proibida a reprodução ou cópia integral sem autorização prévia por escrito.
          </p>
        </section>

        {/* 6. Modificações e Encerramento */}
        <section className="legal-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8590C" }}>
              <Scale className="w-5 h-5" />
            </span>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700 }}>
              6. Alterações dos Termos e Foro
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "#5E5951" }}>
            O Imov.Plan poderá revisar estes Termos a qualquer momento para refletir melhorias do produto ou adequações legais. Estes Termos são regidos pelas leis da República Federativa do Brasil, elegendo-se o foro do domicílio do usuário para dirimir quaisquer controvérsias.
          </p>
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
            <Link href="/privacidade" style={{ color: "#5E5951" }}>Política de privacidade</Link>
            <Link href="/termos" style={{ color: "#E8590C", fontWeight: 700 }}>Termos de uso</Link>
          </nav>
          <div style={{ fontSize: 13, color: "#5E5951" }}>
            © {new Date().getFullYear()} Imov.Plan — Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
