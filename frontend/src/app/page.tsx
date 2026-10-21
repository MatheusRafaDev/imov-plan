"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { PublicHeader } from "@/components/PublicHeader";
import { faqItems } from "@/lib/seo";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

function calcSim(valor: number, pct: number, aporte: number, cdiPct = 14.5) {
  const cdi = cdiPct / 100;
  const ir = 0.15;
  const entrada = (valor * pct) / 100;
  const custos = valor * 0.05;
  const meta = entrada + custos;
  const im = Math.pow(1 + cdi, 1 / 12) - 1;
  const il = im * (1 - ir);
  const meses = Math.max(
    1,
    Math.ceil(Math.log(1 + (meta * il) / aporte) / Math.log(1 + il))
  );
  const rend = Math.max(
    0,
    (aporte * (Math.pow(1 + il, meses) - 1)) / il - aporte * meses
  );
  return {
    entrada,
    custos,
    meta,
    meses,
    anos: (meses / 12).toFixed(1).replace(".", ","),
    rendFmt: brl(rend),
    entradaFmt: brl(entrada),
    custosFmt: brl(custos),
    entradaW: ((entrada / meta) * 100).toFixed(1) + "%",
    custosW: ((custos / meta) * 100).toFixed(1) + "%",
    cdiFmt: cdiPct.toFixed(1).replace(".", ","),
  };
}

/* ─── inline SVG icons ────────────────────────────────────────────────────── */
const CheckSvg = ({ color = "#E8590C" }: { color?: string }) => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}
  >
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

const PlusMinusSvg = () => (
  <svg
    aria-hidden="true"
    style={{ flexShrink: 0 }}
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#E8590C"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/* ─── small sub-components ────────────────────────────────────────────────── */
function FeatureItem({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div style={{ flex: "1 1 220px", display: "flex", alignItems: "center", gap: 14 }}>
      <span
        style={{
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#FFF0E6",
          color: "#E8590C",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 14, color: "#5E5951" }}>{sub}</div>
      </div>
    </div>
  );
}

function StepCard({
  icon,
  num,
  title,
  text,
}: {
  icon: React.ReactNode;
  num: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 300px",
        minWidth: 0,
        background: "#FFFFFF",
        border: "1px solid #E8E3DA",
        borderRadius: 24,
        padding: 32,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#FFF0E6",
            color: "#E8590C",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </span>
        <span
          style={{
            fontFamily: "'Bricolage Grotesque',sans-serif",
            fontWeight: 700,
            fontSize: 44,
            color: "#E8E3DA",
          }}
        >
          {num}
        </span>
      </div>
      <h3 style={{ margin: "24px 0 0", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 24 }}>
        {title}
      </h3>
      <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: "#5E5951" }}>{text}</p>
    </div>
  );
}

function Reveal({
  children,
  className = "",
  style = {},
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── page component ──────────────────────────────────────────────────────── */
export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/app/imovel");
    }
  }, [loading, user, router]);

  useEffect(() => {
    document.title = "Imov.plan | simulador de entrada e financiamento";
  }, []);

  /* simulator state */
  const [valor, setValor] = useState(500000);
  const [pct, setPct] = useState(20);
  const [aporte, setAporte] = useState(3200);

  const sim = calcSim(valor, pct, aporte);

  const authHref = user ? "/app/imovel" : "/auth";

  return (
    <div
      style={{
        width: "100%",
        background: "#FBFAF7",
        fontFamily: "'Figtree', system-ui, sans-serif",
        color: "#1D1B19",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600;700&display=swap');
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; }
        body { margin: 0; background: #FBFAF7; }
        section[id] { scroll-margin-top: 96px; }

        @keyframes hp-fade-in-up {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hp-anim-hero-badge {
          animation: hp-fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .hp-anim-hero-h1 {
          animation: hp-fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 80ms both;
        }
        .hp-anim-hero-desc {
          animation: hp-fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 160ms both;
        }
        .hp-anim-hero-cta {
          animation: hp-fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 240ms both;
        }
        .hp-anim-hero-checks {
          animation: hp-fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 320ms both;
        }
        .hp-anim-hero-sim {
          animation: hp-fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 160ms both;
        }
        .hp-anim-features-strip {
          animation: hp-fade-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) 360ms both;
        }

        a { color: #E8590C; text-decoration: none; }
        a:hover { color: #8F2F03; }
        summary { list-style: none; cursor: pointer; }
        summary::-webkit-details-marker { display: none; }
        a:focus-visible, summary:focus-visible, input:focus-visible {
          outline: 3px solid #1D1B19; outline-offset: 3px;
        }
        input[type=range] { accent-color: #E8590C; }
        .hp-nav-link { color: #5E5951; font-weight: 500; font-size: 15px; transition: color 0.15s; }
        .hp-nav-link:hover { color: #1D1B19; }
        .hp-btn-primary {
          display: inline-block; padding: 11px 20px; border-radius: 12px;
          background: #E8590C; color: #fff !important; font-weight: 600; font-size: 15px;
          transition: background 0.15s, transform 0.1s;
        }
        .hp-btn-primary:hover { background: #A83A06; }
        .hp-btn-primary:active { transform: scale(0.98); }
        .hp-btn-hero {
          display: inline-block; padding: 16px 28px; border-radius: 14px;
          background: #E8590C; color: #fff !important; font-weight: 600; font-size: 17px;
          transition: background 0.15s, transform 0.1s;
        }
        .hp-btn-hero:hover { background: #A83A06; }
        .hp-btn-hero:active { transform: scale(0.98); }
        .hp-btn-ghost {
          display: inline-block; padding: 15px 26px; border-radius: 14px;
          border: 1.5px solid #CFC8BC; color: #1D1B19 !important; font-weight: 600; font-size: 17px;
          transition: border-color 0.15s, background 0.15s;
        }
        .hp-btn-ghost:hover { border-color: #B0A898; background: #F2EEE7; }
        .hp-cta-big {
          display: inline-block; padding: 18px 34px; border-radius: 14px;
          background: #E8590C; color: #1D1B19 !important; font-weight: 700; font-size: 18px;
          transition: background 0.15s, transform 0.1s;
        }
        .hp-cta-big:hover { background: #CC4800; }
        .hp-cta-big:active { transform: scale(0.98); }
        .hp-faq-details { border-top: 1px solid #E8E3DA; padding: 24px 0; }
        .hp-faq-details:last-child { border-bottom: 1px solid #E8E3DA; }
        .hp-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          padding-left: calc(24px + env(safe-area-inset-left, 0px));
          padding-right: calc(24px + env(safe-area-inset-right, 0px));
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        @media (max-width: 767px) {
          .hp-header-inner {
            padding: 12px 16px !important;
            padding-left: calc(16px + env(safe-area-inset-left, 0px)) !important;
            padding-right: calc(16px + env(safe-area-inset-right, 0px)) !important;
          }
          .hp-hero-grid { flex-direction: column !important; }
          .hp-hero-h1 { font-size: 36px !important; }
          .hp-section-h2 { font-size: 28px !important; }
          .hp-nav-links { display: none !important; }
          .hp-btn-header-login { padding: 8px 10px !important; font-size: 14px !important; }
          .hp-btn-header-signup { padding: 8px 14px !important; font-size: 14px !important; border-radius: 10px !important; }
        }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <PublicHeader />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="hp-hero-grid"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "72px 32px 80px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 64,
        }}
      >
        {/* left col */}
        <div style={{ flex: "1 1 480px", minWidth: 0 }}>
          <div
            className="hp-anim-hero-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 999,
              background: "#FFF0E6",
              color: "#E8590C",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8590C" }} />
            Planejamento para a entrada
          </div>

          <h1
            className="hp-hero-h1 hp-anim-hero-h1"
            style={{
              margin: "22px 0 0",
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 68,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            O imóvel dos seus sonhos começa{" "}
            <span style={{ color: "#E8590C" }}>aqui.</span>
          </h1>

          <p className="hp-anim-hero-desc" style={{ margin: "24px 0 0", fontSize: 20, lineHeight: 1.55, color: "#5E5951", maxWidth: 540 }}>
            Informe o valor do imóvel e descubra quanto guardar por mês, com CDI,
            imposto de renda regressivo e aportes extras como 13º e FGTS.
          </p>

          <div className="hp-anim-hero-cta" style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Link href={authHref} className="hp-btn-hero">Começar meu plano</Link>
            <a href="#como" className="hp-btn-ghost">Ver como funciona</a>
          </div>

          <ul
            className="hp-anim-hero-checks"
            style={{
              margin: "36px 0 0",
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 28px",
              fontSize: 15,
              fontWeight: 500,
              color: "#1D1B19",
            }}
          >
            {["Sem planilha", "Funciona para casal", "SAC e PRICE"].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckSvg />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* right col — simulator */}
        <div
          className="hp-anim-hero-sim"
          style={{
            flex: "1 1 400px",
            maxWidth: 500,
            minWidth: 0,
            background: "#FFFFFF",
            border: "1px solid #E8E3DA",
            borderRadius: 28,
            padding: 30,
            boxShadow: "0 24px 60px -24px rgba(29,27,25,0.22)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 22 }}>
              Simule agora
            </h2>

          </div>

          {/* slider: valor */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <label htmlFor="hp-valor" style={{ fontSize: 15, color: "#5E5951" }}>Valor do imóvel</label>
              <output style={{ fontWeight: 700, fontSize: 18 }}>{brl(valor)}</output>
            </div>
            <input
              id="hp-valor"
              type="range"
              min={150000}
              max={2000000}
              step={10000}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              style={{ width: "100%", marginTop: 10 }}
            />
          </div>

          {/* slider: entrada % */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <label htmlFor="hp-entrada" style={{ fontSize: 15, color: "#5E5951" }}>Entrada</label>
              <output style={{ fontWeight: 700, fontSize: 18 }}>{pct}%</output>
            </div>
            <input
              id="hp-entrada"
              type="range"
              min={10}
              max={50}
              step={1}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              style={{ width: "100%", marginTop: 10 }}
            />
          </div>

          {/* slider: aporte mensal */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <label htmlFor="hp-aporte" style={{ fontSize: 15, color: "#5E5951" }}>Quanto guardo por mês</label>
              <output style={{ fontWeight: 700, fontSize: 18 }}>{brl(aporte)}</output>
            </div>
            <input
              id="hp-aporte"
              type="range"
              min={500}
              max={20000}
              step={100}
              value={aporte}
              onChange={(e) => setAporte(Number(e.target.value))}
              style={{ width: "100%", marginTop: 10 }}
            />
          </div>

          {/* progress bar */}
          <div style={{ marginTop: 26, paddingTop: 22, borderTop: "1px solid #E8E3DA" }}>
            <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", background: "#F2EEE7" }}>
              <div style={{ width: sim.entradaW, background: "#E8590C" }} />
              <div style={{ width: sim.custosW, background: "#1D1B19" }} />
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: "8px 16px",
                marginTop: 12,
                fontSize: 14,
                color: "#5E5951",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#E8590C" }} />
                Entrada {sim.entradaFmt}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#1D1B19" }} />
                Custos extras (5%) {sim.custosFmt}
              </span>
            </div>
          </div>

          {/* result */}
          <div
            style={{
              marginTop: 22,
              padding: "18px 20px",
              borderRadius: 18,
              background: "#FFF0E6",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "6px 16px",
            }}
          >
            <span style={{ fontSize: 15, color: "#5E5951" }}>Você chega lá em</span>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque',sans-serif",
                fontWeight: 700,
                fontSize: 30,
                color: "#E8590C",
              }}
            >
              {sim.meses} meses
            </span>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, color: "#5E5951" }}>
            <span>≈ {sim.anos} anos</span>
            <span>Rendimento do CDI ≈ {sim.rendFmt}</span>
          </div>

          <p style={{ margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "#5E5951" }}>
            Estimativa didática com CDI de {sim.cdiFmt}% a.a. e IR de 15%. Não constitui
            recomendação de investimento.
          </p>
        </div>
      </section>

      {/* ── FEATURES STRIP ───────────────────────────────────────────────── */}
      <section className="hp-anim-features-strip" style={{ borderTop: "1px solid #E8E3DA", borderBottom: "1px solid #E8E3DA", background: "#FFFFFF" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "30px 32px",
            display: "flex",
            flexWrap: "wrap",
            gap: "24px 32px",
          }}
        >
          <FeatureItem
            title="SAC e PRICE"
            sub="Compare as duas tabelas"
            icon={
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19V5" /><path d="M4 19h16" /><path d="M7 15l4-4 3 3 5-6" />
              </svg>
            }
          />
          <FeatureItem
            title="IR regressivo"
            sub="Líquido, não só bruto"
            icon={
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 5L5 19" /><circle cx="7" cy="7" r="2.2" /><circle cx="17" cy="17" r="2.2" />
              </svg>
            }
          />
          <FeatureItem
            title="13º, férias e FGTS"
            sub="Aportes extras no plano"
            icon={
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
            }
          />
          <FeatureItem
            title="Renda de casal"
            sub="Várias pessoas, um plano"
            icon={
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                <circle cx="17" cy="9" r="2.6" /><path d="M17 14.2c2.4.3 4 2.4 4 4.8" />
              </svg>
            }
          />
        </div>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────── */}
      <section id="como" style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 32px 24px" }}>
        <Reveal>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E8590C" }}>
              Como funciona
            </div>
            <h2
              className="hp-section-h2"
              style={{ margin: "14px 0 0", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.015em" }}
            >
              Do valor do imóvel ao plano, em três passos
            </h2>
          </div>
        </Reveal>
        <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", gap: 24 }}>
          <Reveal delay={0} style={{ flex: "1 1 300px", minWidth: 0, display: "flex" }}>
            <StepCard
              num="01"
              title="Defina o imóvel"
              text="Valor, percentual de entrada, prazo e custos extras como ITBI, escritura e registro."
              icon={
                <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
                </svg>
              }
            />
          </Reveal>
          <Reveal delay={120} style={{ flex: "1 1 300px", minWidth: 0, display: "flex" }}>
            <StepCard
              num="02"
              title="Cadastre as pessoas"
              text="Renda principal e complementar, mais os gastos de cada um. Sugerimos o aporte ideal."
              icon={
                <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                  <circle cx="17" cy="9" r="2.6" /><path d="M17 14.2c2.4.3 4 2.4 4 4.8" />
                </svg>
              }
            />
          </Reveal>
          <Reveal delay={240} style={{ flex: "1 1 300px", minWidth: 0, display: "flex" }}>
            <StepCard
              num="03"
              title="Simule e acompanhe"
              text="Juros compostos, IR regressivo e aportes extras, tudo em um gráfico que se atualiza na hora."
              icon={
                <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19V5" /><path d="M4 19h16" /><path d="M7 15l4-4 3 3 5-6" />
                </svg>
              }
            />
          </Reveal>
        </div>
      </section>

      {/* ── APP PREVIEW ──────────────────────────────────────────────────── */}
      <section style={{ marginTop: 64, background: "#FFF0E6" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "64px 24px" }}>
          <Reveal>
            <div style={{ maxWidth: 580 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E8590C" }}>
                Dentro do app
              </div>
              <h2
                className="hp-section-h2"
                style={{ margin: "10px 0 0", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1.15, letterSpacing: "-0.015em" }}
              >
                Veja o seu plano ganhar forma
              </h2>
              <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.55, color: "#5E5951" }}>
                Acompanhe a evolução da entrada mês a mês e veja o impacto de cada aporte até
                alcançar a sua meta.
              </p>
            </div>
          </Reveal>

          <div style={{ marginTop: 32 }}>
            {/* chart card */}
            <Reveal delay={80} style={{ width: "100%", display: "flex" }}>
              <div
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #E8E3DA",
                  borderRadius: 24,
                  padding: "24px 24px 18px",
                  boxShadow: "0 4px 20px -4px rgba(29, 27, 25, 0.05)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px 16px", alignItems: "baseline" }}>
                  <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 18 }}>Evolução até a meta</h3>
                  <span style={{ fontSize: 12, color: "#5E5951" }}>Exemplo ilustrativo</span>
                </div>
                <svg
                  role="img"
                  aria-label="Gráfico ilustrativo: o valor acumulado sobe mês a mês, com saltos nos meses de aportes extras, até alcançar a linha da meta"
                  viewBox="0 0 640 300"
                  style={{ width: "100%", height: "auto", marginTop: 14, display: "block" }}
                >
                  <line x1="40" y1="250" x2="620" y2="250" stroke="#E8E3DA" strokeWidth="1.5" />
                  <line x1="40" y1="190" x2="620" y2="190" stroke="#F2EEE7" strokeWidth="1" />
                  <line x1="40" y1="130" x2="620" y2="130" stroke="#F2EEE7" strokeWidth="1" />
                  <line x1="40" y1="70" x2="620" y2="70" stroke="#1D1B19" strokeWidth="1.5" strokeDasharray="6 6" />
                  <text x="44" y="58" fontSize="11.5" fontWeight="600" fill="#1D1B19" fontFamily="Figtree, sans-serif">Meta: entrada + custos</text>
                  <path d="M40 250 L139 236 L238 214 L238 192 L337 168 L436 136 L436 112 L535 88 L585 70 L585 250 L40 250 Z" fill="#E8590C" fillOpacity="0.12" />
                  <polyline points="40,250 139,236 238,214 238,192 337,168 436,136 436,112 535,88 585,70" fill="none" stroke="#E8590C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="238" cy="203" r="5" fill="#FFFFFF" stroke="#1D1B19" strokeWidth="2.5" />
                  <circle cx="436" cy="124" r="5" fill="#FFFFFF" stroke="#1D1B19" strokeWidth="2.5" />
                  <circle cx="585" cy="70" r="6" fill="#E8590C" />
                  <text x="248" y="234" fontSize="11" fill="#5E5951" fontFamily="Figtree, sans-serif">13º salário</text>
                  <text x="446" y="154" fontSize="11" fill="#5E5951" fontFamily="Figtree, sans-serif">Saque do FGTS</text>
                  <text x="40" y="272" fontSize="11" fill="#5E5951" fontFamily="Figtree, sans-serif">Hoje</text>
                  <text x="576" y="272" fontSize="11" fill="#5E5951" fontFamily="Figtree, sans-serif">Meta</text>
                </svg>
                <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.5, color: "#5E5951" }}>
                  Cada aporte extra encurta o caminho. O gráfico mostra o efeito na hora.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── RECURSOS ─────────────────────────────────────────────────────── */}
      <section id="recursos" style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 32px 24px" }}>
        <Reveal>
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E8590C" }}>
              Recursos
            </div>
            <h2
              className="hp-section-h2"
              style={{ margin: "14px 0 0", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.015em" }}
            >
              Tudo para decidir com segurança
            </h2>
            <p style={{ margin: "18px 0 0", fontSize: 18, lineHeight: 1.6, color: "#5E5951" }}>
              Comprar um imóvel tem muitas variáveis. Cuidamos da matemática para você focar no objetivo.
            </p>
          </div>
        </Reveal>
        <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", gap: 24 }}>
          {/* dark card */}
          <Reveal delay={80} style={{ flex: "1 1 440px", minWidth: 0, display: "flex" }}>
            <div style={{ width: "100%", background: "#1D1B19", color: "#FBFAF7", borderRadius: 28, padding: 40 }}>
              <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 28 }}>
                Cálculo igual ao dos bancos
              </h3>
              <p style={{ margin: "14px 0 0", fontSize: 17, lineHeight: 1.6, color: "#C9C2B7" }}>
                O motor segue as regras do sistema bancário, sem arredondar no meio do caminho, para as
                projeções ficarem próximas do que o mercado pratica.
              </p>
              <ul style={{ margin: "28px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14, fontSize: 16 }}>
                {[
                  "Cálculo preciso de amortização e projeção de parcelas",
                  "Imposto de renda regressivo sobre os investimentos",
                  "Rendimento composto pelo CDI",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <CheckSvg color="#FF8A4C" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          {/* light card */}
          <Reveal delay={180} style={{ flex: "1 1 440px", minWidth: 0, display: "flex" }}>
            <div style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E8E3DA", borderRadius: 28, padding: 40 }}>
              <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 28 }}>
                Um plano que acompanha a vida
              </h3>
              <p style={{ margin: "14px 0 0", fontSize: 17, lineHeight: 1.6, color: "#5E5951" }}>
                Adicione 13º, férias, PLR ou saque do FGTS e veja na hora quanto o prazo diminui.
              </p>
              <ul style={{ margin: "28px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14, fontSize: 16 }}>
                {[
                  "Aportes irregulares, como bônus e PLR",
                  "Composição de renda familiar",
                  "Rascunho salvo na nuvem automaticamente",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <CheckSvg />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PARA QUEM É ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 32px 24px" }}>
        <Reveal>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E8590C" }}>
              Para quem é
            </div>
            <h2
              className="hp-section-h2"
              style={{ margin: "14px 0 0", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.015em" }}
            >
              Feito para quem está juntando a entrada
            </h2>
          </div>
        </Reveal>
        <div style={{ marginTop: 44, display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            {
              title: "Primeiro imóvel",
              text: "Descubra quanto guardar por mês e em quanto tempo a entrada fica pronta.",
            },
            {
              title: "Casais e famílias",
              text: "Una rendas e gastos de cada pessoa e veja o aporte conjunto que cabe no orçamento.",
            },
            {
              title: "Quem conta com FGTS e 13º",
              text: "Inclua os aportes do ano e veja o impacto direto no prazo até a meta.",
            },
          ].map((item, idx) => (
            <Reveal key={item.title} delay={idx * 100} style={{ flex: "1 1 300px", minWidth: 0, display: "flex" }}>
              <div style={{ width: "100%", borderTop: "3px solid #E8590C", paddingTop: 22 }}>
                <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 24 }}>
                  {item.title}
                </h3>
                <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.6, color: "#5E5951" }}>{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── COMPARATIVO ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 32px 24px" }}>
        <Reveal>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E8590C" }}>
              Comparativo
            </div>
            <h2
              className="hp-section-h2"
              style={{ margin: "14px 0 0", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.015em" }}
            >
              Por que não só uma planilha?
            </h2>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div style={{ marginTop: 40, overflowX: "auto", background: "#FFFFFF", border: "1px solid #E8E3DA", borderRadius: 24 }}>
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 16 }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th scope="col" style={{ padding: "20px 28px", fontWeight: 600, color: "#5E5951", borderBottom: "1px solid #E8E3DA" }} />
                  <th scope="col" style={{ padding: "20px 28px", fontWeight: 600, color: "#5E5951", borderBottom: "1px solid #E8E3DA" }}>Planilha</th>
                  <th scope="col" style={{ padding: "20px 28px", fontWeight: 700, color: "#E8590C", borderBottom: "1px solid #E8E3DA", background: "#FFF7F1" }}>Imov.Plan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Juros compostos e IR regressivo", "Você monta as fórmulas", "Já incluído"],
                  ["Custos de ITBI e documentação", "Estimativa manual", "Cálculo automático"],
                  ["Aportes extras (13º, FGTS)", "Ajuste manual", "Recalcula na hora"],
                  ["Renda de mais de uma pessoa", "Difícil de manter", "Composição integrada"],
                  ["Acesso de qualquer lugar", "Depende do arquivo", "Rascunho na nuvem"],
                ].map(([feature, planilha, imovplan], i, arr) => {
                  const isLast = i === arr.length - 1;
                  const rowBorder = isLast ? undefined : "1px solid #F2EEE7";
                  return (
                    <tr key={feature}>
                      <th scope="row" style={{ padding: "18px 28px", textAlign: "left", fontWeight: 600, borderBottom: rowBorder }}>{feature}</th>
                      <td style={{ padding: "18px 28px", color: "#5E5951", borderBottom: rowBorder }}>{planilha}</td>
                      <td style={{ padding: "18px 28px", fontWeight: 600, borderBottom: rowBorder, background: "#FFF7F1" }}>{imovplan}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 32px 24px", display: "flex", flexWrap: "wrap", gap: 48 }}>
        <Reveal style={{ flex: "1 1 300px", minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E8590C" }}>
            Dúvidas frequentes
          </div>
          <h2
            className="hp-section-h2"
            style={{ margin: "14px 0 0", fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 44, lineHeight: 1.1, letterSpacing: "-0.015em" }}
          >
            Entrada e financiamento, sem enrolação
          </h2>
          <p style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.6, color: "#5E5951" }}>
            Respostas rápidas antes de dar o primeiro passo rumo ao seu imóvel.
          </p>
        </Reveal>
        <Reveal delay={100} style={{ flex: "2 1 540px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          {faqItems.map((item, idx) => (
            <details key={idx} className="hp-faq-details">
              <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, fontWeight: 600, fontSize: 18 }}>
                {item.question}
                <PlusMinusSvg />
              </summary>
              <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.65, color: "#5E5951" }}>{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </section>


      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "56px 32px 48px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "28px 48px",
        }}
      >
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <Logo size="sm" />
          <p style={{ margin: "16px 0 0", maxWidth: 420, fontSize: 14, lineHeight: 1.6, color: "#5E5951" }}>
            Cálculos didáticos. Não constituem recomendação de investimento. Os resultados dependem das
            premissas informadas, como CDI e imposto de renda.
          </p>
        </div>
        <nav aria-label="Rodapé" style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", fontSize: 15, fontWeight: 500, alignItems: "flex-start" }}>
          <Link href="/privacidade" style={{ color: "#5E5951" }}>Política de privacidade</Link>
          <Link href="/termos" style={{ color: "#5E5951" }}>Termos de uso</Link>
        </nav>
        <div style={{ flexBasis: "100%", borderTop: "1px solid #E8E3DA", paddingTop: 22, fontSize: 14, color: "#5E5951" }}>
          © {new Date().getFullYear()} Imov.Plan
        </div>
      </footer>
    </div>
  );
}
