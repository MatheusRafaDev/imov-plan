import { ImageResponse } from "next/og";

export const alt = "Imov.Plan - Planejador Financeiro para Entrada do Imóvel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #FFF8F2 0%, #F5EAE0 100%)",
          padding: "60px 80px",
        }}
      >
        {/* Header com Logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" fill="#E8590C" />
            <path
              d="M11 31 L32 13 L53 31"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="20" y="40" width="6" height="10" rx="1.5" fill="#FFFFFF" />
            <rect x="29" y="34" width="6" height="16" rx="1.5" fill="#FFFFFF" />
            <rect x="38" y="28" width="6" height="22" rx="1.5" fill="#FFFFFF" />
          </svg>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginLeft: "18px",
              fontSize: "54px",
              fontWeight: 800,
              color: "#2B1A10",
              letterSpacing: "-1.5px",
            }}
          >
            <span>Imov</span>
            <span style={{ color: "#E8590C" }}>.Plan</span>
          </div>
        </div>

        {/* Mensagem Principal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "52px",
              fontWeight: 800,
              color: "#2B1A10",
              lineHeight: 1.15,
              letterSpacing: "-2px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            O imóvel dos seus sonhos começa com um plano inteligente.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              color: "#665A52",
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            Calcule quanto poupar por mês com rendimento de CDI, imposto regressivo e custos de ITBI.
          </div>
        </div>

        {/* Badges de Destaque */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              background: "#FFFFFF",
              border: "1px solid #EAD8CC",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontSize: "20px",
              fontWeight: 700,
              color: "#E8590C",
              marginRight: "16px",
            }}
          >
            Rendimento no CDI
          </div>
          <div
            style={{
              display: "flex",
              background: "#FFFFFF",
              border: "1px solid #EAD8CC",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontSize: "20px",
              fontWeight: 700,
              color: "#E8590C",
              marginRight: "16px",
            }}
          >
            Tabela SAC vs PRICE
          </div>
          <div
            style={{
              display: "flex",
              background: "#FFFFFF",
              border: "1px solid #EAD8CC",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontSize: "20px",
              fontWeight: 700,
              color: "#E8590C",
            }}
          >
            Custos de ITBI e Cartório
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
