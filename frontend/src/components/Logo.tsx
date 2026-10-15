import React from "react";
import Link from "next/link";

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: "default" | "inverted" | "white";
}

/**
 * Ícone oficial Imov.Plan em SVG vetorial de alta definição.
 * Telhado estilizado (imóvel) sobre barras em crescimento (planejamento financeiro).
 */
export function LogoIcon({
  size = 32,
  variant = "default",
  className = "",
  ...props
}: LogoIconProps) {
  const isInverted = variant === "inverted"; // fundo branco, elementos laranja (para fundos laranja)
  const isWhite = variant === "white"; // fundo transparente, tudo branco

  const bgFill = isInverted ? "#FFFFFF" : isWhite ? "transparent" : "#E8590C";
  const elementFill = isInverted ? "#E8590C" : "#FFFFFF";
  const strokeColor = isInverted ? "#E8590C" : "#FFFFFF";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Ícone Imov.Plan"
      className={`shrink-0 transition-transform ${className}`}
      {...props}
    >
      {/* Container arredondado */}
      {variant !== "white" && (
        <rect width="64" height="64" rx="16" fill={bgFill} />
      )}
      {/* Telhado (Imóvel) */}
      <path
        d="M11 31 L32 13 L53 31"
        fill="none"
        stroke={strokeColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Barras de evolução/planejamento (Plan) */}
      <rect x="20" y="40" width="6" height="10" rx="1.5" fill={elementFill} />
      <rect x="29" y="34" width="6" height="16" rx="1.5" fill={elementFill} />
      <rect x="38" y="28" width="6" height="22" rx="1.5" fill={elementFill} />
    </svg>
  );
}

export interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "default" | "inverted" | "white" | "dark";
  href?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeConfig = {
  sm: { icon: 28, text: "text-lg", tracking: "-tracking-[0.5px]" },
  md: { icon: 34, text: "text-xl", tracking: "-tracking-[0.8px]" },
  lg: { icon: 42, text: "text-2xl lg:text-3xl", tracking: "-tracking-[1px]" },
  xl: { icon: 56, text: "text-4xl lg:text-5xl", tracking: "-tracking-[2px]" },
};

/**
 * Componente principal da marca Imov.Plan com o tom de laranja #E8590C.
 */
export function Logo({
  size = "md",
  showText = true,
  variant = "default",
  href,
  className = "",
  iconClassName = "",
  textClassName = "",
}: LogoProps) {
  const cfg = sizeConfig[size] || sizeConfig.md;
  const isWhite = variant === "white";
  const isInverted = variant === "inverted";
  const isDark = variant === "dark";

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <LogoIcon
        size={cfg.icon}
        variant={isInverted ? "inverted" : "default"}
        className={`drop-shadow-sm ${iconClassName}`}
      />
      {showText && (
        <span
          className={`font-display font-bold leading-none ${cfg.text} ${cfg.tracking} ${
            isWhite || isInverted
              ? "text-white"
              : isDark
              ? "text-white"
              : "text-[#2B1A10] dark:text-foreground"
          } ${textClassName}`}
        >
          Imov
          <span
            className={
              isInverted
                ? "text-[#E8590C]"
                : isDark || isWhite
                ? "text-[#E8590C]"
                : "text-[#E8590C] dark:text-[#E8590C]"
            }
          >
            .Plan
          </span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8590C] rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}
export default Logo;
