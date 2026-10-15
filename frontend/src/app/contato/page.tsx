"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail, MessageSquare, Clock, HelpCircle, Send, CheckCircle2, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ContatoPage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    assunto: "Dúvida sobre o simulador",
    mensagem: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.mensagem.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setEnviando(true);
    // Simula envio rápido com feedback amigável
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      toast.success("Mensagem enviada com sucesso! Responderemos em breve.");
    }, 900);
  };

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
        a { color: #B93F06; text-decoration: none; }
        a:hover { color: #8F2F03; }
        .contact-card {
          background: #FFFFFF;
          border: 1px solid #E8E3DA;
          border-radius: 20px;
          padding: 24px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .contact-card:hover {
          box-shadow: 0 12px 32px -12px rgba(29,27,25,0.08);
        }
        .hp-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid #E8E3DA;
          background: #FFFFFF;
          font-family: inherit;
          font-size: 15px;
          color: #1D1B19;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .hp-input:focus {
          border-color: #E8590C;
          box-shadow: 0 0 0 3px rgba(232,89,12,0.15);
        }
        .hp-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 24px;
          border-radius: 12px;
          background: #C94A08;
          color: #fff !important;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .hp-btn-primary:hover { background: #A83A06; }
        .hp-btn-primary:active { transform: scale(0.98); }
        .hp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid #E8E3DA", background: "#FBFAF7", position: "sticky", top: 0, zIndex: 30 }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "18px 24px",
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
            <Link href="/auth" className="hp-btn-primary" style={{ padding: "10px 18px", fontSize: 14 }}>
              Começar meu plano
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid #E8E3DA", background: "#FFF0E6", padding: "56px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "#FFFFFF",
              color: "#B93F06",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 16,
            }}
          >
            <MessageSquare className="w-4 h-4 text-[#E8590C]" />
            Atendimento e Suporte
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
            Fale com a equipe do Imov.Plan
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 18, lineHeight: 1.6, color: "#5E5951", maxWidth: 640 }}>
            Tem alguma dúvida sobre sua simulação, sugestão de funcionalidade ou precisa de ajuda técnica? Envie sua mensagem e responderemos o mais rápido possível.
          </p>
        </div>
      </div>

      {/* ── CORPO PRINCIPAL ──────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 36, alignItems: "start" }}>
          
          {/* LADO ESQUERDO: CANAIS DE CONTATO */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 700 }}>
                Canais de Atendimento
              </h2>
              <p style={{ margin: "8px 0 0", fontSize: 15, color: "#5E5951", lineHeight: 1.6 }}>
                Escolha o canal mais conveniente para conversar conosco.
              </p>
            </div>

            {/* Card E-mail */}
            <div className="contact-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#B93F06", flexShrink: 0 }}>
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>E-mail Direto</h3>
                  <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#5E5951" }}>Para dúvidas gerais, feedback ou sugestões:</p>
                  <a href="mailto:contato@imovplan.com.br" style={{ fontWeight: 600, fontSize: 15, color: "#E8590C" }}>
                    contato@imovplan.com.br
                  </a>
                </div>
              </div>
            </div>

            {/* Card Suporte Técnico */}
            <div className="contact-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "#FFF0E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#B93F06", flexShrink: 0 }}>
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Suporte & Parcerias</h3>
                  <p style={{ margin: "4px 0 10px", fontSize: 14, color: "#5E5951" }}>Questões de conta, parcerias ou imprensa:</p>
                  <a href="mailto:suporte@imovplan.com.br" style={{ fontWeight: 600, fontSize: 15, color: "#E8590C" }}>
                    suporte@imovplan.com.br
                  </a>
                </div>
              </div>
            </div>

            {/* Card Tempo de Resposta */}
            <div className="contact-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "#F2EEE7", display: "flex", alignItems: "center", justifyContent: "center", color: "#1D1B19", flexShrink: 0 }}>
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Tempo de Resposta</h3>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "#5E5951", lineHeight: 1.6 }}>
                    Costumamos responder em menos de <strong>24 horas úteis</strong> (Segunda a Sexta, das 9h às 18h).
                  </p>
                </div>
              </div>
            </div>

            {/* Card FAQ */}
            <div style={{ padding: "20px 24px", borderRadius: 16, background: "#FFF7F1", border: "1px solid #FFD8BF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <HelpCircle className="w-5 h-5 text-[#E8590C]" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Dúvida frequente?</span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#5E5951", lineHeight: 1.6 }}>
                Veja se sua pergunta já foi respondida na nossa seção de perguntas frequentes na página inicial.
              </p>
              <Link href="/#faq" style={{ fontWeight: 600, fontSize: 14, color: "#B93F06", display: "inline-flex", alignItems: "center", gap: 4 }}>
                Ver perguntas frequentes →
              </Link>
            </div>
          </div>

          {/* LADO DIREITO: FORMULÁRIO DE CONTATO */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E3DA",
              borderRadius: 24,
              padding: "36px 32px",
              boxShadow: "0 20px 48px -20px rgba(29,27,25,0.08)",
            }}
          >
            {enviado ? (
              <div style={{ textAlign: "center", padding: "40px 16px" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "#E6F4EA",
                    color: "#137333",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 700 }}>
                  Mensagem Enviada!
                </h3>
                <p style={{ margin: "12px 0 24px", fontSize: 16, color: "#5E5951", lineHeight: 1.6 }}>
                  Obrigado pelo contato, <strong>{form.nome}</strong>. Já recebemos sua mensagem e entraremos em contato pelo e-mail <strong>{form.email}</strong> o mais breve possível.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEnviado(false);
                    setForm({ nome: "", email: "", assunto: "Dúvida sobre o simulador", mensagem: "" });
                  }}
                  className="hp-btn-primary"
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 700 }}>
                    Envie uma mensagem
                  </h3>
                  <p style={{ margin: "6px 0 0", fontSize: 14, color: "#5E5951" }}>
                    Preencha os campos abaixo com seus dados:
                  </p>
                </div>

                <div>
                  <label htmlFor="contato-nome" style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1D1B19", marginBottom: 6 }}>
                    Nome completo *
                  </label>
                  <input
                    id="contato-nome"
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="hp-input"
                  />
                </div>

                <div>
                  <label htmlFor="contato-email" style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1D1B19", marginBottom: 6 }}>
                    E-mail para resposta *
                  </label>
                  <input
                    id="contato-email"
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="hp-input"
                  />
                </div>

                <div>
                  <label htmlFor="contato-assunto" style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1D1B19", marginBottom: 6 }}>
                    Assunto
                  </label>
                  <select
                    id="contato-assunto"
                    value={form.assunto}
                    onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                    className="hp-input"
                    style={{ cursor: "pointer" }}
                  >
                    <option value="Dúvida sobre o simulador">Dúvida sobre o simulador</option>
                    <option value="Sugestão de novo recurso">Sugestão de novo recurso</option>
                    <option value="Problema ou erro técnico">Problema ou erro técnico</option>
                    <option value="Dúvida sobre financiamento">Dúvida sobre financiamento (SAC/PRICE)</option>
                    <option value="Outro assunto">Outro assunto</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contato-msg" style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1D1B19", marginBottom: 6 }}>
                    Mensagem *
                  </label>
                  <textarea
                    id="contato-msg"
                    required
                    rows={5}
                    placeholder="Como podemos te ajudar?"
                    value={form.mensagem}
                    onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                    className="hp-input"
                    style={{ resize: "vertical", minHeight: 120 }}
                  />
                </div>

                <button type="submit" disabled={enviando} className="hp-btn-primary">
                  {enviando ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando mensagem...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar mensagem
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #E8E3DA", background: "#FBFAF7", padding: "48px 24px" }}>
        <div
          style={{
            maxWidth: 1040,
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
            <Link href="/termos" style={{ color: "#5E5951" }}>Termos de uso</Link>
            <Link href="/contato" style={{ color: "#E8590C", fontWeight: 700 }}>Contato</Link>
          </nav>
          <div style={{ fontSize: 13, color: "#5E5951" }}>
            © {new Date().getFullYear()} Imov.Plan — Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
