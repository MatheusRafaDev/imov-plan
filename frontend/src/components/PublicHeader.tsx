"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";

export function PublicHeader() {
  const { user } = useAuth();

  return (
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
      <style>{`
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
        .hp-nav-link {
          color: #6E685E;
          text-decoration: none;
          font-weight: 500;
          font-size: 15px;
          transition: color 0.15s;
        }
        .hp-nav-link:hover { color: #E8590C; }
        .hp-btn-primary {
          background: #E8590C;
          color: #FFF !important;
          font-weight: 600;
          padding: 12px 22px;
          border-radius: 999px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(232, 89, 12, 0.28);
          border: none;
          cursor: pointer;
        }
        .hp-btn-primary:hover {
          background: #D04E07;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(232, 89, 12, 0.36);
        }
        .hp-btn-header-login {
          text-decoration: none;
          transition: color 0.15s;
        }
        .hp-btn-header-login:hover { color: #E8590C !important; }
        @media (max-width: 767px) {
          .hp-header-inner {
            padding: 12px 16px !important;
            padding-left: calc(16px + env(safe-area-inset-left, 0px)) !important;
            padding-right: calc(16px + env(safe-area-inset-right, 0px)) !important;
          }
          .hp-nav-links { display: none !important; }
          .hp-btn-header-login { padding: 8px 10px !important; font-size: 14px !important; }
          .hp-btn-header-signup { padding: 8px 14px !important; font-size: 14px !important; border-radius: 10px !important; }
        }
      `}</style>
      <div className="hp-header-inner">
        <Logo href="/" size="md" />

        <nav aria-label="Principal" className="hp-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/#como" className="hp-nav-link">Como funciona</Link>
          <Link href="/#recursos" className="hp-nav-link">Recursos</Link>
          <Link href="/#faq" className="hp-nav-link">Perguntas</Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {user ? (
            <Link href="/app/imovel" className="hp-btn-primary hp-btn-header-signup">
              Abrir meu plano
            </Link>
          ) : (
            <>
              <Link
                href="/auth"
                className="hp-btn-header-login"
                style={{
                  padding: "10px 14px",
                  color: "#1D1B19",
                  fontWeight: 600,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                }}
              >
                Entrar
              </Link>
              <Link
                href="/auth?modo=cadastro"
                className="hp-btn-primary hp-btn-header-signup"
                style={{ whiteSpace: "nowrap" }}
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
